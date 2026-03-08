import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Loader2, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, GraduationCap, Briefcase, Armchair, Megaphone, LogOut, Clock, Users, Lock, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import SignatureCanvas from '@/components/entry/SignatureCanvas';
import RepeatEntryDetector from '@/components/entry/RepeatEntryDetector';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

const DEFAULT_DEPARTMENTS = ['CSE', 'ECE', 'ME', 'CE', 'EE', 'IT', 'MBA', 'MCA', 'BCA', 'BBA', 'B.Sc', 'M.Sc', 'B.Com', 'M.Com', 'BA', 'MA', 'B.Pharma', 'Anatomy', 'Physiology', 'Homeopathy', 'Pharmacy', 'Arts', 'Science', 'Commerce'];
const DEFAULT_YEARS = ['1st', '2nd', '3rd', '4th', '5th'];

type LibrarySettings = {
  allow_seat_booking?: boolean;
  allow_queue?: boolean;
  show_announcements_on_entry?: boolean;
};

export default function StudentEntry() {
  const { libraryId } = useParams<{ libraryId: string }>();
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'entry' | 'exit'>('entry');
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [exitDone, setExitDone] = useState(false);
  const [exitData, setExitData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [libraryName, setLibraryName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryNotFound, setLibraryNotFound] = useState(false);
  const [customDept, setCustomDept] = useState('');
  const [deptSearch, setDeptSearch] = useState('');
  const [showCustomDept, setShowCustomDept] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [seats, setSeats] = useState<any[]>([]);
  const [occupiedSeatIds, setOccupiedSeatIds] = useState<Set<string>>(new Set());
  const [selectedSeatId, setSelectedSeatId] = useState<string>('');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [libSettings, setLibSettings] = useState<LibrarySettings>({});
  const [queueCount, setQueueCount] = useState(0);
  const [joinedQueue, setJoinedQueue] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [lockers, setLockers] = useState<any[]>([]);
  const [occupiedLockerIds, setOccupiedLockerIds] = useState<Set<string>>(new Set());
  const [selectedLockerId, setSelectedLockerId] = useState<string>('');
  const [visitPurpose, setVisitPurpose] = useState('');

  // Exit mode state
  const [exitQuery, setExitQuery] = useState('');
  const [exitPhone, setExitPhone] = useState('');
  const [exitSearching, setExitSearching] = useState(false);
  const [activeEntry, setActiveEntry] = useState<any>(null);

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
        setLibraryLoading(false);
        return;
      }
      setLibraryName(data.name);
      setCollegeName(data.college_name);

      const today = new Date().toISOString().split('T')[0];
      const [seatsRes, entriesRes, annRes, settingsRes, queueRes, deptRes, yearRes, lockerRes, lockerAssignRes] = await Promise.all([
        supabase.from('library_seats').select('*').eq('library_id', libraryId).eq('is_active', true).order('seat_number'),
        supabase.from('student_entries').select('seat_id').eq('library_id', libraryId).eq('entry_date', today).is('exit_time', null),
        supabase.from('announcements').select('*').eq('library_id', libraryId).eq('is_active', true).order('created_at', { ascending: false }).limit(5),
        supabase.from('library_settings').select('allow_seat_booking, allow_queue, show_announcements_on_entry').eq('library_id', libraryId).maybeSingle(),
        supabase.from('seat_queue').select('id', { count: 'exact' }).eq('library_id', libraryId).eq('status', 'waiting'),
        supabase.from('library_departments' as any).select('name').eq('library_id', libraryId).order('name'),
        supabase.from('library_years' as any).select('name').eq('library_id', libraryId).order('name'),
        supabase.from('library_lockers' as any).select('*').eq('library_id', libraryId).eq('is_active', true).order('locker_number'),
        supabase.from('locker_assignments' as any).select('locker_id').eq('library_id', libraryId).eq('status', 'assigned'),
      ]);

      setSeats(seatsRes.data || []);
      const occupied = new Set((entriesRes.data || []).filter((e: any) => e.seat_id).map((e: any) => e.seat_id));
      setOccupiedSeatIds(occupied as Set<string>);
      setAnnouncements(annRes.data || []);
      setLibSettings(settingsRes.data || {});
      setQueueCount(queueRes.count || 0);

      const deptNames = (deptRes.data || []).map((d: any) => d.name);
      setDepartments(deptNames.length > 0 ? deptNames : DEFAULT_DEPARTMENTS);
      const yearNames = (yearRes.data || []).map((y: any) => y.name);
      setYears(yearNames.length > 0 ? yearNames : DEFAULT_YEARS);

      setLockers(lockerRes.data || []);
      const occLockers = new Set((lockerAssignRes.data || []).map((a: any) => a.locker_id));
      setOccupiedLockerIds(occLockers as Set<string>);

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
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl(null);
  };

  const getSignatureDataUrl = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const hasInk = pixels.some((ch, i) => i % 4 === 3 && ch !== 0);
    if (!hasInk) return null;
    return canvas.toDataURL('image/png');
  };

  // ======== EXIT FLOW ========
  const handleExitSearch = async () => {
    if (!libraryId) return;
    if (!exitQuery.trim() && !exitPhone.trim()) {
      toast.error('Enter Roll No or Phone / रोल नं या फोन डालें');
      return;
    }
    setExitSearching(true);
    const today = new Date().toISOString().split('T')[0];
    const q = exitQuery.trim();
    const p = exitPhone.trim();

    // Build OR filter parts
    const orParts: string[] = [];
    if (q) {
      orParts.push(`roll_number.eq.${q}`);
      orParts.push(`employee_id.eq.${q}`);
      orParts.push(`student_name.ilike.%${q}%`);
    }
    if (p) {
      orParts.push(`mobile.eq.${p}`);
    }

    const { data, error } = await supabase
      .from('student_entries')
      .select('*')
      .eq('library_id', libraryId)
      .eq('entry_date', today)
      .is('exit_time', null)
      .or(orParts.join(','))
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setActiveEntry(data);
    } else {
      toast.error('No active entry found / कोई सक्रिय एंट्री नहीं मिली');
      if (error) console.error('Exit search error:', error);
    }
    setExitSearching(false);
  };

  const handleMarkExit = async () => {
    if (!activeEntry || !libraryId) return;
    setLoading(true);
    const now = new Date();
    const exitTime = now.toTimeString().split(' ')[0].substring(0, 5);

    const entryParts = activeEntry.entry_time.split(':');
    const entryMinutes = parseInt(entryParts[0]) * 60 + parseInt(entryParts[1]);
    const exitMinutes = now.getHours() * 60 + now.getMinutes();
    const studyMins = Math.max(0, exitMinutes - entryMinutes);

    const { error } = await supabase.from('student_entries').update({
      exit_time: exitTime,
      study_minutes: studyMins,
    }).eq('id', activeEntry.id);

    // Release locker if assigned
    if (!error && activeEntry.locker_id) {
      await (supabase as any).from('locker_assignments').update({ status: 'released', released_at: now.toISOString() })
        .eq('locker_id', activeEntry.locker_id).eq('status', 'assigned');
    }

    // Free seat - notify queue
    if (!error && activeEntry.seat_id) {
      const { data: nextInQueue } = await supabase
        .from('seat_queue')
        .select('*')
        .eq('library_id', libraryId)
        .eq('status', 'waiting')
        .order('queue_position', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (nextInQueue) {
        await supabase.from('seat_queue').update({ status: 'notified' }).eq('id', nextInQueue.id);
      }
    }

    // Update gamification points
    if (!error) {
      const rollOrEmp = activeEntry.roll_number || activeEntry.employee_id;
      if (rollOrEmp) {
        const { data: existingPoints } = await supabase
          .from('student_points')
          .select('*')
          .eq('library_id', libraryId)
          .eq('student_id', rollOrEmp)
          .maybeSingle();
        if (existingPoints) {
          const newMins = (existingPoints.total_study_minutes || 0) + studyMins;
          const newPoints = (existingPoints.total_points || 0) + Math.floor(studyMins / 30) + 2;
          await supabase.from('student_points').update({
            total_study_minutes: newMins, total_points: newPoints, updated_at: now.toISOString()
          }).eq('id', existingPoints.id);
        }
      }
    }

    setLoading(false);
    if (error) {
      toast.error('Failed to mark exit / एग्ज़िट दर्ज करने में विफल');
    } else {
      const hrs = Math.floor(studyMins / 60);
      const mins = studyMins % 60;
      setExitData({ name: activeEntry.student_name, studyTime: `${hrs}h ${mins}m`, studyMins });
      setExitDone(true);
    }
  };

  // ======== QUEUE ========
  const handleJoinQueue = async () => {
    if (!libraryId) return;
    setLoading(true);
    const { error } = await supabase.from('seat_queue').insert({
      library_id: libraryId,
      student_id: form.rollNumber.trim() || form.employeeId.trim(),
      student_name: form.fullName.trim(),
      phone: form.phone.trim(),
      queue_position: queueCount + 1,
    });
    setLoading(false);
    if (error) toast.error('Failed to join queue');
    else {
      setJoinedQueue(true);
      toast.success(`You are #${queueCount + 1} in queue / आप कतार में #${queueCount + 1} हैं`);
    }
  };

  // ======== SUBMIT ========
  const handleSubmit = async () => {
    if (!libraryId) return;
    const signature = signatureDataUrl ?? getSignatureDataUrl();
    if (!signature) {
      toast.error('Please provide your signature / कृपया हस्ताक्षर करें');
      setStep(4);
      return;
    }

    setLoading(true);
    const dept = showCustomDept ? customDept.trim() : form.department;
    const { error, data: newEntry } = await supabase.from('student_entries').insert({
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
      signature_path: signature,
      visit_purpose: visitPurpose.trim() || null,
      locker_id: selectedLockerId || null,
    } as any).select().single();

    // Assign locker
    if (!error && selectedLockerId && newEntry) {
      await (supabase as any).from('locker_assignments').insert({
        library_id: libraryId,
        locker_id: selectedLockerId,
        student_id: form.userType === 'student' ? form.rollNumber.trim() : form.employeeId.trim(),
        student_name: form.fullName.trim(),
      });
    }

    // Upsert gamification points
    if (!error) {
      const sid = form.userType === 'student' ? form.rollNumber.trim() : form.employeeId.trim();
      const { data: existingPoints } = await supabase
        .from('student_points')
        .select('*')
        .eq('library_id', libraryId)
        .eq('student_id', sid)
        .maybeSingle();
      if (existingPoints) {
        await supabase.from('student_points').update({
          library_visits: (existingPoints.library_visits || 0) + 1,
          total_points: (existingPoints.total_points || 0) + 5,
          student_name: form.fullName.trim(),
          department: dept,
          updated_at: new Date().toISOString(),
        }).eq('id', existingPoints.id);
      } else {
        await supabase.from('student_points').insert({
          library_id: libraryId,
          student_id: sid,
          student_name: form.fullName.trim(),
          department: dept,
          library_visits: 1,
          total_points: 5,
        });
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
  const showSeatBooking = libSettings.allow_seat_booking !== false && seats.length > 0;
  const allSeatsFull = seats.filter(s => s.is_active !== false).length <= occupiedSeatIds.size;
  const showQueue = libSettings.allow_queue !== false && allSeatsFull;
  const showAnnouncements = libSettings.show_announcements_on_entry !== false;
  const filteredDepts = departments.filter(d => d.toLowerCase().includes(deptSearch.toLowerCase()));
  const hasLockers = lockers.length > 0;

  // Loading
  if (libraryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not found
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
        <Footer />
      </div>
    );
  }

  // Exit done
  if (exitDone && exitData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <Card className="w-full max-w-md shadow-card text-center">
          <CardContent className="p-8">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <LogOut className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Exit Recorded! / एग्ज़िट दर्ज!</h2>
            <p className="text-lg font-semibold text-primary mb-1">{exitData.name}</p>
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
              <Clock className="h-4 w-4" />
              <span>Study Time: <strong className="text-foreground">{exitData.studyTime}</strong></span>
            </div>
            <p className="text-muted-foreground text-sm mb-4">{libraryName} - {collegeName}</p>
            <Button onClick={() => { setExitDone(false); setActiveEntry(null); setExitQuery(''); setExitPhone(''); setMode('entry'); }} variant="outline">
              Done / हो गया
            </Button>
          </CardContent>
        </Card>
        <Footer />
      </div>
    );
  }

  // Submitted
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <Card className="w-full max-w-md shadow-card text-center">
          <CardContent className="p-8">
            <div className="h-16 w-16 rounded-full gradient-success flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">{t('entry.success')}</h2>
            <p className="text-muted-foreground text-sm mb-2">{libraryName} - {collegeName}</p>
            {selectedSeatId && (
              <p className="text-sm mb-1">Seat: <strong>{seats.find(s => s.id === selectedSeatId)?.seat_number}</strong></p>
            )}
            {selectedLockerId && (
              <p className="text-sm mb-1">Locker: <strong>{lockers.find((l: any) => l.id === selectedLockerId)?.locker_number}</strong></p>
            )}
            <p className="text-xs text-muted-foreground mt-2">Remember to mark your exit when leaving!</p>
            <Button onClick={() => {
              setSubmitted(false); setStep(1); setAutoFilled(false); setMode('entry');
              setForm({ userType: '', fullName: '', department: '', year: '', rollNumber: '', enrollmentNumber: '', employeeId: '', phone: '', email: '', idCard: '' });
              setSelectedSeatId(''); setSelectedLockerId(''); setVisitPurpose(''); clearSignature(); setJoinedQueue(false);
            }} variant="outline" className="mt-4">
              Submit Another Entry / एक और एंट्री करें
            </Button>
          </CardContent>
        </Card>
        <Footer />
      </div>
    );
  }

  // ============ EXIT MODE ============
  if (mode === 'exit') {
    return (
      <div className="min-h-screen py-6 px-4 bg-background">
        <div className="absolute top-4 right-4"><LanguageToggle /></div>
        <div className="max-w-lg mx-auto">
          <Card className="shadow-card border-border/50">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <LogOut className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-lg">Mark Exit / एग्ज़िट दर्ज करें</CardTitle>
              <CardDescription>{libraryName} - {collegeName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!activeEntry ? (
                <>
                  <p className="text-xs text-center text-muted-foreground">Enter Roll No / Employee ID / Name or Phone to find your entry</p>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Roll No / Employee ID / Name</Label>
                      <Input value={exitQuery} onChange={e => setExitQuery(e.target.value)}
                        placeholder="e.g. 2024001 or Amir"
                        onKeyDown={e => e.key === 'Enter' && handleExitSearch()} />
                    </div>
                    <div className="text-center text-xs text-muted-foreground">OR / या</div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Phone Number / फोन नंबर</Label>
                      <Input value={exitPhone} onChange={e => setExitPhone(e.target.value)}
                        placeholder="98765 43210" type="tel"
                        onKeyDown={e => e.key === 'Enter' && handleExitSearch()} />
                    </div>
                  </div>
                  <Button onClick={handleExitSearch} disabled={exitSearching || (!exitQuery.trim() && !exitPhone.trim())}
                    className="w-full gradient-primary text-primary-foreground h-11">
                    {exitSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Find My Entry / मेरी एंट्री खोजें'}
                  </Button>
                  <Button variant="ghost" className="w-full text-xs" onClick={() => setMode('entry')}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back to Entry / एंट्री पर वापस
                  </Button>
                </>
              ) : (
                <>
                  <div className="rounded-xl border bg-muted/30 p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Name:</span><span className="font-medium">{activeEntry.student_name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Department:</span><span className="font-medium">{activeEntry.department}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Roll/ID:</span><span className="font-medium">{activeEntry.roll_number}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Entry Time:</span><span className="font-medium">{activeEntry.entry_time?.substring(0, 5)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Current Time:</span><span className="font-medium">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div>
                    {activeEntry.seat_id && <div className="flex justify-between"><span className="text-muted-foreground">Seat:</span><span className="font-medium">{seats.find(s => s.id === activeEntry.seat_id)?.seat_number || '-'}</span></div>}
                  </div>
                  <Button onClick={handleMarkExit} disabled={loading}
                    className="w-full gradient-primary text-primary-foreground h-11 text-base">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>
                      <LogOut className="h-4 w-4 mr-2" /> Mark Exit / एग्ज़िट दर्ज करें
                    </>}
                  </Button>
                  <Button variant="ghost" className="w-full text-xs" onClick={() => { setActiveEntry(null); setExitQuery(''); setExitPhone(''); }}>
                    Search Again / फिर से खोजें
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
          <Footer />
        </div>
      </div>
    );
  }

  // ============ ENTRY MODE ============
  return (
    <div className="min-h-screen py-6 px-4 bg-background">
      <div className="absolute top-4 right-4"><LanguageToggle /></div>
      <div className="max-w-lg mx-auto">
        {/* Header with Entry/Exit toggle */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Button
            variant={mode === 'entry' ? 'default' : 'outline'}
            size="sm"
            className={mode === 'entry' ? 'gradient-primary text-primary-foreground' : ''}
            onClick={() => setMode('entry')}
          >
            <BookOpen className="h-4 w-4 mr-1" /> Entry
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMode('exit')}
          >
            <LogOut className="h-4 w-4 mr-1" /> Exit
          </Button>
        </div>

        {/* Announcements */}
        {showAnnouncements && announcements.length > 0 && (
          <div className="space-y-2 mb-4">
            {announcements.map(a => (
              <div key={a.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-accent/10 border border-accent/20">
                <Megaphone className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-accent">{a.title}</p>
                  {a.message && <p className="text-[11px] text-muted-foreground leading-tight">{a.message}</p>}
                </div>
                <Badge variant="outline" className="text-[9px] shrink-0">{a.type}</Badge>
              </div>
            ))}
          </div>
        )}

        {/* Quick stats */}
        {seats.length > 0 && (
          <div className="flex gap-3 justify-center text-xs text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Armchair className="h-3.5 w-3.5 text-green-500" />
              {Math.max(0, seats.length - occupiedSeatIds.size)} seats free
            </span>
            {queueCount > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-orange-500" />
                {queueCount} in queue
              </span>
            )}
          </div>
        )}

        <Card className="shadow-card border-border/50">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-3">
              <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-lg">{libraryName}</CardTitle>
            <CardDescription>{collegeName}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress */}
            <div className="flex items-center gap-1 mb-4">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < step ? 'gradient-primary' : 'bg-muted'}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mb-4">
              Step {step} of {totalSteps}
            </p>

            {/* Step 1: User Type */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-center">Who are you? / आप कौन हैं?</p>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => update('userType', 'student')}
                    className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${form.userType === 'student' ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/50'}`}>
                    <GraduationCap className={`h-10 w-10 ${form.userType === 'student' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`font-semibold text-sm ${form.userType === 'student' ? 'text-primary' : ''}`}>Student / छात्र</span>
                  </button>
                  <button type="button" onClick={() => update('userType', 'teacher')}
                    className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${form.userType === 'teacher' ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/50'}`}>
                    <Briefcase className={`h-10 w-10 ${form.userType === 'teacher' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`font-semibold text-sm ${form.userType === 'teacher' ? 'text-primary' : ''}`}>Teacher / शिक्षक</span>
                  </button>
                </div>

                {form.userType && libraryId && (
                  <RepeatEntryDetector libraryId={libraryId} userType={form.userType} onDetected={handleRepeatDetected} />
                )}

                <Button className="w-full gradient-primary text-primary-foreground h-11" disabled={!canProceedStep2} onClick={() => setStep(2)}>
                  Next / आगे <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {/* Step 2: Personal Details */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name / पूरा नाम *</Label>
                  <Input value={form.fullName} onChange={e => update('fullName', e.target.value)} placeholder="Enter your name" />
                </div>
                <div className="space-y-2">
                  <Label>Department / विभाग *</Label>
                  {!showCustomDept ? (
                    <Select value={form.department} onValueChange={v => {
                      if (v === '__other') { setShowCustomDept(true); update('department', ''); }
                      else update('department', v);
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                      <SelectContent>
                        <div className="p-2">
                          <Input placeholder="Search..." value={deptSearch} onChange={e => setDeptSearch(e.target.value)} className="h-8 text-sm" />
                        </div>
                        {filteredDepts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        <SelectItem value="__other">✏️ Other / अन्य</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex gap-2">
                      <Input value={customDept} onChange={e => setCustomDept(e.target.value)} placeholder="Type department name" />
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
                    ✅ Auto-filled from previous visit
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

            {/* Step 3: Academic / Teacher + Seat + Locker + Purpose */}
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
                            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Roll Number *</Label>
                        <Input value={form.rollNumber} onChange={e => update('rollNumber', e.target.value)} placeholder="e.g. 2024001" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Enrollment Number (Optional)</Label>
                      <Input value={form.enrollmentNumber} onChange={e => update('enrollmentNumber', e.target.value)} placeholder="e.g. EN2024001" />
                    </div>
                    <div className="space-y-2">
                      <Label>ID Card Number (Optional)</Label>
                      <Input value={form.idCard} onChange={e => update('idCard', e.target.value)} placeholder="ID Card Number" />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label>Employee ID / कर्मचारी आईडी *</Label>
                    <Input value={form.employeeId} onChange={e => update('employeeId', e.target.value)} placeholder="e.g. EMP001" />
                  </div>
                )}

                {/* Visit Purpose */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" /> Purpose (Optional) / उद्देश्य
                  </Label>
                  <Select value={visitPurpose} onValueChange={setVisitPurpose}>
                    <SelectTrigger><SelectValue placeholder="Select or skip" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="study">📚 Study / पढ़ाई</SelectItem>
                      <SelectItem value="project">💻 Project Work / प्रोजेक्ट</SelectItem>
                      <SelectItem value="exam_prep">📝 Exam Preparation / परीक्षा तैयारी</SelectItem>
                      <SelectItem value="research">🔬 Research / शोध</SelectItem>
                      <SelectItem value="reading">📖 Reading / पठन</SelectItem>
                      <SelectItem value="group_study">👥 Group Study / सामूहिक अध्ययन</SelectItem>
                      <SelectItem value="other">🔹 Other / अन्य</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Seat Selection - Optional */}
                {showSeatBooking && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Armchair className="h-4 w-4" /> Select Seat (Optional) / सीट चुनें
                    </Label>
                    {!allSeatsFull ? (
                      <div className="grid grid-cols-5 gap-1.5 max-h-32 overflow-y-auto p-2 border rounded-lg">
                        <button type="button" onClick={() => setSelectedSeatId('')}
                          className={`text-[10px] p-1.5 rounded border transition-all ${!selectedSeatId ? 'border-primary bg-primary/10 font-bold' : 'border-border hover:border-primary/50'}`}>
                          Skip
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
                    ) : (
                      <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-center space-y-2">
                        <p className="text-sm text-destructive font-medium">All seats are full / सब सीटें भरी हुई हैं</p>
                        {showQueue && !joinedQueue && (
                          <Button size="sm" variant="outline" onClick={handleJoinQueue} disabled={loading}
                            className="gap-1 border-primary text-primary">
                            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Users className="h-3 w-3" />}
                            Join Queue (#{queueCount + 1}) / कतार में लगें
                          </Button>
                        )}
                        {joinedQueue && (
                          <p className="text-xs text-primary">✅ You are in the queue!</p>
                        )}
                        <p className="text-[10px] text-muted-foreground">You can still enter without a seat</p>
                      </div>
                    )}
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-green-500" /> Free</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-destructive" /> Occupied</span>
                    </div>
                  </div>
                )}

                {/* Locker Selection - Optional */}
                {hasLockers && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Lock className="h-4 w-4" /> Locker (Optional) / लॉकर
                    </Label>
                    <div className="grid grid-cols-5 gap-1.5 max-h-24 overflow-y-auto p-2 border rounded-lg">
                      <button type="button" onClick={() => setSelectedLockerId('')}
                        className={`text-[10px] p-1.5 rounded border transition-all ${!selectedLockerId ? 'border-primary bg-primary/10 font-bold' : 'border-border hover:border-primary/50'}`}>
                        Skip
                      </button>
                      {lockers.map((l: any) => {
                        const isOcc = occupiedLockerIds.has(l.id);
                        return (
                          <button key={l.id} type="button" disabled={isOcc}
                            onClick={() => setSelectedLockerId(l.id)}
                            className={`text-[10px] p-1.5 rounded border transition-all ${
                              isOcc ? 'bg-destructive/10 text-destructive/50 cursor-not-allowed' :
                              selectedLockerId === l.id ? 'border-primary bg-primary/10 font-bold text-primary' :
                              'border-border hover:border-primary/50'
                            }`}>
                            {l.locker_number}
                          </button>
                        );
                      })}
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
                  <Button className="flex-1 gradient-primary text-primary-foreground h-11"
                    onClick={() => {
                      const sig = getSignatureDataUrl();
                      if (!sig) { toast.error('Please sign first / पहले हस्ताक्षर करें'); return; }
                      setSignatureDataUrl(sig);
                      setStep(5);
                    }}>
                    Review <ChevronRight className="h-4 w-4 ml-1" />
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
                  {visitPurpose && <div className="flex justify-between"><span className="text-muted-foreground">Purpose:</span><span className="font-medium capitalize">{visitPurpose.replace('_', ' ')}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">Date:</span><span className="font-medium">{new Date().toLocaleDateString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Time:</span><span className="font-medium">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div>
                  {selectedSeatId && <div className="flex justify-between"><span className="text-muted-foreground">Seat:</span><span className="font-medium">{seats.find(s => s.id === selectedSeatId)?.seat_number || '-'}</span></div>}
                  {selectedLockerId && <div className="flex justify-between"><span className="text-muted-foreground">Locker:</span><span className="font-medium">{lockers.find((l: any) => l.id === selectedLockerId)?.locker_number || '-'}</span></div>}
                  {signatureDataUrl && (
                    <div className="space-y-2 pt-2">
                      <span className="text-muted-foreground">Signature:</span>
                      <img src={signatureDataUrl} alt="Signature" className="h-16 w-full rounded-md border border-border bg-background object-contain" />
                    </div>
                  )}
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
        <Footer />
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="text-center text-[10px] text-muted-foreground mt-6 pb-4">
      © {new Date().getFullYear()} S_Amir786. All rights reserved.
    </div>
  );
}
