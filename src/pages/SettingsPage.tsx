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
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Save, Loader2, Library, Building2, User, Phone, Mail, Lock, Armchair, BookOpen, Megaphone, Users, GraduationCap, X, Plus } from 'lucide-react';
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
    allow_seat_booking: true, allow_queue: true, show_announcements_on_entry: true,
  });
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  // Departments & Years
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [years, setYears] = useState<{ id: string; name: string }[]>([]);
  const [newDept, setNewDept] = useState('');
  const [newYear, setNewYear] = useState('');
  const [savingDept, setSavingDept] = useState(false);
  const [savingYear, setSavingYear] = useState(false);

  // Lockers
  const [lockers, setLockers] = useState<any[]>([]);
  const [newLockerStart, setNewLockerStart] = useState('');
  const [newLockerCount, setNewLockerCount] = useState(1);
  const [savingLockers, setSavingLockers] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(data);
      if (data) {
        setForm({ name: data.name, college_name: data.college_name, admin_name: data.admin_name, phone: data.phone || '' });

        const [settingsRes, deptRes, yearRes, lockerRes] = await Promise.all([
          supabase.from('library_settings').select('*').eq('library_id', data.id).maybeSingle(),
          (supabase as any).from('library_departments').select('*').eq('library_id', data.id).order('name'),
          (supabase as any).from('library_years').select('*').eq('library_id', data.id).order('name'),
          (supabase as any).from('library_lockers').select('*').eq('library_id', data.id).order('locker_number'),
        ]);

        let s = settingsRes.data;
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
            allow_seat_booking: (s as any).allow_seat_booking !== false,
            allow_queue: (s as any).allow_queue !== false,
            show_announcements_on_entry: (s as any).show_announcements_on_entry !== false,
          });
        }

        setDepartments(deptRes.data || []);
        setYears(yearRes.data || []);
        setLockers(lockerRes.data || []);
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
    if (error) toast.error('Failed to save');
    else toast.success('Settings saved! / सेटिंग्स सेव!');
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    const { error } = await supabase.from('library_settings').update({
      total_seats: settingsForm.total_seats, max_capacity: settingsForm.max_capacity,
      default_issue_days: settingsForm.default_issue_days, default_fine_per_day: settingsForm.default_fine_per_day,
      allow_reservations: settingsForm.allow_reservations,
      allow_seat_booking: settingsForm.allow_seat_booking,
      allow_queue: settingsForm.allow_queue,
      show_announcements_on_entry: settingsForm.show_announcements_on_entry,
      updated_at: new Date().toISOString(),
    } as any).eq('id', settings.id);
    setSavingSettings(false);
    if (error) toast.error('Failed to save');
    else toast.success('Settings saved!');
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

  const addDepartment = async () => {
    if (!newDept.trim() || !library) return;
    setSavingDept(true);
    const { data, error } = await (supabase as any).from('library_departments').insert({
      library_id: library.id, name: newDept.trim()
    }).select().single();
    setSavingDept(false);
    if (error) toast.error(error.message?.includes('duplicate') ? 'Already exists' : 'Failed');
    else { setDepartments(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name))); setNewDept(''); toast.success('Added!'); }
  };

  const removeDepartment = async (id: string) => {
    await (supabase as any).from('library_departments').delete().eq('id', id);
    setDepartments(prev => prev.filter(d => d.id !== id));
  };

  const addYear = async () => {
    if (!newYear.trim() || !library) return;
    setSavingYear(true);
    const { data, error } = await (supabase as any).from('library_years').insert({
      library_id: library.id, name: newYear.trim()
    }).select().single();
    setSavingYear(false);
    if (error) toast.error(error.message?.includes('duplicate') ? 'Already exists' : 'Failed');
    else { setYears(prev => [...prev, data]); setNewYear(''); toast.success('Added!'); }
  };

  const removeYear = async (id: string) => {
    await (supabase as any).from('library_years').delete().eq('id', id);
    setYears(prev => prev.filter(y => y.id !== id));
  };

  const addLockers = async () => {
    if (!newLockerStart.trim() || !library || newLockerCount < 1) return;
    setSavingLockers(true);
    const prefix = newLockerStart.trim();
    const items = Array.from({ length: newLockerCount }, (_, i) => ({
      library_id: library.id,
      locker_number: newLockerCount === 1 ? prefix : `${prefix}${i + 1}`,
    }));
    const { data, error } = await (supabase as any).from('library_lockers').insert(items).select();
    setSavingLockers(false);
    if (error) toast.error('Failed to add lockers');
    else { setLockers(prev => [...prev, ...(data || [])].sort((a: any, b: any) => a.locker_number.localeCompare(b.locker_number))); setNewLockerStart(''); toast.success('Lockers added!'); }
  };

  const removeLocker = async (id: string) => {
    await (supabase as any).from('library_lockers').delete().eq('id', id);
    setLockers(prev => prev.filter(l => l.id !== id));
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

          <div className="space-y-6">
            {/* Departments */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" /> Departments / विभाग
                </CardTitle>
                <CardDescription>Students will see these departments in entry form</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {departments.map(d => (
                    <Badge key={d.id} variant="secondary" className="text-xs gap-1 pr-1">
                      {d.name}
                      <button onClick={() => removeDepartment(d.id)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {departments.length === 0 && <p className="text-xs text-muted-foreground">No departments added. Default list will be shown.</p>}
                </div>
                <div className="flex gap-2">
                  <Input value={newDept} onChange={e => setNewDept(e.target.value)} placeholder="e.g. Computer Science"
                    onKeyDown={e => e.key === 'Enter' && addDepartment()} className="text-sm" />
                  <Button size="sm" onClick={addDepartment} disabled={savingDept} variant="outline">
                    {savingDept ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Years */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" /> Years / वर्ष
                </CardTitle>
                <CardDescription>Configure available year options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {years.map(y => (
                    <Badge key={y.id} variant="secondary" className="text-xs gap-1 pr-1">
                      {y.name}
                      <button onClick={() => removeYear(y.id)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {years.length === 0 && <p className="text-xs text-muted-foreground">No years added. Default (1st-5th) will be shown.</p>}
                </div>
                <div className="flex gap-2">
                  <Input value={newYear} onChange={e => setNewYear(e.target.value)} placeholder="e.g. 1st Year"
                    onKeyDown={e => e.key === 'Enter' && addYear()} className="text-sm" />
                  <Button size="sm" onClick={addYear} disabled={savingYear} variant="outline">
                    {savingYear ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lockers */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5" /> Lockers / लॉकर
                </CardTitle>
                <CardDescription>Students can reserve lockers during entry</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {lockers.map((l: any) => (
                    <Badge key={l.id} variant="outline" className="text-[10px] gap-1 pr-1">
                      {l.locker_number}
                      <button onClick={() => removeLocker(l.id)} className="hover:text-destructive">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                  {lockers.length === 0 && <p className="text-xs text-muted-foreground">No lockers. Add to show on entry form.</p>}
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Prefix</Label>
                    <Input value={newLockerStart} onChange={e => setNewLockerStart(e.target.value)} placeholder="e.g. L" className="text-sm" />
                  </div>
                  <div className="w-20 space-y-1">
                    <Label className="text-xs">Count</Label>
                    <Input type="number" min={1} max={100} value={newLockerCount}
                      onChange={e => setNewLockerCount(parseInt(e.target.value) || 1)} className="text-sm" />
                  </div>
                  <Button size="sm" onClick={addLockers} disabled={savingLockers} variant="outline">
                    {savingLockers ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Capacity & Seats */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Armchair className="h-5 w-5" /> Capacity & Seats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Seats</Label>
                    <Input type="number" min={0} value={settingsForm.total_seats}
                      onChange={e => setSettingsForm(p => ({ ...p, total_seats: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Capacity</Label>
                    <Input type="number" min={0} value={settingsForm.max_capacity}
                      onChange={e => setSettingsForm(p => ({ ...p, max_capacity: parseInt(e.target.value) || 0 }))} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Book Issue Rules */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-5 w-5" /> Book Issue Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Default Issue Days</Label>
                    <Input type="number" min={1} value={settingsForm.default_issue_days}
                      onChange={e => setSettingsForm(p => ({ ...p, default_issue_days: parseInt(e.target.value) || 14 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fine Per Day (₹)</Label>
                    <Input type="number" min={0} value={settingsForm.default_fine_per_day}
                      onChange={e => setSettingsForm(p => ({ ...p, default_fine_per_day: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">Allow Reservations</p>
                    <p className="text-xs text-muted-foreground">Students can reserve books</p>
                  </div>
                  <Switch checked={settingsForm.allow_reservations}
                    onCheckedChange={v => setSettingsForm(p => ({ ...p, allow_reservations: v }))} />
                </div>
              </CardContent>
            </Card>

            {/* Entry Form Toggles */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" /> Entry Form Options
                </CardTitle>
                <CardDescription>Control what students see on the entry form</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">Seat Booking / सीट बुकिंग</p>
                    <p className="text-xs text-muted-foreground">Students can choose a seat</p>
                  </div>
                  <Switch checked={settingsForm.allow_seat_booking}
                    onCheckedChange={v => setSettingsForm(p => ({ ...p, allow_seat_booking: v }))} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">Waiting Queue / प्रतीक्षा कतार</p>
                    <p className="text-xs text-muted-foreground">Queue when all seats are full</p>
                  </div>
                  <Switch checked={settingsForm.allow_queue}
                    onCheckedChange={v => setSettingsForm(p => ({ ...p, allow_queue: v }))} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1"><Megaphone className="h-3.5 w-3.5" /> Announcements</p>
                    <p className="text-xs text-muted-foreground">Show on entry form</p>
                  </div>
                  <Switch checked={settingsForm.show_announcements_on_entry}
                    onCheckedChange={v => setSettingsForm(p => ({ ...p, show_announcements_on_entry: v }))} />
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSaveSettings} disabled={savingSettings} className="w-full gradient-primary text-primary-foreground gap-2">
              {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save All Settings / सब सेटिंग्स सेव करें
            </Button>

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
