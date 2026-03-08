import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Save, Loader2, Library, Building2, User, Phone, Mail, Lock, Armchair, BookOpen, Bell } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [form, setForm] = useState({ name: '', college_name: '', admin_name: '', phone: '' });
  const [settingsForm, setSettingsForm] = useState({
    total_seats: 0, max_capacity: 100, default_issue_days: 14,
    default_fine_per_day: 5, allow_reservations: true,
  });
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(data);
      if (data) {
        setForm({ name: data.name, college_name: data.college_name, admin_name: data.admin_name, phone: data.phone || '' });
        // Fetch or create settings
        let { data: s } = await supabase.from('library_settings').select('*').eq('library_id', data.id).maybeSingle();
        if (!s) {
          const { data: newS } = await supabase.from('library_settings').insert({ library_id: data.id }).select().single();
          s = newS;
        }
        if (s) {
          setSettings(s);
          setSettingsForm({
            total_seats: s.total_seats || 0, max_capacity: s.max_capacity || 100,
            default_issue_days: s.default_issue_days || 14, default_fine_per_day: s.default_fine_per_day || 5,
            allow_reservations: s.allow_reservations !== false,
          });
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const handleSave = async () => {
    if (!library) return;
    setSaving(true);
    const { error } = await supabase.from('libraries').update({
      name: form.name.trim(), college_name: form.college_name.trim(),
      admin_name: form.admin_name.trim(), phone: form.phone.trim(),
      updated_at: new Date().toISOString(),
    }).eq('id', library.id);
    setSaving(false);
    if (error) toast.error('Failed to save / सेव करने में विफल');
    else toast.success('Settings saved! / सेटिंग्स सेव हो गईं!');
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    const { error } = await supabase.from('library_settings').update({
      total_seats: settingsForm.total_seats, max_capacity: settingsForm.max_capacity,
      default_issue_days: settingsForm.default_issue_days, default_fine_per_day: settingsForm.default_fine_per_day,
      allow_reservations: settingsForm.allow_reservations,
      updated_at: new Date().toISOString(),
    }).eq('id', settings.id);
    setSavingSettings(false);
    if (error) toast.error('Failed to save');
    else toast.success('Library settings saved! / लाइब्रेरी सेटिंग्स सेव!');
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
    setChangingPassword(false);
    if (error) toast.error(error.message);
    else { toast.success('Password changed!'); setPasswordForm({ newPassword: '', confirmPassword: '' }); }
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" />
        {t('nav.settings')}
      </h1>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Library Profile */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Library Profile / लाइब्रेरी प्रोफ़ाइल</CardTitle>
              <CardDescription>Basic library information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Library className="h-4 w-4" /> Library Name</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Building2 className="h-4 w-4" /> College Name</Label>
                <Input value={form.college_name} onChange={e => setForm(p => ({ ...p, college_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><User className="h-4 w-4" /> Admin Name</Label>
                <Input value={form.admin_name} onChange={e => setForm(p => ({ ...p, admin_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Phone className="h-4 w-4" /> Phone</Label>
                <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email</Label>
                <Input value={user?.email || ''} disabled className="bg-muted" />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save / सेव करें
              </Button>
            </CardContent>
          </Card>

          {/* Library Settings */}
          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Armchair className="h-5 w-5" /> Capacity & Seats / क्षमता और सीटें
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Seats / कुल सीटें</Label>
                    <Input type="number" min={0} value={settingsForm.total_seats}
                      onChange={e => setSettingsForm(p => ({ ...p, total_seats: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Capacity / अधिकतम क्षमता</Label>
                    <Input type="number" min={0} value={settingsForm.max_capacity}
                      onChange={e => setSettingsForm(p => ({ ...p, max_capacity: parseInt(e.target.value) || 0 }))} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" /> Book Issue Rules / किताब जारी नियम
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Default Issue Days / डिफ़ॉल्ट दिन</Label>
                    <Input type="number" min={1} value={settingsForm.default_issue_days}
                      onChange={e => setSettingsForm(p => ({ ...p, default_issue_days: parseInt(e.target.value) || 14 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fine Per Day (₹) / जुर्माना प्रति दिन</Label>
                    <Input type="number" min={0} value={settingsForm.default_fine_per_day}
                      onChange={e => setSettingsForm(p => ({ ...p, default_fine_per_day: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">Allow Reservations / आरक्षण</p>
                    <p className="text-xs text-muted-foreground">Students can reserve books in queue</p>
                  </div>
                  <Switch checked={settingsForm.allow_reservations}
                    onCheckedChange={v => setSettingsForm(p => ({ ...p, allow_reservations: v }))} />
                </div>
                <Button onClick={handleSaveSettings} disabled={savingSettings} className="w-full gradient-primary text-primary-foreground gap-2">
                  {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Settings / सेटिंग्स सेव करें
                </Button>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Lock className="h-5 w-5" /> Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" value={passwordForm.newPassword}
                    onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input type="password" value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="••••••••" />
                </div>
                <Button onClick={handlePasswordChange} disabled={changingPassword} variant="outline" className="w-full gap-2">
                  {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Update Password
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
