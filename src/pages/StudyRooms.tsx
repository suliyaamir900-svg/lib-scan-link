import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { DoorOpen, Plus, Loader2, Trash2, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00',
];

export default function StudyRooms() {
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomDialog, setRoomDialog] = useState(false);
  const [bookDialog, setBookDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roomForm, setRoomForm] = useState({ name: '', capacity: 4 });
  const [bookForm, setBookForm] = useState({ room_id: '', booked_by_name: '', booked_by_id: '', booking_date: new Date().toISOString().split('T')[0], start_time: '09:00', end_time: '10:00', purpose: '' });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        const [roomRes, bookRes] = await Promise.all([
          (supabase as any).from('study_rooms').select('*').eq('library_id', lib.id).order('name'),
          (supabase as any).from('room_bookings').select('*').eq('library_id', lib.id).order('booking_date', { ascending: false }).limit(100),
        ]);
        setRooms(roomRes.data || []);
        setBookings(bookRes.data || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const handleAddRoom = async () => {
    if (!roomForm.name.trim() || !library) return;
    setSaving(true);
    const { data, error } = await (supabase as any).from('study_rooms').insert({
      library_id: library.id, name: roomForm.name.trim(), capacity: roomForm.capacity,
    }).select().single();
    if (!error) {
      setRooms(prev => [...prev, data]);
      toast.success('Room added! / कमरा जोड़ा गया!');
      setRoomDialog(false);
      setRoomForm({ name: '', capacity: 4 });
    } else toast.error('Failed');
    setSaving(false);
  };

  const handleBook = async () => {
    if (!bookForm.room_id || !bookForm.booked_by_name.trim() || !library) return;
    setSaving(true);
    const { data, error } = await (supabase as any).from('room_bookings').insert({
      library_id: library.id, room_id: bookForm.room_id,
      booked_by_name: bookForm.booked_by_name.trim(), booked_by_id: bookForm.booked_by_id.trim(),
      booking_date: bookForm.booking_date, start_time: bookForm.start_time, end_time: bookForm.end_time,
      purpose: bookForm.purpose,
    }).select().single();
    if (!error) {
      setBookings(prev => [data, ...prev]);
      toast.success('Room booked! / कमरा बुक हो गया!');
      setBookDialog(false);
    } else toast.error(error.message);
    setSaving(false);
  };

  const deleteRoom = async (id: string) => {
    await (supabase as any).from('study_rooms').delete().eq('id', id);
    setRooms(prev => prev.filter(r => r.id !== id));
    toast.success('Deleted');
  };

  const today = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.booking_date === today);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DoorOpen className="h-6 w-6 text-primary" /> Study Rooms / अध्ययन कक्ष
        </h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setRoomDialog(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Add Room
          </Button>
          <Button size="sm" onClick={() => setBookDialog(true)} className="gradient-primary text-primary-foreground gap-1">
            <Clock className="h-4 w-4" /> Book Room
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Card className="shadow-card"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{rooms.length}</p>
          <p className="text-xs text-muted-foreground">Total Rooms</p>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-accent">{todayBookings.length}</p>
          <p className="text-xs text-muted-foreground">Today's Bookings</p>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-secondary">{rooms.reduce((s, r) => s + (r.capacity || 4), 0)}</p>
          <p className="text-xs text-muted-foreground">Total Capacity</p>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{bookings.length}</p>
          <p className="text-xs text-muted-foreground">All Bookings</p>
        </CardContent></Card>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {rooms.map(room => {
          const roomBookings = todayBookings.filter(b => b.room_id === room.id);
          return (
            <Card key={room.id} className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{room.name}</h3>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteRoom(room.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Users className="h-4 w-4" /> Capacity: {room.capacity}
                </div>
                {roomBookings.length > 0 ? (
                  <div className="space-y-1">
                    {roomBookings.map(b => (
                      <div key={b.id} className="text-xs p-2 rounded bg-primary/5 border border-primary/20">
                        <p className="font-medium">{b.booked_by_name}</p>
                        <p className="text-muted-foreground">{b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Available</Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Bookings */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-lg">Recent Bookings / हाल की बुकिंग</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Booked By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Purpose</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.slice(0, 20).map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium text-sm">{rooms.find(r => r.id === b.room_id)?.name || '-'}</TableCell>
                      <TableCell className="text-sm">{b.booked_by_name}</TableCell>
                      <TableCell className="text-sm">{b.booking_date}</TableCell>
                      <TableCell className="text-sm">{b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{b.purpose || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {bookings.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No bookings yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Room Dialog */}
      <Dialog open={roomDialog} onOpenChange={setRoomDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Study Room / अध्ययन कक्ष जोड़ें</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Room Name *</Label><Input value={roomForm.name} onChange={e => setRoomForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Discussion Room 1" /></div>
            <div className="space-y-2"><Label>Capacity</Label><Input type="number" min={1} value={roomForm.capacity} onChange={e => setRoomForm(p => ({ ...p, capacity: parseInt(e.target.value) || 4 }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoomDialog(false)}>Cancel</Button>
            <Button onClick={handleAddRoom} disabled={saving} className="gradient-primary text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Book Room Dialog */}
      <Dialog open={bookDialog} onOpenChange={setBookDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Book Study Room / कमरा बुक करें</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Room *</Label>
              <Select value={bookForm.room_id} onValueChange={v => setBookForm(p => ({ ...p, room_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                <SelectContent>{rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={bookForm.booked_by_name} onChange={e => setBookForm(p => ({ ...p, booked_by_name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>ID / Roll No</Label><Input value={bookForm.booked_by_id} onChange={e => setBookForm(p => ({ ...p, booked_by_id: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Date *</Label><Input type="date" value={bookForm.booking_date} onChange={e => setBookForm(p => ({ ...p, booking_date: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Select value={bookForm.start_time} onValueChange={v => setBookForm(p => ({ ...p, start_time: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Select value={bookForm.end_time} onValueChange={v => setBookForm(p => ({ ...p, end_time: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Purpose</Label><Input value={bookForm.purpose} onChange={e => setBookForm(p => ({ ...p, purpose: e.target.value }))} placeholder="Group study, discussion..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookDialog(false)}>Cancel</Button>
            <Button onClick={handleBook} disabled={saving || !bookForm.room_id} className="gradient-primary text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Book / बुक करें'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
