import { useState, useEffect, forwardRef, type ComponentProps, type ElementType } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Loader2, Eye, EyeOff, Mail, Lock, User, Phone, Building2, Library, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

type InputWithIconProps = ComponentProps<typeof Input> & {
  icon: ElementType;
};

const InputWithIcon = forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ icon: Icon, className, ...props }, ref) => (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input ref={ref} {...props} className={["pl-10 h-11 rounded-xl", className].filter(Boolean).join(' ')} />
    </div>
  )
);

InputWithIcon.displayName = 'InputWithIcon';

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

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const update = (key: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [key]: value }));

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
      return;
    }

    toast.success('Account created! Check your email to verify. / अकाउंट बन गया! ईमेल वेरिफाई करें।');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden bg-background">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-primary/8 blur-3xl animate-float" />
        <div
          className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-accent/8 blur-3xl animate-float"
          style={{ animationDelay: '3s' }}
        />
      </div>

      <div className="absolute top-4 left-4">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Button>
        </Link>
      </div>

      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="shadow-elevated border-border/50 relative z-10 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-secondary to-accent" />

          <CardHeader className="pt-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="gradient-primary shadow-primary flex h-14 w-14 items-center justify-center rounded-2xl">
                <BookOpen className="h-7 w-7 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">{t('auth.signup_library')}</CardTitle>
            <CardDescription>{t('app.tagline')}</CardDescription>
          </CardHeader>

          <CardContent className="pb-8">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('auth.library_name')}</Label>
                  <InputWithIcon
                    icon={Library}
                    value={form.libraryName}
                    onChange={e => update('libraryName', e.target.value)}
                    placeholder="Central Library"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('auth.college_name')}</Label>
                  <InputWithIcon
                    icon={Building2}
                    value={form.collegeName}
                    onChange={e => update('collegeName', e.target.value)}
                    placeholder="ABC College"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('auth.admin_name')}</Label>
                  <InputWithIcon
                    icon={User}
                    value={form.adminName}
                    onChange={e => update('adminName', e.target.value)}
                    placeholder="Rahul Sharma"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('auth.phone')}</Label>
                  <InputWithIcon
                    icon={Phone}
                    value={form.phone}
                    onChange={e => update('phone', e.target.value)}
                    type="tel"
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('auth.email')}</Label>
                <InputWithIcon
                  icon={Mail}
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  type="email"
                  placeholder="admin@college.edu"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('auth.password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={form.password}
                      onChange={e => update('password', e.target.value)}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="h-11 rounded-xl pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('auth.confirm_password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={form.confirmPassword}
                      onChange={e => update('confirmPassword', e.target.value)}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="h-11 rounded-xl pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="gradient-primary shadow-primary h-11 w-full rounded-xl text-base font-semibold text-primary-foreground"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.signup')}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t('auth.have_account')}{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
