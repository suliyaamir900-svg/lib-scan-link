import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentEntry() {
  const { libraryId } = useParams<{ libraryId: string }>();
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    studentName: '', department: '', year: '', rollNumber: '', mobile: '', email: '', idCard: '',
  });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'hsl(230, 25%, 10%)';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => setDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!libraryId) return;
    setLoading(true);
    // TODO: Save to Supabase after schema is created
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setSubmitted(true);
    toast.success(t('entry.success'));
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <Card className="w-full max-w-md shadow-card text-center">
          <CardContent className="p-8">
            <div className="h-16 w-16 rounded-full gradient-success flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">{t('entry.success')}</h2>
            <p className="text-muted-foreground text-sm">Library ID: {libraryId}</p>
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
            <CardDescription>Library: {libraryId}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('entry.student_name')} *</Label>
                <Input value={form.studentName} onChange={e => update('studentName', e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('entry.department')} *</Label>
                  <Select value={form.department} onValueChange={v => update('department', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Input value={form.rollNumber} onChange={e => update('rollNumber', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>{t('entry.mobile')} *</Label>
                  <Input value={form.mobile} onChange={e => update('mobile', e.target.value)} type="tel" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('entry.email')}</Label>
                <Input value={form.email} onChange={e => update('email', e.target.value)} type="email" />
              </div>
              <div className="space-y-2">
                <Label>{t('entry.id_card')}</Label>
                <Input value={form.idCard} onChange={e => update('idCard', e.target.value)} />
              </div>

              {/* Signature */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>{t('entry.signature')} *</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={clearSignature}>{t('entry.clear_signature')}</Button>
                </div>
                <div className="border rounded-lg overflow-hidden bg-card">
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
                  <p className="text-xs text-muted-foreground text-center py-1">{t('entry.sign_here')}</p>
                </div>
              </div>

              <Button type="submit" className="w-full gradient-primary text-primary-foreground shadow-primary" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('entry.submit')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
