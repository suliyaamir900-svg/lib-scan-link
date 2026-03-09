import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Search, Trash2, Loader2, Briefcase, ChevronLeft, ChevronRight, Eye, Plus, Edit, User, Phone, Mail, Calendar, MapPin, BookOpen, Clock, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 15;

export default function Teachers() {
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [showProfile, setShowProfile] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileEntries, setProfileEntries] = useState<any[]>([]);
  const [profileBookIssues, setProfileBookIssues] = useState<any[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const emptyForm = {
    full_name: '', email: '', employee_id: '', department: '', mobile: '', address: '', designation: '', joining_date: '',
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user!.id).maybeSingle();
    setLibrary(lib);
    if (lib) {
      const { data } = await (supabase as any).from('teacher_profiles').select('*').eq('library_id', lib.id).order('created_at', { ascending: false });
      setProfiles(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    let result = profiles;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e: any) =>
        (e.full_name || '').toLowerCase().includes(q) ||
        (e.employee_id || '').toLowerCase().includes(q) ||
        (e.email || '').toLowerCase().includes(q) ||
        (e.mobile || '').includes(q)
      );
    }
    if (deptFilter !== 'all') result = result.filter((e: any) => e.department === deptFilter);
    setFiltered(result);
    setPage(0);
  }, [profiles, search, deptFilter]);

  const uploadFile = async (file: File) => {
    const ext = file.name.split('.').pop();
    const path = `teacher-photos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('profiles').upload(path, file);
    if (error) { toast.error('Upload failed'); return null; }
    return supabase.storage.from('profiles').getPublicUrl(path).data.publicUrl;
  };

  const handleSave = async () => {
    if (!library || !form.full_name.trim()) { toast.error('Name required'); return; }
    setSaving(true);
    let photo_url = showProfile?.photo_url || null;
    if (photoFile) photo_url = await uploadFile(photoFile);
    const payload = { ...form, library_id: library.id, photo_url, updated_at: new Date().toISOString() };

    if (editMode && showProfile) {
      await (supabase as any).from('teacher_profiles').update(payload).eq('id', showProfile.id);
      toast.success('Updated'); setEditMode(false);
    } else {
      await (supabase as any).from('teacher_profiles').insert(payload);
      toast.success('Teacher added'); setShowAdd(false);
    }
    setSaving(false); setPhotoFile(null); fetchData();
  };

  const openProfile = async (profile: any) => {
    setShowProfile(profile);
    setForm({
      full_name: profile.full_name || '', email: profile.email || '', employee_id: profile.employee_id || '',
      department: profile.department || '', mobile: profile.mobile || '', address: profile.address || '',
      designation: profile.designation || '', joining_date: profile.joining_date || '',
    });
    setEditMode(false);

    if (library && profile.employee_id) {
      const [entriesRes, issuesRes] = await Promise.all([
        supabase.from('student_entries').select('*').eq('library_id', library.id).eq('employee_id', profile.employee_id).order('entry_date', { ascending: false }).limit(50),
        supabase.from('book_issues').select('*').eq('library_id', library.id).eq('borrower_id', profile.employee_id).order('created_at', { ascending: false }).limit(50),
      ]);
      setProfileEntries(entriesRes.data || []);
      setProfileBookIssues(issuesRes.data || []);
    } else {
      setProfileEntries([]); setProfileBookIssues([]);
    }
  };

  const handleDelete = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} teacher profiles?`)) return;
    await (supabase as any).from('teacher_profiles').delete().in('id', ids);
    setProfiles(prev => prev.filter((e: any) => !ids.includes(e.id)));
    setSelected(new Set()); toast.success('Deleted');
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const departments = [...new Set(profiles.map((e: any) => e.department).filter(Boolean))].sort();
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageEntries = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const toggleSelect = (id: string) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };
  const toggleAll = () => { selected.size === pageEntries.length ? setSelected(new Set()) : setSelected(new Set(pageEntries.map((e: any) => e.id))); };

  // Profile detail view
  if (showProfile) {
    const totalVisits = profileEntries.length;
    const totalStudyMins = profileEntries.reduce((s: number, e: any) => s + (e.study_minutes || 0), 0);
    const currentIssues = profileBookIssues.filter((i: any) => i.status === 'issued');
    const totalFines = profileBookIssues.reduce((s: number, i: any) => s + (i.fine_amount || 0), 0);

    return (
      <DashboardLayout>
        <Button variant="ghost" size="sm" onClick={() => { setShowProfile(null); setEditMode(false); }} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Teachers
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-card lg:col-span-1">
            <CardContent className="p-6 text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                {showProfile.photo_url ? <AvatarImage src={showProfile.photo_url} /> : null}
                <AvatarFallback className="text-2xl bg-accent/10 text-accent">{(showProfile.full_name || '?')[0]}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{showProfile.full_name}</h2>
              <p className="text-sm text-muted-foreground">{showProfile.designation} • {showProfile.department}</p>
              {showProfile.employee_id && <p className="text-xs text-muted-foreground mt-1">ID: {showProfile.employee_id}</p>}
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setEditMode(!editMode)}>
                <Edit className="h-3 w-3 mr-1" /> {editMode ? 'Cancel' : 'Edit'}
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Visits', value: totalVisits, icon: Eye, color: 'text-blue-500' },
                { label: 'Study Time', value: `${Math.floor(totalStudyMins / 60)}h`, icon: Clock, color: 'text-green-500' },
                { label: 'Books Issued', value: currentIssues.length, icon: BookOpen, color: 'text-orange-500' },
                { label: 'Fines', value: `₹${totalFines}`, icon: IndianRupee, color: 'text-red-500' },
              ].map(s => (
                <Card key={s.label} className="shadow-sm">
                  <CardContent className="p-3 text-center">
                    <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
                    <p className="text-lg font-bold">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {editMode ? (
              <Card className="shadow-card">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(form).map(([key, val]) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs capitalize">{key.replace(/_/g, ' ')}</Label>
                        <Input value={val} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                          type={key === 'joining_date' ? 'date' : 'text'} className="h-9 text-sm" />
                      </div>
                    ))}
                    <div className="space-y-1">
                      <Label className="text-xs">Photo</Label>
                      <Input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="h-9 text-sm" />
                    </div>
                  </div>
                  <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-card">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {[
                      ['Email', showProfile.email, Mail],
                      ['Mobile', showProfile.mobile, Phone],
                      ['Address', showProfile.address, MapPin],
                      ['Joining', showProfile.joining_date, Calendar],
                    ].map(([label, val, Icon]: any) => val ? (
                      <div key={label} className="flex items-center gap-2 p-2 rounded bg-muted/30">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <div><p className="text-[10px] text-muted-foreground">{label}</p><p className="font-medium text-xs">{val}</p></div>
                      </div>
                    ) : null)}
                  </div>
                </CardContent>
              </Card>
            )}

            {profileEntries.length > 0 && (
              <Card className="shadow-card">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Visit History</h3>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {profileEntries.map((e: any) => (
                      <div key={e.id} className="flex justify-between p-2 rounded bg-muted/30 text-xs">
                        <span>{e.entry_date}</span>
                        <span>{e.entry_time?.slice(0, 5)} → {e.exit_time?.slice(0, 5) || 'Active'}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-accent" />
          Teachers / शिक्षक
        </h1>
        <Button size="sm" className="gap-1 gradient-primary text-primary-foreground" onClick={() => { setShowAdd(true); setForm(emptyForm); setPhotoFile(null); }}>
          <Plus className="h-4 w-4" /> Add Teacher
        </Button>
      </div>

      <Card className="shadow-card mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, employee ID, email, mobile" className="pl-10" />
            </div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dept</SelectItem>
                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            {selected.size > 0 && (
              <Button variant="destructive" size="sm" onClick={() => handleDelete([...selected])} className="gap-1">
                <Trash2 className="h-4 w-4" /> Delete ({selected.size})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        {loading ? (
          <CardContent className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
        ) : filtered.length === 0 ? (
          <CardContent className="p-10 text-center text-muted-foreground">No teachers found. Add teachers to get started.</CardContent>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"><input type="checkbox" checked={selected.size === pageEntries.length && pageEntries.length > 0} onChange={toggleAll} className="rounded" /></TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageEntries.map((p: any) => (
                    <TableRow key={p.id} className={`cursor-pointer ${selected.has(p.id) ? 'bg-primary/5' : ''}`}>
                      <TableCell><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2" onClick={() => openProfile(p)}>
                          <Avatar className="h-8 w-8">
                            {p.photo_url ? <AvatarImage src={p.photo_url} /> : null}
                            <AvatarFallback className="text-xs bg-accent/10 text-accent">{(p.full_name || '?')[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm hover:text-primary">{p.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell><span className="px-2 py-0.5 rounded-full text-xs bg-accent/10 text-accent font-medium">{p.department || '-'}</span></TableCell>
                      <TableCell className="text-sm">{p.employee_id || '-'}</TableCell>
                      <TableCell className="text-sm">{p.designation || '-'}</TableCell>
                      <TableCell className="text-sm">{p.mobile || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openProfile(p)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete([p.id])} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Add Teacher Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Teacher / शिक्षक जोड़ें</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(emptyForm).map(([key]) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs capitalize">{key.replace(/_/g, ' ')}</Label>
                <Input value={(form as any)[key]} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  type={key === 'joining_date' ? 'date' : 'text'} className="h-9 text-sm" />
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-xs">Photo</Label>
              <Input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="h-9 text-sm" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground mt-3">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Teacher'}
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
