import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Signup() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    libraryName: '',
    collegeName: '',
    adminName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match / पासवर्ड मेल नहीं खाते');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          library_name: form.libraryName,
          college_name: form.collegeName,
          admin_name: form.adminName,
          phone: form.phone,
        },
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created! Check your email to verify. / अकाउंट बन गया! ईमेल वेरिफाई करें।');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden bg-background">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full gradient-primary blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full gradient-accent blur-3xl" />
      </div>
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <Card className="w-full max-w-lg shadow-card border-border/50 relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t('auth.signup_library')}</CardTitle>
          <CardDescription>{t('app.tagline')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('auth.library_name')}</Label>
                <Input value={form.libraryName} onChange={e => update('libraryName', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.college_name')}</Label>
                <Input value={form.collegeName} onChange={e => update('collegeName', e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('auth.admin_name')}</Label>
                <Input value={form.adminName} onChange={e => update('adminName', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.phone')}</Label>
                <Input value={form.phone} onChange={e => update('phone', e.target.value)} type="tel" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('auth.email')}</Label>
              <Input value={form.email} onChange={e => update('email', e.target.value)} type="email" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('auth.password')}</Label>
                <Input value={form.password} onChange={e => update('password', e.target.value)} type="password" required />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.confirm_password')}</Label>
                <Input value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} type="password" required />
              </div>
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground shadow-primary" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.signup')}
            </Button>
          </form>
          <p className="text-center text-sm mt-4 text-muted-foreground">
            {t('auth.have_account')}{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">{t('auth.login')}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
