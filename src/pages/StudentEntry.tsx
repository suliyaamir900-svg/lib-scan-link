import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Loader2, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, UserCircle, GraduationCap, Briefcase, Armchair } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import SignatureCanvas from '@/components/entry/SignatureCanvas';
import RepeatEntryDetector from '@/components/entry/RepeatEntryDetector';

const DEFAULT_DEPARTMENTS = ['CSE', 'ECE', 'ME', 'CE', 'EE', 'IT', 'MBA', 'MCA', 'BCA', 'BBA', 'B.Sc', 'M.Sc', 'B.Com', 'M.Com', 'BA', 'MA', 'B.Pharma', 'Anatomy', 'Physiology', 'Homeopathy', 'Pharmacy', 'Arts', 'Science', 'Commerce'];

export default function StudentEntry() {
  const { libraryId } = useParams<{ libraryId: string }>();
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [libraryName, setLibraryName] = useState('');
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryNotFound, setLibraryNotFound] = useState(false);
  const [customDept, setCustomDept] = useState('');
  const [deptSearch, setDeptSearch] = useState('');
  const [showCustomDept, setShowCustomDept] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [seats, setSeats] = useState<any[]>([]);
  const [occupiedSeatIds, setOccupiedSeatIds] = useState<Set<string>>(new Set());
  const [selectedSeatId, setSelectedSeatId] = useState<string>('');

  const [form, setForm] = useState({
    userType: '' as 'student' | 'teacher' | '',
    fullName: '',
    department: '',
    year: '',
    rollNumber: '',
    enrollmentNumber: '',
    employeeId: '',
    phone: '',
    email: '',
    idCard: '',
  });

  useEffect(() => {
    if (!libraryId) return;
    const fetchLibrary = async () => {
      const { data, error } = await supabase
        .from('libraries')
        .select('name, college_name')
        .eq('id', libraryId)
        .maybeSingle();
      if (error || !data) {
        setLibraryNotFound(true);
      } else {
        setLibraryName(`${data.name} - ${data.college_name}`);
        // Fetch seats
        const { data: seatsData } = await supabase.from('library_seats').select('*').eq('library_id', libraryId).eq('is_active', true).order('seat_number');
        setSeats(seatsData || []);
        // Fetch today's entries to find occupied seats
        const today = new Date().toISOString().split('T')[0];
        const { data: todayEntries } = await supabase.from('student_entries').select('seat_id').eq('library_id', libraryId).eq('entry_date', today).is('exit_time', null);
        const occupied = new Set((todayEntries || []).filter(e => e.seat_id).map(e => e.seat_id));
        setOccupiedSeatIds(occupied as Set<string>);
      }
      setLibraryLoading(false);
    };
    fetchLibrary();
  }, [libraryId]);

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleRepeatDetected = (data: any) => {
    setForm(prev => ({
      ...prev,
      fullName: data.name || data.student_name || prev.fullName,
      department: data.department || prev.department,
      year: data.year || prev.year,
      rollNumber: data.roll_number || prev.rollNumber,
      enrollmentNumber: data.enrollment_number || prev.enrollmentNumber,
      employeeId: data.employee_id || prev.employeeId,
      phone: data.phone || data.mobile || prev.phone,
      email: data.email || prev.email,
    }));
    setAutoFilled(true);
    toast.success('Details auto-filled! / विवरण ऑटो-फिल हो गए!');
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const isCanvasBlank = () => {
    const canvas = canvasRef.current;
    if (!canvas) return true;
    const ctx = canvas.getContext('2d');
    if (!ctx) return true;
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    return !pixels.some((ch, i) => i % 4 === 3 && ch !== 0);
  };

  const handleSubmit = async () => {
    if (!libraryId) return;
    if (isCanvasBlank()) {
      toast.error('Please provide your signature / कृपया हस्ताक्षर करें');
      return;
    }

    setLoading(true);
    const dept = showCustomDept ? customDept.trim() : form.department;

    // Insert entry
    const { error } = await supabase.from('student_entries').insert({
      library_id: libraryId,
      user_type: form.userType,
      student_name: form.fullName.trim(),
      department: dept,
      year: form.userType === 'student' ? form.year : '-',
      roll_number: form.userType === 'student' ? form.rollNumber.trim() : form.employeeId.trim(),
      enrollment_number: form.enrollmentNumber.trim() || null,
      employee_id: form.userType === 'teacher' ? form.employeeId.trim() : null,
      mobile: form.phone.trim(),
      email: form.email.trim() || null,
      id_card_number: form.idCard.trim() || null,
      device_info: navigator.userAgent,
      seat_id: selectedSeatId || null,
    });

    // Auto-register in students/teachers table
    if (!error) {
      if (form.userType === 'student') {
        await (supabase as any).from('students').upsert({
          library_id: libraryId,
          name: form.fullName.trim(),
          department: dept,
          year: form.year,
          roll_number: form.rollNumber.trim(),
          enrollment_number: form.enrollmentNumber.trim() || null,
          phone: form.phone.trim(),
          email: form.email.trim() || null,
        }, { onConflict: 'library_id,roll_number' });
      } else {
        await (supabase as any).from('teachers').upsert({
          library_id: libraryId,
          name: form.fullName.trim(),
          department: dept,
          employee_id: form.employeeId.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
        }, { onConflict: 'library_id,employee_id' });
      }
    }

    setLoading(false);
    if (error) {
      toast.error('Failed to submit / जमा करने में विफल');
      console.error(error);
    } else {
      setSubmitted(true);
      toast.success(t('entry.success'));
    }
  };

  const canProceedStep2 = form.userType !== '';
  const canProceedStep3 = form.fullName.trim() !== '' && (showCustomDept ? customDept.trim() !== '' : form.department !== '') && form.phone.trim() !== '';
  const canProceedStep4 = form.userType === 'student'
    ? form.year !== '' && form.rollNumber.trim() !== ''
    : form.employeeId.trim() !== '';

  const totalSteps = 5;
  const stepLabels = ['User Type', 'Personal Info', form.userType === 'student' ? 'Academic Info' : 'Teacher Info', 'Signature', 'Submit'];

  if (libraryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (libraryNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <Card className="w-full max-w-md shadow-card text-center">
          <CardContent className="p-8">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">Library Not Found</h2>
            <p className="text-muted-foreground text-sm">Invalid QR code or library link. / अमान्य QR कोड या लाइब्रेरी लिंक।</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <Card className="w-full max-w-md shadow-card text-center">
          <CardContent className="p-8">
            <div className="h-16 w-16 rounded-full gradient-success flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">{t('entry.success')}</h2>
            <p className="text-muted-foreground text-sm">{libraryName}</p>
            <Button onClick={() => {
              setSubmitted(false);
              setStep(1);
              setAutoFilled(false);
              setForm({ userType: '', fullName: '', department: '', year: '', rollNumber: '', enrollmentNumber: '', employeeId: '', phone: '', email: '', idCard: '' });
              clearSignature();
            }} variant="outline" className="mt-4">
              Submit Another Entry / एक और एंट्री करें
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredDepts = DEFAULT_DEPARTMENTS.filter(d =>
    d.toLowerCase().includes(deptSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen py-6 px-4 bg-background">
      <div className="absolute top-4 right-4"><LanguageToggle /></div>
      <div className="max-w-lg mx-auto">
        <Card className="shadow-card border-border/50">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-3">
              <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-lg">{t('entry.title')}</CardTitle>
            <CardDescription>{libraryName}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress Bar */}
            <div className="flex items-center gap-1 mb-6">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < step ? 'gradient-primary' : 'bg-muted'}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mb-4">
              Step {step} of {totalSteps}: {stepLabels[step - 1]}
            </p>

            {/* Step 1: User Type */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-center mb-2">Who are you? / आप कौन हैं?</p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => update('userType', 'student')}
                    className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${form.userType === 'student' ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/50'}`}
                  >
                    <GraduationCap className={`h-10 w-10 ${form.userType === 'student' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`font-semibold text-sm ${form.userType === 'student' ? 'text-primary' : ''}`}>Student / छात्र</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => update('userType', 'teacher')}
                    className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${form.userType === 'teacher' ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/50'}`}
                  >
                    <Briefcase className={`h-10 w-10 ${form.userType === 'teacher' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`font-semibold text-sm ${form.userType === 'teacher' ? 'text-primary' : ''}`}>Teacher / शिक्षक</span>
                  </button>
                </div>

                {form.userType && libraryId && (
                  <RepeatEntryDetector
                    libraryId={libraryId}
                    userType={form.userType}
                    onDetected={handleRepeatDetected}
                  />
                )}

                <Button
                  className="w-full gradient-primary text-primary-foreground h-11"
                  disabled={!canProceedStep2}
                  onClick={() => setStep(2)}
                >
                  Next / आगे <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {/* Step 2: Personal Details */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name / पूरा नाम *</Label>
                  <Input value={form.fullName} onChange={e => update('fullName', e.target.value)} placeholder="Enter your name / अपना नाम लिखें" />
                </div>

                <div className="space-y-2">
                  <Label>Department / विभाग *</Label>
                  {!showCustomDept ? (
                    <>
                      <Select value={form.department} onValueChange={v => {
                        if (v === '__other') {
                          setShowCustomDept(true);
                          update('department', '');
                        } else {
                          update('department', v);
                        }
                      }}>
                        <SelectTrigger><SelectValue placeholder="Select Department / विभाग चुनें" /></SelectTrigger>
                        <SelectContent>
                          <div className="p-2">
                            <Input
                              placeholder="Search / खोजें..."
                              value={deptSearch}
                              onChange={e => setDeptSearch(e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          {filteredDepts.map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                          <SelectItem value="__other">✏️ Other / अन्य</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <Input value={customDept} onChange={e => setCustomDept(e.target.value)} placeholder="Type department name / विभाग का नाम लिखें" />
                      <Button type="button" variant="outline" size="sm" onClick={() => { setShowCustomDept(false); setCustomDept(''); }}>Back</Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Phone / फोन *</Label>
                  <Input value={form.phone} onChange={e => update('phone', e.target.value)} type="tel" placeholder="+91 98765 43210" />
                </div>

                <div className="space-y-2">
                  <Label>Email / ईमेल (Optional)</Label>
                  <Input value={form.email} onChange={e => update('email', e.target.value)} type="email" placeholder="email@example.com" />
                </div>

                {autoFilled && (
                  <div className="p-2 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary text-center">
                    ✅ Auto-filled from previous visit / पिछली विज़िट से ऑटो-फिल
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(1)}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button className="flex-1 gradient-primary text-primary-foreground h-11" disabled={!canProceedStep3} onClick={() => setStep(3)}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Academic / Teacher Details */}
            {step === 3 && (
              <div className="space-y-4">
                {form.userType === 'student' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Year / वर्ष *</Label>
                        <Select value={form.year} onValueChange={v => update('year', v)}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {['1st', '2nd', '3rd', '4th', '5th'].map(y => (
                              <SelectItem key={y} value={y}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Roll Number / रोल नंबर *</Label>
                        <Input value={form.rollNumber} onChange={e => update('rollNumber', e.target.value)} placeholder="e.g. 2024001" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Enrollment Number / नामांकन संख्या</Label>
                      <Input value={form.enrollmentNumber} onChange={e => update('enrollmentNumber', e.target.value)} placeholder="e.g. EN2024001" />
                    </div>
                    <div className="space-y-2">
                      <Label>ID Card Number / आईडी कार्ड नंबर</Label>
                      <Input value={form.idCard} onChange={e => update('idCard', e.target.value)} placeholder="ID Card Number" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Employee ID / कर्मचारी आईडी *</Label>
                      <Input value={form.employeeId} onChange={e => update('employeeId', e.target.value)} placeholder="e.g. EMP001" />
                    </div>
                  </>
                )}

                {/* Seat Selection */}
                {seats.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Armchair className="h-4 w-4" /> Select Seat / सीट चुनें (Optional)</Label>
                    <div className="grid grid-cols-5 gap-1.5 max-h-32 overflow-y-auto p-2 border rounded-lg">
                      <button type="button" onClick={() => setSelectedSeatId('')}
                        className={`text-[10px] p-1.5 rounded border transition-all ${!selectedSeatId ? 'border-primary bg-primary/10 font-bold' : 'border-border hover:border-primary/50'}`}>
                        None
                      </button>
                      {seats.map(s => {
                        const isOccupied = occupiedSeatIds.has(s.id);
                        return (
                          <button key={s.id} type="button" disabled={isOccupied}
                            onClick={() => setSelectedSeatId(s.id)}
                            className={`text-[10px] p-1.5 rounded border transition-all ${
                              isOccupied ? 'bg-destructive/10 text-destructive/50 cursor-not-allowed' :
                              selectedSeatId === s.id ? 'border-primary bg-primary/10 font-bold text-primary' :
                              'border-border hover:border-primary/50'
                            }`}>
                            {s.seat_number}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-green-500" /> Free</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-destructive" /> Occupied</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(2)}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button className="flex-1 gradient-primary text-primary-foreground h-11" disabled={!canProceedStep4} onClick={() => setStep(4)}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Signature */}
            {step === 4 && (
              <div className="space-y-4">
                <SignatureCanvas canvasRef={canvasRef} onClear={clearSignature} />
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(3)}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button className="flex-1 gradient-primary text-primary-foreground h-11" onClick={() => setStep(5)}>
                    Review / समीक्षा <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Review & Submit */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="rounded-xl border bg-muted/30 p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Type:</span><span className="font-medium capitalize">{form.userType}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Name:</span><span className="font-medium">{form.fullName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Department:</span><span className="font-medium">{showCustomDept ? customDept : form.department}</span></div>
                  {form.userType === 'student' && (
                    <>
                      <div className="flex justify-between"><span className="text-muted-foreground">Year:</span><span className="font-medium">{form.year}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Roll No:</span><span className="font-medium">{form.rollNumber}</span></div>
                      {form.enrollmentNumber && <div className="flex justify-between"><span className="text-muted-foreground">Enrollment:</span><span className="font-medium">{form.enrollmentNumber}</span></div>}
                    </>
                  )}
                  {form.userType === 'teacher' && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Employee ID:</span><span className="font-medium">{form.employeeId}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-muted-foreground">Phone:</span><span className="font-medium">{form.phone}</span></div>
                  {form.email && <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><span className="font-medium">{form.email}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">Date:</span><span className="font-medium">{new Date().toLocaleDateString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Time:</span><span className="font-medium">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(4)}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button className="flex-1 gradient-primary text-primary-foreground shadow-primary h-11 text-base" disabled={loading} onClick={handleSubmit}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : '✅ Submit / जमा करें'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
