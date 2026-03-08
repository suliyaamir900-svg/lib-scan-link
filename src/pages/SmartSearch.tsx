import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Search, BookOpen, Users, GraduationCap, Briefcase, MapPin, Loader2 } from 'lucide-react';

export default function SmartSearch() {
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        const [booksR, entriesR, issuesR] = await Promise.all([
          supabase.from('books').select('*').eq('library_id', lib.id),
          supabase.from('student_entries').select('*').eq('library_id', lib.id).order('created_at', { ascending: false }).limit(1000),
          supabase.from('book_issues').select('*').eq('library_id', lib.id).order('created_at', { ascending: false }),
        ]);
        setBooks(booksR.data || []);
        setEntries(entriesR.data || []);
        setIssues(issuesR.data || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const q = query.toLowerCase().trim();

  const filteredBooks = useMemo(() => {
    if (!q) return [];
    return books.filter(b =>
      b.title.toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q) || (b.isbn || '').toLowerCase().includes(q)
    ).slice(0, 20);
  }, [q, books]);

  const filteredEntries = useMemo(() => {
    if (!q) return [];
    return entries.filter(e =>
      e.student_name.toLowerCase().includes(q) || e.roll_number.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q) || (e.enrollment_number || '').toLowerCase().includes(q) ||
      (e.employee_id || '').toLowerCase().includes(q)
    ).slice(0, 30);
  }, [q, entries]);

  const filteredIssues = useMemo(() => {
    if (!q) return [];
    return issues.filter(i =>
      i.borrower_name.toLowerCase().includes(q) || i.borrower_id.toLowerCase().includes(q) ||
      (books.find(b => b.id === i.book_id)?.title || '').toLowerCase().includes(q)
    ).slice(0, 20);
  }, [q, issues, books]);

  const totalResults = filteredBooks.length + filteredEntries.length + filteredIssues.length;

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-4">
          <Search className="h-6 w-6 text-primary" />
          Smart Search / स्मार्ट खोज
        </h1>
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search student, book, author, ISBN, department... / छात्र, किताब, लेखक खोजें..."
            className="pl-12 h-12 text-lg border-2 border-primary/20 focus:border-primary"
            autoFocus
          />
        </div>
        {q && <p className="text-sm text-muted-foreground mt-2">{totalResults} results found / परिणाम मिले</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !q ? (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-1">Start typing to search / खोजने के लिए टाइप करें</h3>
            <p className="text-sm text-muted-foreground">Search across students, books, entries, and more</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
            <TabsTrigger value="books">Books ({filteredBooks.length})</TabsTrigger>
            <TabsTrigger value="entries">Entries ({filteredEntries.length})</TabsTrigger>
            <TabsTrigger value="issues">Issues ({filteredIssues.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredBooks.length > 0 && (
              <Card className="shadow-card">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Books / किताबें</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredBooks.slice(0, 5).map(b => (
                      <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{b.title}</p>
                          <p className="text-xs text-muted-foreground">{b.author} {b.isbn && `• ISBN: ${b.isbn}`}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {(b.rack_number || b.shelf_number) && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <MapPin className="h-3 w-3" />
                              {[b.rack_number, b.row_number, b.shelf_number].filter(Boolean).join('-')}
                            </Badge>
                          )}
                          <Badge className={b.available_copies > 0 ? 'bg-green-100 text-green-700' : 'bg-destructive/10 text-destructive'}>
                            {b.available_copies}/{b.total_copies}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {filteredEntries.length > 0 && (
              <Card className="shadow-card">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Entries / एंट्री</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredEntries.slice(0, 5).map(e => (
                      <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${e.user_type === 'teacher' ? 'bg-accent/10' : 'bg-primary/10'}`}>
                            {e.user_type === 'teacher' ? <Briefcase className="h-4 w-4 text-accent" /> : <GraduationCap className="h-4 w-4 text-primary" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{e.student_name}</p>
                            <p className="text-xs text-muted-foreground">{e.department} • {e.roll_number}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{e.entry_date}</p>
                          <p className="text-xs text-muted-foreground">{e.entry_time?.slice(0, 5)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {filteredIssues.length > 0 && (
              <Card className="shadow-card">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Book Issues / किताब जारी</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredIssues.slice(0, 5).map(i => (
                      <div key={i.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{i.borrower_name} — {books.find(b => b.id === i.book_id)?.title || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">ID: {i.borrower_id} • Due: {i.return_date}</p>
                        </div>
                        <Badge variant={i.status === 'returned' ? 'secondary' : 'destructive'}>{i.status}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {totalResults === 0 && (
              <Card className="shadow-card">
                <CardContent className="p-12 text-center">
                  <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No results for "{query}" / कोई परिणाम नहीं</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="books">
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-2">
                {filteredBooks.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{b.title}</p>
                      <p className="text-xs text-muted-foreground">{b.author} {b.isbn && `• ISBN: ${b.isbn}`} {b.category_name && `• ${b.category_name}`}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(b.rack_number || b.shelf_number) && (
                        <Badge variant="outline" className="text-xs gap-1"><MapPin className="h-3 w-3" />{[b.rack_number, b.row_number, b.shelf_number].filter(Boolean).join('-')}</Badge>
                      )}
                      <Badge className={b.available_copies > 0 ? 'bg-green-100 text-green-700' : 'bg-destructive/10 text-destructive'}>{b.available_copies}/{b.total_copies}</Badge>
                    </div>
                  </div>
                ))}
                {filteredBooks.length === 0 && <p className="text-center text-muted-foreground py-8">No matching books</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="entries">
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-2">
                {filteredEntries.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${e.user_type === 'teacher' ? 'bg-accent/10' : 'bg-primary/10'}`}>
                        {e.user_type === 'teacher' ? <Briefcase className="h-4 w-4 text-accent" /> : <GraduationCap className="h-4 w-4 text-primary" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{e.student_name}</p>
                        <p className="text-xs text-muted-foreground">{e.department} • {e.roll_number} • {e.mobile}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs">{e.entry_date}</p>
                      <p className="text-xs text-muted-foreground">{e.entry_time?.slice(0, 5)} {e.exit_time ? `→ ${e.exit_time.slice(0, 5)}` : '(inside)'}</p>
                    </div>
                  </div>
                ))}
                {filteredEntries.length === 0 && <p className="text-center text-muted-foreground py-8">No matching entries</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues">
            <Card className="shadow-card">
              <CardContent className="p-4 space-y-2">
                {filteredIssues.map(i => (
                  <div key={i.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{i.borrower_name}</p>
                      <p className="text-xs text-muted-foreground">{books.find(b => b.id === i.book_id)?.title} • Due: {i.return_date}</p>
                    </div>
                    <Badge variant={i.status === 'returned' ? 'secondary' : i.return_date < new Date().toISOString().split('T')[0] ? 'destructive' : 'default'}>{i.status}</Badge>
                  </div>
                ))}
                {filteredIssues.length === 0 && <p className="text-center text-muted-foreground py-8">No matching issues</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </DashboardLayout>
  );
}
