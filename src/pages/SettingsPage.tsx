import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Save, Loader2, Library, Building2, User, Phone, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', college_name: '', admin_name: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(data);
      if (data) setForm({ name: data.name, college_name: data.college_name, admin_name: data.admin_name, phone: data.phone || '' });
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const handleSave = async () => {
    if (!library) return;
    setSaving(true);
    const { error } = await supabase.from('libraries').update({
      name: form.name.trim(),
      college_name: form.college_name.trim(),
      admin_name: form.admin_name.trim(),
      phone: form.phone.trim(),
      updated_at: new Date().toISOString(),
    }).eq('id', library.id);
    setSaving(false);
    if (error) {
      toast.error('Failed to save / सेव करने में विफल');
    } else {
      toast.success('Settings saved! / सेटिंग्स सेव हो गईं!');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters / कम से कम 6 अक्षर');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match / पासवर्ड मेल नहीं खाते');
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
    setChangingPassword(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password changed! / पासवर्ड बदल गया!');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" />
        {t('nav.settings')}
      </h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Library Profile */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Library Profile / लाइब्रेरी प्रोफ़ाइल</CardTitle>
              <CardDescription>Update your library information / अपनी लाइब्रेरी की जानकारी अपडेट करें</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Library className="h-4 w-4" /> Library Name / लाइब्रेरी का नाम</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Building2 className="h-4 w-4" /> College Name / कॉलेज का नाम</Label>
                <Input value={form.college_name} onChange={e => setForm(p => ({ ...p, college_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><User className="h-4 w-4" /> Admin Name / एडमिन का नाम</Label>
                <Input value={form.admin_name} onChange={e => setForm(p => ({ ...p, admin_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Phone className="h-4 w-4" /> Phone / फ़ोन</Label>
                <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email / ईमेल</Label>
                <Input value={user?.email || ''} disabled className="bg-muted" />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes / बदलाव सेव करें
              </Button>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="shadow-card h-fit">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password / पासवर्ड बदलें
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>New Password / नया पासवर्ड</Label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password / पुष्टि करें</Label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              <Button onClick={handlePasswordChange} disabled={changingPassword} variant="outline" className="w-full gap-2">
                {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Update Password / पासवर्ड अपडेट करें
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
