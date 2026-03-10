import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
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
import { Search, Trash2, Loader2, GraduationCap, ChevronLeft, ChevronRight, Eye, Plus, Upload, Edit, User, Phone, Mail, Calendar, MapPin, BookOpen, Clock, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 15;

export default function Students() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
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
  const [importing, setImporting] = useState(false);

  const emptyForm = {
    full_name: '', email: '', enrollment_number: '', student_id: '', batch_year: '', department: '',
    course: '', mobile: '', address: '', date_of_birth: '', gender: '', father_name: '', father_mobile: '',
    father_email: '', guardian_occupation: '', emergency_contact: '', admission_year: '', current_semester: '', roll_number: '',
  };
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [sigFile, setSigFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user!.id).maybeSingle();
    setLibrary(lib);
    if (lib) {
      const { data } = await supabase.from('student_profiles' as any).select('*').eq('library_id', lib.id).order('created_at', { ascending: false });
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
        (e.enrollment_number || '').toLowerCase().includes(q) ||
        (e.email || '').toLowerCase().includes(q) ||
        (e.roll_number || '').toLowerCase().includes(q) ||
        (e.mobile || '').includes(q) ||
        (e.department || '').toLowerCase().includes(q)
      );
    }
    if (deptFilter !== 'all') result = result.filter((e: any) => e.department === deptFilter);
    setFiltered(result);
    setPage(0);
  }, [profiles, search, deptFilter]);

  const uploadFile = async (file: File, folder: string) => {
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('profiles').upload(path, file);
    if (error) { toast.error('Upload failed'); return null; }
    const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(path);
    return publicUrl;
  };

  const handleSave = async () => {
    if (!library || !form.full_name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    let photo_url = showProfile?.photo_url || null;
    let signature_url = showProfile?.signature_url || null;
    if (photoFile) photo_url = await uploadFile(photoFile, 'photos');
    if (sigFile) signature_url = await uploadFile(sigFile, 'signatures');

    const payload = { ...form, library_id: library.id, photo_url, signature_url, updated_at: new Date().toISOString() };

    if (editMode && showProfile) {
      const { error } = await (supabase as any).from('student_profiles').update(payload).eq('id', showProfile.id);
      if (error) toast.error('Update failed');
      else { toast.success('Profile updated'); setEditMode(false); }
    } else {
      // Check duplicate enrollment
      if (form.enrollment_number) {
        const existing = profiles.find((p: any) => p.enrollment_number === form.enrollment_number);
        if (existing) { toast.error('Student with this enrollment already exists'); setSaving(false); return; }
      }
      const { error } = await (supabase as any).from('student_profiles').insert(payload);
      if (error) toast.error('Failed to add');
      else { toast.success('Student added'); setShowAdd(false); }
    }
    setSaving(false);
    setPhotoFile(null);
    setSigFile(null);
    fetchData();
  };

  const openProfile = async (profile: any) => {
    setShowProfile(profile);
    setForm({
      full_name: profile.full_name || '', email: profile.email || '', enrollment_number: profile.enrollment_number || '',
      student_id: profile.student_id || '', batch_year: profile.batch_year || '', department: profile.department || '',
      course: profile.course || '', mobile: profile.mobile || '', address: profile.address || '',
      date_of_birth: profile.date_of_birth || '', gender: profile.gender || '', father_name: profile.father_name || '',
      father_mobile: profile.father_mobile || '', father_email: profile.father_email || '',
      guardian_occupation: profile.guardian_occupation || '', emergency_contact: profile.emergency_contact || '',
      admission_year: profile.admission_year || '', current_semester: profile.current_semester || '', roll_number: profile.roll_number || '',
    });
    setEditMode(false);

    // Fetch linked entries
    if (library) {
      const orParts: string[] = [];
      if (profile.enrollment_number) orParts.push(`enrollment_number.eq.${profile.enrollment_number}`);
      if (profile.roll_number) orParts.push(`roll_number.eq.${profile.roll_number}`);
      if (profile.email) orParts.push(`email.eq.${profile.email}`);

      if (orParts.length > 0) {
        const { data: entries } = await supabase.from('student_entries').select('*').eq('library_id', library.id).or(orParts.join(',')).order('entry_date', { ascending: false }).limit(50);
        setProfileEntries(entries || []);
      } else {
        setProfileEntries([]);
      }

      // Fetch book issues
      const borrowerId = profile.enrollment_number || profile.roll_number || profile.student_id || '';
      if (borrowerId) {
        const { data: issues } = await supabase.from('book_issues').select('*').eq('library_id', library.id).eq('borrower_id', borrowerId).order('created_at', { ascending: false }).limit(50);
        setProfileBookIssues(issues || []);
      } else {
        setProfileBookIssues([]);
      }
    }
  };

  const handleDelete = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} student profiles?`)) return;
    const { error } = await (supabase as any).from('student_profiles').delete().in('id', ids);
    if (error) toast.error('Failed');
    else { setProfiles(prev => prev.filter((e: any) => !ids.includes(e.id))); setSelected(new Set()); toast.success(`${ids.length} deleted`); }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !library) return;
    setImporting(true);

    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);

    let added = 0, updated = 0;
    for (const row of rows) {
      const enrollment = row['Enrollment Number'] || row['enrollment_number'] || row['EnrollmentNumber'] || '';
      const payload: any = {
        library_id: library.id,
        full_name: row['Full Name'] || row['full_name'] || row['Name'] || row['name'] || '',
        enrollment_number: enrollment,
        student_id: row['Student ID'] || row['student_id'] || '',
        roll_number: row['Roll Number'] || row['roll_number'] || '',
        email: row['Email'] || row['email'] || '',
        mobile: row['Mobile'] || row['mobile'] || row['Phone'] || '',
        department: row['Department'] || row['department'] || '',
        batch_year: row['Batch Year'] || row['batch_year'] || '',
        course: row['Course'] || row['course'] || '',
        gender: row['Gender'] || row['gender'] || '',
        father_name: row['Father Name'] || row['father_name'] || '',
        father_mobile: row['Father Mobile'] || row['father_mobile'] || '',
        address: row['Address'] || row['address'] || '',
        admission_year: row['Admission Year'] || row['admission_year'] || '',
        current_semester: row['Semester'] || row['current_semester'] || '',
      };
      if (!payload.full_name) continue;

      if (enrollment) {
        const existing = profiles.find((p: any) => p.enrollment_number === enrollment);
        if (existing) {
          await (supabase as any).from('student_profiles').update(payload).eq('id', existing.id);
          updated++;
          continue;
        }
      }
      await (supabase as any).from('student_profiles').insert(payload);
      added++;
    }

    toast.success(`Import done: ${added} added, ${updated} updated`);
    setImporting(false);
    fetchData();
    e.target.value = '';
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
    const returnedIssues = profileBookIssues.filter((i: any) => i.status === 'returned');
    const totalFines = profileBookIssues.reduce((s: number, i: any) => s + (i.fine_amount || 0), 0);
    const todayEntries = profileEntries.filter((e: any) => e.entry_date === new Date().toISOString().split('T')[0]);
    const activeEntries = profileEntries.filter((e: any) => !e.exit_time);

    return (
      <DashboardLayout>
        <Button variant="ghost" size="sm" onClick={() => { setShowProfile(null); setEditMode(false); }} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Students
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="shadow-card lg:col-span-1 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-primary via-secondary to-accent" />
            <CardContent className="p-6 text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary/20">
                {showProfile.photo_url ? <AvatarImage src={showProfile.photo_url} /> : null}
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">{(showProfile.full_name || '?')[0]}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{showProfile.full_name}</h2>
              <p className="text-sm text-muted-foreground">{showProfile.department} • {showProfile.batch_year}</p>
              {showProfile.enrollment_number && (
                <div className="mt-2 inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <p className="text-xs font-semibold text-primary">EN: {showProfile.enrollment_number}</p>
                </div>
              )}
              {showProfile.roll_number && (
                <p className="text-xs text-muted-foreground mt-1">Roll: {showProfile.roll_number}</p>
              )}
              {showProfile.student_id && (
                <p className="text-xs text-muted-foreground">ID: {showProfile.student_id}</p>
              )}
              {showProfile.signature_url && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-1">Signature</p>
                  <img src={showProfile.signature_url} alt="Signature" className="h-12 mx-auto border rounded-lg" />
                </div>
              )}
              {activeEntries.length > 0 && (
                <div className="mt-3 p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <p className="text-xs font-medium text-green-700 dark:text-green-400">🟢 Currently in Library</p>
                  <p className="text-[10px] text-green-600 dark:text-green-500">Since {activeEntries[0]?.entry_time?.substring(0, 8)}</p>
                </div>
              )}
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setEditMode(!editMode)}>
                <Edit className="h-3 w-3 mr-1" /> {editMode ? 'Cancel Edit' : 'Edit Profile'}
              </Button>
            </CardContent>
          </Card>

          {/* Activity Dashboard */}
          <div className="lg:col-span-2 space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Total Visits', value: totalVisits, icon: Eye, color: 'text-primary' },
                { label: 'Study Time', value: `${Math.floor(totalStudyMins / 60)}h ${totalStudyMins % 60}m`, icon: Clock, color: 'text-secondary' },
                { label: 'Currently Issued', value: currentIssues.length, icon: BookOpen, color: 'text-accent' },
                { label: 'Books Returned', value: returnedIssues.length, icon: BookOpen, color: 'text-primary' },
                { label: 'Total Books Borrowed', value: profileBookIssues.length, icon: BookOpen, color: 'text-secondary' },
                { label: 'Total Fines', value: `₹${totalFines}`, icon: IndianRupee, color: 'text-destructive' },
              ].map(s => (
                <Card key={s.label} className="shadow-sm overflow-hidden">
                  <div className="h-0.5 bg-gradient-to-r from-primary to-secondary" />
                  <CardContent className="p-3 text-center">
                    <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
                    <p className="text-lg font-bold">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Edit Form or Info */}
            {editMode ? (
              <Card className="shadow-card">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(form).map(([key, val]) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs capitalize">{key.replace(/_/g, ' ')}</Label>
                        <Input value={val} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                          type={key === 'date_of_birth' ? 'date' : 'text'} className="h-9 text-sm" />
                      </div>
                    ))}
                    <div className="space-y-1">
                      <Label className="text-xs">Photo</Label>
                      <Input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Signature</Label>
                      <Input type="file" accept="image/*" onChange={e => setSigFile(e.target.files?.[0] || null)} className="h-9 text-sm" />
                    </div>
                  </div>
                  <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-card">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Student Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {[
                      ['Enrollment No', showProfile.enrollment_number, GraduationCap],
                      ['Roll Number', showProfile.roll_number, User],
                      ['Student ID', showProfile.student_id, User],
                      ['Email', showProfile.email, Mail],
                      ['Mobile', showProfile.mobile, Phone],
                      ['Course', showProfile.course, GraduationCap],
                      ['Semester', showProfile.current_semester, Calendar],
                      ['Gender', showProfile.gender, User],
                      ['DOB', showProfile.date_of_birth, Calendar],
                      ['Batch Year', showProfile.batch_year, Calendar],
                      ['Admission Year', showProfile.admission_year, Calendar],
                      ['Father', showProfile.father_name, User],
                      ['Father Mobile', showProfile.father_mobile, Phone],
                      ['Father Email', showProfile.father_email, Mail],
                      ['Guardian Occupation', showProfile.guardian_occupation, User],
                      ['Emergency Contact', showProfile.emergency_contact, Phone],
                      ['Address', showProfile.address, MapPin],
                    ].map(([label, val, Icon]: any) => val ? (
                      <div key={label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div><p className="text-[10px] text-muted-foreground">{label}</p><p className="font-medium text-xs">{val}</p></div>
                      </div>
                    ) : null)}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Entries */}
            {todayEntries.length > 0 && (
              <Card className="shadow-card border-primary/20">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Today's Entries ({todayEntries.length})
                  </h3>
                  <div className="space-y-2">
                    {todayEntries.map((e: any) => (
                      <div key={e.id} className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium">Entry: <strong>{e.entry_time?.substring(0, 8)}</strong></p>
                            <p className="text-xs text-muted-foreground">
                              Exit: <strong>{e.exit_time ? e.exit_time.substring(0, 8) : '🟢 Still inside'}</strong>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {e.study_minutes ? (
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary/10 text-secondary">
                              {Math.floor(e.study_minutes / 60)}h {e.study_minutes % 60}m
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Active</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Visit History */}
            {profileEntries.length > 0 && (
              <Card className="shadow-card">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">All Visit History ({profileEntries.length})</h3>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {profileEntries.map((e: any) => (
                      <div key={e.id} className="flex justify-between items-center p-2.5 rounded-lg bg-muted/30 text-xs border border-border/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{e.entry_date}</span>
                        </div>
                        <span className="font-mono">
                          {e.entry_time?.substring(0, 8)} → {e.exit_time ? e.exit_time.substring(0, 8) : <span className="text-green-600 dark:text-green-400 font-semibold">Active</span>}
                        </span>
                        <span className="text-muted-foreground min-w-[50px] text-right">
                          {e.study_minutes ? `${Math.floor(e.study_minutes / 60)}h ${e.study_minutes % 60}m` : '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Currently Issued Books */}
            {currentIssues.length > 0 && (
              <Card className="shadow-card border-accent/20">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-accent" />
                    Currently Issued Books ({currentIssues.length})
                  </h3>
                  <div className="space-y-2">
                    {currentIssues.map((i: any) => (
                      <div key={i.id} className="p-3 rounded-xl bg-accent/5 border border-accent/20 text-sm">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold">{i.borrower_name || 'Book'}</p>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/20 text-accent">Issued</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Issue: {i.issue_date}</span>
                          <span>Due: {i.return_date}</span>
                          {(i.fine_amount || 0) > 0 && <span className="text-destructive font-medium">Fine: ₹{i.fine_amount}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Book History */}
            {returnedIssues.length > 0 && (
              <Card className="shadow-card">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Returned Books ({returnedIssues.length})</h3>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {returnedIssues.map((i: any) => (
                      <div key={i.id} className="flex justify-between items-center p-2.5 rounded-lg bg-muted/30 text-xs border border-border/30">
                        <span className="font-medium flex-1">{i.borrower_name || 'Book'}</span>
                        <span className="text-muted-foreground">{i.issue_date} → {i.actual_return_date || i.return_date}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 ml-2">Returned</span>
                        {(i.fine_amount || 0) > 0 && <span className="text-destructive ml-2">₹{i.fine_amount}</span>}
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
          <GraduationCap className="h-6 w-6 text-primary" />
          Students / छात्र
        </h1>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelImport} />
            <Button variant="outline" size="sm" className="gap-1" asChild disabled={importing}>
              <span><Upload className="h-4 w-4" /> {importing ? 'Importing...' : 'Excel Import'}</span>
            </Button>
          </label>
          <Button size="sm" className="gap-1 gradient-primary text-primary-foreground" onClick={() => { setShowAdd(true); setForm(emptyForm); setPhotoFile(null); setSigFile(null); }}>
            <Plus className="h-4 w-4" /> Add Student
          </Button>
        </div>
      </div>

      <Card className="shadow-card mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, enrollment, email, roll, mobile, department" className="pl-10" />
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
          <CardContent className="p-10 text-center text-muted-foreground">No students found. Add students manually or import via Excel.</CardContent>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"><input type="checkbox" checked={selected.size === pageEntries.length && pageEntries.length > 0} onChange={toggleAll} className="rounded" /></TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Enrollment</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Batch</TableHead>
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
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">{(p.full_name || '?')[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm hover:text-primary">{p.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell><span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">{p.department || '-'}</span></TableCell>
                      <TableCell className="text-sm">{p.enrollment_number || '-'}</TableCell>
                      <TableCell className="text-sm">{p.roll_number || '-'}</TableCell>
                      <TableCell className="text-sm">{p.mobile || '-'}</TableCell>
                      <TableCell className="text-sm">{p.batch_year || '-'}</TableCell>
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
                <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages} ({filtered.length} students)</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Add Student Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Student / छात्र जोड़ें</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(emptyForm).map(([key]) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs capitalize">{key.replace(/_/g, ' ')}</Label>
                <Input value={(form as any)[key]} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  type={key === 'date_of_birth' ? 'date' : 'text'} className="h-9 text-sm" />
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-xs">Photo</Label>
              <Input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Signature</Label>
              <Input type="file" accept="image/*" onChange={e => setSigFile(e.target.files?.[0] || null)} className="h-9 text-sm" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground mt-3">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Student'}
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
