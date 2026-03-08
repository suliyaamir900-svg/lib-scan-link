import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { Megaphone, Plus, Loader2, Trash2, AlertTriangle, BookOpen, Calendar, Info } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_COLORS: Record<string, string> = {
  general: 'bg-primary/10 text-primary',
  new_books: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  holiday: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  rule_change: 'bg-destructive/10 text-destructive',
  event: 'bg-accent/10 text-accent',
};

const TYPE_ICONS: Record<string, any> = {
  general: Info,
  new_books: BookOpen,
  holiday: Calendar,
  rule_change: AlertTriangle,
  event: Megaphone,
};

export default function Announcements() {
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'general' });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        const { data } = await (supabase as any).from('announcements').select('*').eq('library_id', lib.id).order('created_at', { ascending: false });
        setAnnouncements(data || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const handleCreate = async () => {
    if (!form.title.trim() || !library) return;
    setSaving(true);
    const { data, error } = await (supabase as any).from('announcements').insert({
      library_id: library.id,
      title: form.title.trim(),
      message: form.message.trim(),
      type: form.type,
    }).select().single();
    if (!error) {
      setAnnouncements(prev => [data, ...prev]);
      toast.success('📢 Announcement posted! / घोषणा प्रकाशित!');
      setDialogOpen(false);
      setForm({ title: '', message: '', type: 'general' });
    } else toast.error('Failed');
    setSaving(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await (supabase as any).from('announcements').update({ is_active: !current }).eq('id', id);
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_active: !current } : a));
  };

  const handleDelete = async (id: string) => {
    await (supabase as any).from('announcements').delete().eq('id', id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    toast.success('Deleted / हटा दिया');
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" /> Announcements / घोषणाएं
        </h1>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="gradient-primary text-primary-foreground gap-1">
          <Plus className="h-4 w-4" /> New / नई
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : announcements.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-1">No announcements yet / अभी कोई घोषणा नहीं</h3>
            <p className="text-sm text-muted-foreground">Post your first announcement</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => {
            const Icon = TYPE_ICONS[a.type] || Info;
            return (
              <Card key={a.id} className={`shadow-card ${!a.is_active ? 'opacity-50' : ''}`}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLORS[a.type] || TYPE_COLORS.general}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{a.title}</h3>
                      <Badge variant="secondary" className={`text-[10px] ${TYPE_COLORS[a.type] || ''}`}>{a.type}</Badge>
                    </div>
                    {a.message && <p className="text-sm text-muted-foreground">{a.message}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={a.is_active} onCheckedChange={() => toggleActive(a.id, a.is_active)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Announcement / नई घोषणा</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title / शीर्षक *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Announcement title" />
            </div>
            <div className="space-y-2">
              <Label>Message / संदेश</Label>
              <Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Details..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Type / प्रकार</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General / सामान्य</SelectItem>
                  <SelectItem value="new_books">New Books / नई किताबें</SelectItem>
                  <SelectItem value="holiday">Holiday / छुट्टी</SelectItem>
                  <SelectItem value="rule_change">Rule Change / नियम बदलाव</SelectItem>
                  <SelectItem value="event">Event / कार्यक्रम</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.title.trim()} className="gradient-primary text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post / प्रकाशित करें'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
