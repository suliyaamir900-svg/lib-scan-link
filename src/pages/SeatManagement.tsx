import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Armchair, Plus, Loader2, Trash2, Users, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function SeatManagement() {
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [seats, setSeats] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [seatNumber, setSeatNumber] = useState('');
  const [section, setSection] = useState('');
  const [bulkPrefix, setBulkPrefix] = useState('A');
  const [bulkCount, setBulkCount] = useState(10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        const today = new Date().toISOString().split('T')[0];
        const [seatsRes, entriesRes] = await Promise.all([
          supabase.from('library_seats').select('*').eq('library_id', lib.id).order('seat_number'),
          supabase.from('student_entries').select('*').eq('library_id', lib.id).eq('entry_date', today),
        ]);
        setSeats(seatsRes.data || []);
        setEntries(entriesRes.data || []);
      }
      setLoading(false);
    };
    fetchData();

    // Realtime subscription for entries
    const channel = supabase
      .channel('seat-entries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_entries' }, () => {
        if (library) {
          const today = new Date().toISOString().split('T')[0];
          supabase.from('student_entries').select('*').eq('library_id', library.id).eq('entry_date', today)
            .then(({ data }) => setEntries(data || []));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const activeEntries = entries.filter(e => !e.exit_time);
  const occupiedSeatIds = new Set(activeEntries.filter(e => e.seat_id).map(e => e.seat_id));
  const occupiedCount = occupiedSeatIds.size;
  const freeCount = seats.filter(s => s.is_active).length - occupiedCount;
  const insideCount = activeEntries.length;

  // Peak hour calculation
  const hourCounts: Record<number, number> = {};
  entries.forEach(e => {
    if (e.entry_time) {
      const h = parseInt(e.entry_time.split(':')[0]);
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    }
  });
  const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

  const handleAddSeat = async () => {
    if (!seatNumber.trim() || !library) return;
    setSaving(true);
    const { data, error } = await supabase.from('library_seats').insert({
      library_id: library.id, seat_number: seatNumber.trim(), section: section.trim(),
    }).select().single();
    if (error) toast.error(error.message.includes('duplicate') ? 'Seat number already exists' : error.message);
    else {
      setSeats(prev => [...prev, data].sort((a: any, b: any) => a.seat_number.localeCompare(b.seat_number)));
      toast.success('Seat added! / सीट जोड़ी गई!');
      setSeatNumber(''); setSection(''); setAddOpen(false);
    }
    setSaving(false);
  };

  const handleBulkAdd = async () => {
    if (!library || bulkCount <= 0) return;
    setSaving(true);
    const rows = Array.from({ length: bulkCount }, (_, i) => ({
      library_id: library.id, seat_number: `${bulkPrefix}${i + 1}`, section: bulkPrefix,
    }));
    const { data, error } = await supabase.from('library_seats').insert(rows).select();
    if (error) toast.error(error.message);
    else {
      setSeats(prev => [...prev, ...(data || [])].sort((a: any, b: any) => a.seat_number.localeCompare(b.seat_number)));
      toast.success(`${data?.length || 0} seats added! / सीटें जोड़ी गईं!`);
      setBulkOpen(false);
    }
    setSaving(false);
  };

  const handleDeleteSeat = async (id: string) => {
    const { error } = await supabase.from('library_seats').delete().eq('id', id);
    if (!error) { setSeats(prev => prev.filter(s => s.id !== id)); toast.success('Seat removed'); }
    else toast.error('Failed');
  };

  const sections = [...new Set(seats.map(s => s.section).filter(Boolean))].sort();

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Armchair className="h-6 w-6 text-primary" />
          Seat Management / सीट प्रबंधन
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Bulk Add / बल्क
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)} className="gradient-primary text-primary-foreground gap-1">
            <Plus className="h-4 w-4" /> Add Seat / सीट जोड़ें
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Seats / कुल सीटें', value: seats.length, icon: Armchair, gradient: 'gradient-primary' },
          { label: 'Occupied / भरी हुई', value: occupiedCount, icon: XCircle, gradient: 'gradient-warm' },
          { label: 'Free / खाली', value: Math.max(0, freeCount), icon: CheckCircle, gradient: 'gradient-success' },
          { label: 'People Inside / अंदर', value: insideCount, icon: Users, gradient: 'gradient-accent' },
        ].map((s, i) => (
          <Card key={i} className="shadow-card border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${s.gradient} flex items-center justify-center shrink-0`}>
                <s.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {peakHour && (
        <Card className="shadow-card mb-6 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            <p className="text-sm">
              <span className="font-semibold">Peak Hour Today / आज का पीक समय:</span>{' '}
              {peakHour[0]}:00 — {parseInt(peakHour[0]) + 1}:00 ({peakHour[1]} entries)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Seat Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : seats.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <Armchair className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-1">No seats configured / कोई सीट नहीं</h3>
            <p className="text-sm text-muted-foreground mb-4">Add seats to start tracking occupancy</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setAddOpen(true)} className="gradient-primary text-primary-foreground gap-1">
                <Plus className="h-4 w-4" /> Add Seat
              </Button>
              <Button variant="outline" onClick={() => setBulkOpen(true)} className="gap-1">
                <Plus className="h-4 w-4" /> Bulk Add
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sections.length > 0 ? sections.map(sec => (
            <Card key={sec} className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Section {sec}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {seats.filter(s => s.section === sec).map(seat => {
                    const isOccupied = occupiedSeatIds.has(seat.id);
                    const occupant = isOccupied ? activeEntries.find(e => e.seat_id === seat.id) : null;
                    return (
                      <div key={seat.id} className="relative group">
                        <div className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center text-xs font-bold transition-all ${
                          isOccupied
                            ? 'border-destructive/50 bg-destructive/10 text-destructive'
                            : 'border-green-500/50 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        }`}>
                          <Armchair className="h-4 w-4 mb-0.5" />
                          {seat.seat_number}
                        </div>
                        {occupant && (
                          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive animate-pulse" title={occupant.student_name} />
                        )}
                        <button
                          onClick={() => handleDeleteSeat(seat.id)}
                          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground items-center justify-center text-[8px] hidden group-hover:flex"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {seats.map(seat => {
                    const isOccupied = occupiedSeatIds.has(seat.id);
                    return (
                      <div key={seat.id} className="relative group">
                        <div className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center text-xs font-bold transition-all ${
                          isOccupied
                            ? 'border-destructive/50 bg-destructive/10 text-destructive'
                            : 'border-green-500/50 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        }`}>
                          <Armchair className="h-4 w-4 mb-0.5" />
                          {seat.seat_number}
                        </div>
                        <button
                          onClick={() => handleDeleteSeat(seat.id)}
                          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground items-center justify-center text-[8px] hidden group-hover:flex"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <div className="flex gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-green-500/30 border border-green-500/50" /> Free / खाली
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-destructive/30 border border-destructive/50" /> Occupied / भरी
            </div>
          </div>
        </div>
      )}

      {/* Add Seat Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Seat / सीट जोड़ें</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Seat Number / सीट नंबर *</Label>
              <Input value={seatNumber} onChange={e => setSeatNumber(e.target.value)} placeholder="e.g. A1, B5" />
            </div>
            <div className="space-y-1">
              <Label>Section / सेक्शन</Label>
              <Input value={section} onChange={e => setSection(e.target.value)} placeholder="e.g. A, B, Ground Floor" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddSeat} disabled={saving || !seatNumber.trim()} className="gradient-primary text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add / जोड़ें'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Bulk Add Seats / बल्क सीट जोड़ें</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Prefix / उपसर्ग (A, B, C...)</Label>
              <Input value={bulkPrefix} onChange={e => setBulkPrefix(e.target.value)} placeholder="A" />
            </div>
            <div className="space-y-1">
              <Label>Number of Seats / सीटों की संख्या</Label>
              <Input type="number" min={1} max={100} value={bulkCount} onChange={e => setBulkCount(parseInt(e.target.value) || 0)} />
            </div>
            <p className="text-xs text-muted-foreground">
              Will create: {bulkPrefix}1, {bulkPrefix}2, ... {bulkPrefix}{bulkCount}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={handleBulkAdd} disabled={saving || bulkCount <= 0} className="gradient-primary text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : `Add ${bulkCount} Seats`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
