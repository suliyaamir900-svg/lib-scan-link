import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Loader2, Plus, LogOut, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function VisitorLog() {
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', purpose: '' });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        const { data } = await (supabase as any).from('visitor_logs').select('*').eq('library_id', lib.id).order('created_at', { ascending: false }).limit(200);
        setVisitors(data || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const handleAdd = async () => {
    if (!form.name.trim() || !library) return;
    setSaving(true);
    const { data, error } = await (supabase as any).from('visitor_logs').insert({
      library_id: library.id,
      name: form.name.trim(),
      phone: form.phone.trim(),
      purpose: form.purpose.trim(),
    }).select().single();
    if (!error) {
      setVisitors(prev => [data, ...prev]);
      toast.success('Visitor added! / आगंतुक जोड़ा गया!');
      setDialogOpen(false);
      setForm({ name: '', phone: '', purpose: '' });
    } else toast.error('Failed');
    setSaving(false);
  };

  const markExit = async (id: string) => {
    const { error } = await (supabase as any).from('visitor_logs').update({ exit_time: new Date().toISOString() }).eq('id', id);
    if (!error) {
      setVisitors(prev => prev.map(v => v.id === id ? { ...v, exit_time: new Date().toISOString() } : v));
      toast.success('Exit recorded / बाहर निकले');
    }
  };

  const filtered = visitors.filter(v => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return v.name.toLowerCase().includes(q) || v.phone.includes(q) || (v.purpose || '').toLowerCase().includes(q);
  });

  const todayVisitors = visitors.filter(v => new Date(v.entry_time).toDateString() === new Date().toDateString());
  const currentlyInside = todayVisitors.filter(v => !v.exit_time).length;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-primary" /> Visitor Log / आगंतुक लॉग
        </h1>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="gradient-primary text-primary-foreground gap-1">
          <Plus className="h-4 w-4" /> Add Visitor
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="shadow-card"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{todayVisitors.length}</p>
          <p className="text-xs text-muted-foreground">Today / आज</p>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{currentlyInside}</p>
          <p className="text-xs text-muted-foreground">Inside / अंदर</p>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-accent">{visitors.length}</p>
          <p className="text-xs text-muted-foreground">Total / कुल</p>
        </CardContent></Card>
      </div>

      <Card className="shadow-card mb-4">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search visitor..." className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        {loading ? (
          <CardContent className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name / नाम</TableHead>
                  <TableHead>Phone / फोन</TableHead>
                  <TableHead>Purpose / उद्देश्य</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>Exit</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No visitors</TableCell></TableRow>
                ) : filtered.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium text-sm">{v.name}</TableCell>
                    <TableCell className="text-sm">{v.phone || '-'}</TableCell>
                    <TableCell className="text-sm">{v.purpose || '-'}</TableCell>
                    <TableCell className="text-xs">{new Date(v.entry_time).toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{v.exit_time ? new Date(v.exit_time).toLocaleString() : <span className="text-green-600 font-medium">Inside</span>}</TableCell>
                    <TableCell>
                      {!v.exit_time && (
                        <Button size="sm" variant="outline" onClick={() => markExit(v.id)} className="gap-1 text-xs">
                          <LogOut className="h-3 w-3" /> Exit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Visitor / आगंतुक जोड़ें</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name / नाम *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Phone / फोन</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} type="tel" /></div>
            <div className="space-y-2"><Label>Purpose / उद्देश्य</Label><Input value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} placeholder="e.g. Research, Meeting" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving || !form.name.trim()} className="gradient-primary text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add / जोड़ें'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
