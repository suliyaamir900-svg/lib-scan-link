import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Loader2, Eye, EyeOff, Mail, Lock, User, Phone, Building2, Library } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function Signup() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    libraryName: '',
    collegeName: '',
    adminName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  if (user) {
    navigate('/dashboard');
    return null;
  }

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match / पासवर्ड मेल नहीं खाते');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters / पासवर्ड कम से कम 6 अक्षर');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          library_name: form.libraryName.trim(),
          college_name: form.collegeName.trim(),
          admin_name: form.adminName.trim(),
          phone: form.phone.trim(),
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

  const InputWithIcon = ({ icon: Icon, ...props }: any) => (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input {...props} className="pl-10" />
    </div>
  );

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
            <div className="h-14 w-14 rounded-xl gradient-primary flex items-center justify-center shadow-primary">
              <BookOpen className="h-7 w-7 text-primary-foreground" />
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
                <InputWithIcon icon={Library} value={form.libraryName} onChange={(e: any) => update('libraryName', e.target.value)} placeholder="Central Library" required />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.college_name')}</Label>
                <InputWithIcon icon={Building2} value={form.collegeName} onChange={(e: any) => update('collegeName', e.target.value)} placeholder="ABC College" required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('auth.admin_name')}</Label>
                <InputWithIcon icon={User} value={form.adminName} onChange={(e: any) => update('adminName', e.target.value)} placeholder="Rahul Sharma" required />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.phone')}</Label>
                <InputWithIcon icon={Phone} value={form.phone} onChange={(e: any) => update('phone', e.target.value)} type="tel" placeholder="+91 98765 43210" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('auth.email')}</Label>
              <InputWithIcon icon={Mail} value={form.email} onChange={(e: any) => update('email', e.target.value)} type="email" placeholder="admin@college.edu" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={form.password} onChange={e => update('password', e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('auth.confirm_password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10" required />
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground shadow-primary h-11 text-base" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.signup')}
            </Button>
          </form>
          <p className="text-center text-sm mt-5 text-muted-foreground">
            {t('auth.have_account')}{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">{t('auth.login')}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
