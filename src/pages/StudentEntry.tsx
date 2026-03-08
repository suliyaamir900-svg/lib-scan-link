import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function StudentEntry() {
  const { libraryId } = useParams<{ libraryId: string }>();
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [libraryName, setLibraryName] = useState('');
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryNotFound, setLibraryNotFound] = useState(false);
  const [form, setForm] = useState({
    studentName: '', department: '', year: '', rollNumber: '', mobile: '', email: '', idCard: '',
  });

  useEffect(() => {
    if (!libraryId) return;
    const fetchLibrary = async () => {
      // Use anon key - public access
      const { data, error } = await supabase
        .from('libraries')
        .select('name, college_name')
        .eq('id', libraryId)
        .maybeSingle();
      if (error || !data) {
        setLibraryNotFound(true);
      } else {
        setLibraryName(`${data.name} - ${data.college_name}`);
      }
      setLibraryLoading(false);
    };
    fetchLibrary();
  }, [libraryId]);

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => setDrawing(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!libraryId) return;
    if (!form.department || !form.year) {
      toast.error('Please select Department and Year / विभाग और वर्ष चुनें');
      return;
    }
    if (isCanvasBlank()) {
      toast.error('Please provide your signature / कृपया हस्ताक्षर करें');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('student_entries').insert({
      library_id: libraryId,
      student_name: form.studentName.trim(),
      department: form.department,
      year: form.year,
      roll_number: form.rollNumber.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim() || null,
      id_card_number: form.idCard.trim() || null,
      device_info: navigator.userAgent,
    });
    setLoading(false);

    if (error) {
      toast.error('Failed to submit / जमा करने में विफल');
      console.error(error);
    } else {
      setSubmitted(true);
      toast.success(t('entry.success'));
    }
  };

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
            <Button onClick={() => { setSubmitted(false); setForm({ studentName: '', department: '', year: '', rollNumber: '', mobile: '', email: '', idCard: '' }); clearSignature(); }} variant="outline" className="mt-4">
              Submit Another Entry / एक और एंट्री करें
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-background">
      <div className="absolute top-4 right-4"><LanguageToggle /></div>
      <div className="max-w-lg mx-auto">
        <Card className="shadow-card border-border/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle>{t('entry.title')}</CardTitle>
            <CardDescription>{libraryName}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('entry.student_name')} *</Label>
                <Input value={form.studentName} onChange={e => update('studentName', e.target.value)} placeholder="Enter your name / अपना नाम लिखें" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('entry.department')} *</Label>
                  <Select value={form.department} onValueChange={v => update('department', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {['CSE', 'ECE', 'ME', 'CE', 'EE', 'IT', 'MBA', 'BCA', 'BBA', 'Arts', 'Science', 'Commerce', 'Other'].map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('entry.year')} *</Label>
                  <Select value={form.year} onValueChange={v => update('year', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {['1st', '2nd', '3rd', '4th', '5th'].map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('entry.roll_number')} *</Label>
                  <Input value={form.rollNumber} onChange={e => update('rollNumber', e.target.value)} placeholder="e.g. 2024001" required />
                </div>
                <div className="space-y-2">
                  <Label>{t('entry.mobile')} *</Label>
                  <Input value={form.mobile} onChange={e => update('mobile', e.target.value)} type="tel" placeholder="+91 98765 43210" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('entry.email')}</Label>
                <Input value={form.email} onChange={e => update('email', e.target.value)} type="email" placeholder="student@email.com" />
              </div>
              <div className="space-y-2">
                <Label>{t('entry.id_card')}</Label>
                <Input value={form.idCard} onChange={e => update('idCard', e.target.value)} placeholder="ID Card Number" />
              </div>

              {/* Signature */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>{t('entry.signature')} *</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={clearSignature}>{t('entry.clear_signature')}</Button>
                </div>
                <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-white">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={150}
                    className="w-full cursor-crosshair touch-none"
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                  />
                  <p className="text-xs text-muted-foreground text-center py-1 bg-muted/30">{t('entry.sign_here')}</p>
                </div>
              </div>

              <Button type="submit" className="w-full gradient-primary text-primary-foreground shadow-primary h-11 text-base" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('entry.submit')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
