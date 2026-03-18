import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Search, BookOpen, Users, GraduationCap, Briefcase, MapPin, Loader2, User, Phone } from 'lucide-react';

export default function SmartSearch() {
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<any[]>([]);
  const [teacherProfiles, setTeacherProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        const [booksR, entriesR, issuesR, spR, tpR] = await Promise.all([
          supabase.from('books').select('*').eq('library_id', lib.id),
          supabase.from('student_entries').select('*').eq('library_id', lib.id).order('created_at', { ascending: false }).limit(1000),
          supabase.from('book_issues').select('*').eq('library_id', lib.id).order('created_at', { ascending: false }),
          (supabase as any).from('student_profiles').select('*').eq('library_id', lib.id),
          (supabase as any).from('teacher_profiles').select('*').eq('library_id', lib.id),
        ]);
        setBooks(booksR.data || []);
        setEntries(entriesR.data || []);
        setIssues(issuesR.data || []);
        setStudentProfiles(spR.data || []);
        setTeacherProfiles(tpR.data || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const q = query.toLowerCase().trim();

  const filteredBooks = useMemo(() => {
    if (!q) return [];
    return books.filter(b => b.title.toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q) || (b.isbn || '').toLowerCase().includes(q)).slice(0, 20);
  }, [q, books]);

  const filteredStudents = useMemo(() => {
    if (!q) return [];
    return studentProfiles.filter((s: any) =>
      (s.full_name || '').toLowerCase().includes(q) || (s.enrollment_number || '').toLowerCase().includes(q) ||
      (s.roll_number || '').toLowerCase().includes(q) || (s.mobile || '').includes(q) || (s.email || '').toLowerCase().includes(q)
    ).slice(0, 15);
  }, [q, studentProfiles]);

  const filteredTeachers = useMemo(() => {
    if (!q) return [];
    return teacherProfiles.filter((t: any) =>
      (t.full_name || '').toLowerCase().includes(q) || (t.employee_id || '').toLowerCase().includes(q) ||
      (t.mobile || '').includes(q) || (t.email || '').toLowerCase().includes(q)
    ).slice(0, 10);
  }, [q, teacherProfiles]);

  const filteredEntries = useMemo(() => {
    if (!q) return [];
    return entries.filter(e =>
      e.student_name.toLowerCase().includes(q) || e.roll_number.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q) || (e.enrollment_number || '').toLowerCase().includes(q) ||
      (e.employee_id || '').toLowerCase().includes(q) || (e.mobile || '').includes(q)
    ).slice(0, 30);
  }, [q, entries]);

  const filteredIssues = useMemo(() => {
    if (!q) return [];
    return issues.filter(i =>
      i.borrower_name.toLowerCase().includes(q) || i.borrower_id.toLowerCase().includes(q) ||
      (books.find(b => b.id === i.book_id)?.title || '').toLowerCase().includes(q)
    ).slice(0, 20);
  }, [q, issues, books]);

  const totalResults = filteredBooks.length + filteredStudents.length + filteredTeachers.length + filteredEntries.length + filteredIssues.length;

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-4">
          <Search className="h-6 w-6 text-primary" /> Smart Search / स्मार्ट खोज
        </h1>
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search student, teacher, book, author, ISBN... / खोजें..."
            className="pl-12 h-12 text-lg border-2 border-primary/20 focus:border-primary" autoFocus />
        </div>
        {q && <p className="text-sm text-muted-foreground mt-2">{totalResults} results found</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !q ? (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-1">Start typing to search</h3>
            <p className="text-sm text-muted-foreground">Search across students, teachers, books, entries, and more</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
            <TabsTrigger value="students">Students ({filteredStudents.length})</TabsTrigger>
            <TabsTrigger value="teachers">Teachers ({filteredTeachers.length})</TabsTrigger>
            <TabsTrigger value="books">Books ({filteredBooks.length})</TabsTrigger>
            <TabsTrigger value="entries">Entries ({filteredEntries.length})</TabsTrigger>
            <TabsTrigger value="issues">Issues ({filteredIssues.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {/* Student Profiles */}
            {filteredStudents.length > 0 && (
              <Card className="shadow-card">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> Students</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredStudents.slice(0, 5).map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {s.photo_url ? <AvatarImage src={s.photo_url} /> : null}
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">{(s.full_name || '?')[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{s.full_name}</p>
                            <p className="text-xs text-muted-foreground">{s.department} • {s.enrollment_number || s.roll_number || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {s.mobile && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{s.mobile}</span>}
                          <Badge className="bg-primary/10 text-primary text-[9px]">Student</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Teacher Profiles */}
            {filteredTeachers.length > 0 && (
              <Card className="shadow-card">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Briefcase className="h-4 w-4 text-accent" /> Teachers</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredTeachers.slice(0, 5).map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {t.photo_url ? <AvatarImage src={t.photo_url} /> : null}
                            <AvatarFallback className="text-xs bg-accent/10 text-accent">{(t.full_name || '?')[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{t.full_name}</p>
                            <p className="text-xs text-muted-foreground">{t.department} • {t.employee_id || '-'} • {t.designation || ''}</p>
                          </div>
                        </div>
                        <Badge className="bg-accent/10 text-accent text-[9px]">Teacher</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Books */}
            {filteredBooks.length > 0 && (
              <Card className="shadow-card">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Books</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredBooks.slice(0, 5).map(b => (
                      <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{b.title}</p>
                          <p className="text-xs text-muted-foreground">{b.author} {b.isbn && `• ISBN: ${b.isbn}`}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {(b.rack_number || b.shelf_number) && <Badge variant="outline" className="text-xs gap-1"><MapPin className="h-3 w-3" />{[b.rack_number, b.row_number, b.shelf_number].filter(Boolean).join('-')}</Badge>}
                          <Badge className={b.available_copies > 0 ? 'bg-green-100 text-green-700' : 'bg-destructive/10 text-destructive'}>{b.available_copies}/{b.total_copies}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Entries */}
            {filteredEntries.length > 0 && (
              <Card className="shadow-card">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Entries</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredEntries.slice(0, 5).map(e => (
                      <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${e.user_type === 'teacher' ? 'bg-accent/10' : 'bg-primary/10'}`}>
                            {e.user_type === 'teacher' ? <Briefcase className="h-4 w-4 text-accent" /> : <GraduationCap className="h-4 w-4 text-primary" />}
                          </div>
                          <div><p className="font-medium text-sm">{e.student_name}</p><p className="text-xs text-muted-foreground">{e.department} • {e.roll_number}</p></div>
                        </div>
                        <div className="text-right"><p className="text-xs text-muted-foreground">{e.entry_date}</p><p className="text-xs text-muted-foreground">{e.entry_time?.slice(0, 5)}</p></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Issues */}
            {filteredIssues.length > 0 && (
              <Card className="shadow-card">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Book Issues</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredIssues.slice(0, 5).map(i => (
                      <div key={i.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div><p className="font-medium text-sm">{i.borrower_name} — {books.find(b => b.id === i.book_id)?.title || 'Unknown'}</p><p className="text-xs text-muted-foreground">ID: {i.borrower_id} • Due: {i.return_date}</p></div>
                        <Badge variant={i.status === 'returned' ? 'secondary' : 'destructive'}>{i.status}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {totalResults === 0 && (
              <Card className="shadow-card"><CardContent className="p-12 text-center">
                <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No results for "{query}"</p>
              </CardContent></Card>
            )}
          </TabsContent>

          {/* Individual tabs */}
          {['students', 'teachers', 'books', 'entries', 'issues'].map(tab => (
            <TabsContent key={tab} value={tab}>
              <Card className="shadow-card">
                <CardContent className="p-4 space-y-2">
                  {tab === 'students' && filteredStudents.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">{s.photo_url ? <AvatarImage src={s.photo_url} /> : null}<AvatarFallback className="text-xs bg-primary/10 text-primary">{(s.full_name || '?')[0]}</AvatarFallback></Avatar>
                        <div><p className="font-medium text-sm">{s.full_name}</p><p className="text-xs text-muted-foreground">{s.department} • {s.enrollment_number || s.roll_number || '-'} {s.mobile && `• ${s.mobile}`}</p></div>
                      </div>
                    </div>
                  ))}
                  {tab === 'teachers' && filteredTeachers.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">{t.photo_url ? <AvatarImage src={t.photo_url} /> : null}<AvatarFallback className="text-xs bg-accent/10 text-accent">{(t.full_name || '?')[0]}</AvatarFallback></Avatar>
                        <div><p className="font-medium text-sm">{t.full_name}</p><p className="text-xs text-muted-foreground">{t.department} • {t.employee_id || '-'} • {t.designation || ''}</p></div>
                      </div>
                    </div>
                  ))}
                  {tab === 'books' && filteredBooks.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div><p className="font-medium text-sm">{b.title}</p><p className="text-xs text-muted-foreground">{b.author} {b.isbn && `• ISBN: ${b.isbn}`} {b.category_name && `• ${b.category_name}`}</p></div>
                      <div className="flex items-center gap-2">
                        {(b.rack_number || b.shelf_number) && <Badge variant="outline" className="text-xs gap-1"><MapPin className="h-3 w-3" />{[b.rack_number, b.row_number, b.shelf_number].filter(Boolean).join('-')}</Badge>}
                        <Badge className={b.available_copies > 0 ? 'bg-green-100 text-green-700' : 'bg-destructive/10 text-destructive'}>{b.available_copies}/{b.total_copies}</Badge>
                      </div>
                    </div>
                  ))}
                  {tab === 'entries' && filteredEntries.map(e => (
                    <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${e.user_type === 'teacher' ? 'bg-accent/10' : 'bg-primary/10'}`}>
                          {e.user_type === 'teacher' ? <Briefcase className="h-4 w-4 text-accent" /> : <GraduationCap className="h-4 w-4 text-primary" />}
                        </div>
                        <div><p className="font-medium text-sm">{e.student_name}</p><p className="text-xs text-muted-foreground">{e.department} • {e.roll_number} • {e.mobile}</p></div>
                      </div>
                      <div className="text-right"><p className="text-xs">{e.entry_date}</p><p className="text-xs text-muted-foreground">{e.entry_time?.slice(0, 5)} {e.exit_time ? `→ ${e.exit_time.slice(0, 5)}` : '(inside)'}</p></div>
                    </div>
                  ))}
                  {tab === 'issues' && filteredIssues.map(i => (
                    <div key={i.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div><p className="font-medium text-sm">{i.borrower_name}</p><p className="text-xs text-muted-foreground">{books.find(b => b.id === i.book_id)?.title} • Due: {i.return_date}</p></div>
                      <Badge variant={i.status === 'returned' ? 'secondary' : i.return_date < new Date().toISOString().split('T')[0] ? 'destructive' : 'default'}>{i.status}</Badge>
                    </div>
                  ))}
                  {((tab === 'students' && filteredStudents.length === 0) || (tab === 'teachers' && filteredTeachers.length === 0) || (tab === 'books' && filteredBooks.length === 0) || (tab === 'entries' && filteredEntries.length === 0) || (tab === 'issues' && filteredIssues.length === 0)) && (
                    <p className="text-center text-muted-foreground py-8">No matching results</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </DashboardLayout>
  );
}
