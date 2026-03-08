import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CalendarDays, Plus, Loader2, Users, MapPin, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LibraryEvents() {
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', event_date: '', start_time: '10:00', end_time: '12:00',
    location: '', max_participants: 50, type: 'workshop',
  });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        const { data } = await (supabase as any).from('library_events').select('*').eq('library_id', lib.id).order('event_date', { ascending: false });
        setEvents(data || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const handleCreate = async () => {
    if (!form.title.trim() || !form.event_date || !library) return;
    setSaving(true);
    const { data, error } = await (supabase as any).from('library_events').insert({
      library_id: library.id, ...form, title: form.title.trim(),
    }).select().single();
    if (!error) {
      setEvents(prev => [data, ...prev]);
      toast.success('Event created! / इवेंट बनाया गया!');
      setDialogOpen(false);
      setForm({ title: '', description: '', event_date: '', start_time: '10:00', end_time: '12:00', location: '', max_participants: 50, type: 'workshop' });
    } else toast.error('Failed');
    setSaving(false);
  };

  const deleteEvent = async (id: string) => {
    await (supabase as any).from('library_events').delete().eq('id', id);
    setEvents(prev => prev.filter(e => e.id !== id));
    toast.success('Deleted');
  };

  const today = new Date().toISOString().split('T')[0];
  const upcoming = events.filter(e => e.event_date >= today);
  const past = events.filter(e => e.event_date < today);

  const typeColors: Record<string, string> = {
    workshop: 'bg-primary/10 text-primary',
    seminar: 'bg-accent/10 text-accent',
    reading: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    competition: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" /> Library Events / इवेंट्स
        </h1>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="gradient-primary text-primary-foreground gap-1">
          <Plus className="h-4 w-4" /> New Event
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <>
              <h2 className="text-lg font-semibold mb-3">Upcoming / आने वाले</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {upcoming.map(e => (
                  <Card key={e.id} className="shadow-card border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={typeColors[e.type] || typeColors.workshop}>{e.type}</Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteEvent(e.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <h3 className="font-semibold mb-1">{e.title}</h3>
                      {e.description && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{e.description}</p>}
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {e.event_date}</div>
                        <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {e.start_time?.slice(0, 5)} - {e.end_time?.slice(0, 5) || 'TBD'}</div>
                        {e.location && <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</div>}
                        <div className="flex items-center gap-1"><Users className="h-3 w-3" /> {e.registered_count || 0}/{e.max_participants}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {past.length > 0 && (
            <>
              <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Past Events / बीते इवेंट्स</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {past.map(e => (
                  <Card key={e.id} className="shadow-card opacity-60">
                    <CardContent className="p-4">
                      <Badge variant="secondary">{e.type}</Badge>
                      <h3 className="font-semibold mt-2">{e.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{e.event_date}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {events.length === 0 && (
            <Card className="shadow-card">
              <CardContent className="p-12 text-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No events yet / अभी कोई इवेंट नहीं</h3>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Event / इवेंट बनाएं</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Date *</Label><Input type="date" value={form.event_date} onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Type</Label>
                <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  <option value="workshop">Workshop</option><option value="seminar">Seminar</option>
                  <option value="reading">Reading Session</option><option value="competition">Competition</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Max Participants</Label><Input type="number" min={1} value={form.max_participants} onChange={e => setForm(p => ({ ...p, max_participants: parseInt(e.target.value) || 50 }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.title.trim()} className="gradient-primary text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create / बनाएं'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
