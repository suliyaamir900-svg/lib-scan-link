import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, Loader2, BookOpen, RotateCcw, AlertTriangle, ChevronLeft, ChevronRight, IndianRupee, BookPlus, X } from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 15;

export default function BookIssues() {
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Book search in issue dialog
  const [bookSearch, setBookSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [showBookDropdown, setShowBookDropdown] = useState(false);

  // Quick add book
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickBookForm, setQuickBookForm] = useState({ title: '', author: '', total_copies: 1 });
  const [quickAdding, setQuickAdding] = useState(false);

  const [form, setForm] = useState({
    borrower_type: 'student', borrower_name: '', borrower_id: '',
    borrower_department: '', borrower_phone: '', issue_date: new Date().toISOString().split('T')[0],
    return_date: '', fine_per_day: 5, notes: '',
  });

  const [borrowerQuery, setBorrowerQuery] = useState('');
  const [borrowerSearching, setBorrowerSearching] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        const [issuesRes, booksRes] = await Promise.all([
          supabase.from('book_issues').select('*').eq('library_id', lib.id).order('created_at', { ascending: false }),
          supabase.from('books').select('*').eq('library_id', lib.id).order('title'),
        ]);
        setIssues(issuesRes.data || []);
        setBooks(booksRes.data || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Book search results (must be before early returns)
  const bookSearchResults = useMemo(() => {
    if (!bookSearch.trim()) return [];
    const q = bookSearch.toLowerCase();
    return books.filter(b =>
      b.title.toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q) || (b.isbn || '').toLowerCase().includes(q)
    ).slice(0, 8);
  }, [bookSearch, books]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const today = new Date().toISOString().split('T')[0];

  const getStatus = (issue: any) => {
    if (issue.status === 'returned') return 'returned';
    if (issue.return_date < today) return 'overdue';
    return 'issued';
  };

  const calculateFine = (issue: any) => {
    if (issue.status === 'returned') return issue.fine_amount || 0;
    if (issue.return_date >= today) return 0;
    const days = Math.floor((new Date(today).getTime() - new Date(issue.return_date).getTime()) / 86400000);
    return days * (issue.fine_per_day || 5);
  };

  const filtered = issues.filter(i => {
    const q = search.toLowerCase();
    const bookTitle = books.find(b => b.id === i.book_id)?.title || '';
    const matchesSearch = !q || i.borrower_name.toLowerCase().includes(q) || i.borrower_id.toLowerCase().includes(q) || bookTitle.toLowerCase().includes(q);
    const effectiveStatus = getStatus(i);
    const matchesStatus = statusFilter === 'all' || effectiveStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageIssues = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const overdueCount = issues.filter(i => getStatus(i) === 'overdue').length;
  const issuedCount = issues.filter(i => i.status === 'issued').length;
  const returnedCount = issues.filter(i => i.status === 'returned').length;
  const totalFines = issues.reduce((s, i) => s + calculateFine(i), 0);

  const getBookTitle = (bookId: string) => books.find(b => b.id === bookId)?.title || 'Unknown';

  const selectBook = (book: any) => {
    setSelectedBook(book);
    setBookSearch(book.title);
    setShowBookDropdown(false);
  };

  const searchBorrower = async () => {
    if (!borrowerQuery.trim() || !library) return;
    setBorrowerSearching(true);
    try {
      if (form.borrower_type === 'student') {
        const { data } = await supabase.from('student_entries').select('*').eq('library_id', library.id)
          .eq('roll_number', borrowerQuery.trim()).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (data) {
          setForm(p => ({ ...p, borrower_name: data.student_name, borrower_id: data.roll_number, borrower_department: data.department }));
          toast.success('छात्र मिला! / Student found!');
        } else toast.info('Not found — enter manually');
      } else {
        const { data } = await supabase.from('student_entries').select('*').eq('library_id', library.id)
          .eq('roll_number', borrowerQuery.trim()).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (data) {
          setForm(p => ({ ...p, borrower_name: data.student_name, borrower_id: borrowerQuery.trim(), borrower_department: data.department }));
          toast.success('शिक्षक मिला! / Teacher found!');
        } else toast.info('Not found — enter manually');
      }
    } catch { toast.info('Enter details manually'); }
    setBorrowerSearching(false);
  };

  // Quick add book inline
  const handleQuickAddBook = async () => {
    if (!quickBookForm.title.trim() || !library) return;
    setQuickAdding(true);
    const { data, error } = await supabase.from('books').insert({
      library_id: library.id,
      title: quickBookForm.title.trim(),
      author: quickBookForm.author.trim(),
      total_copies: quickBookForm.total_copies,
      available_copies: quickBookForm.total_copies,
    }).select().single();

    if (error) {
      toast.error(`Failed: ${error.message}`);
    } else {
      setBooks(prev => [...prev, data].sort((a: any, b: any) => a.title.localeCompare(b.title)));
      setSelectedBook(data);
      setBookSearch(data.title);
      setQuickAddOpen(false);
      setQuickBookForm({ title: '', author: '', total_copies: 1 });
      toast.success('✅ Book added! / किताब जोड़ दी गई!');
    }
    setQuickAdding(false);
  };

  const handleIssue = async () => {
    if (!selectedBook || !form.borrower_name.trim() || !form.borrower_id.trim() || !form.return_date) {
      toast.error('सभी ज़रूरी फ़ील्ड भरें / Fill all required fields'); return;
    }
    if (!library) return;
    setSaving(true);

    if (selectedBook.available_copies <= 0) {
      toast.error('कोई प्रति उपलब्ध नहीं / No copies available');
      setSaving(false); return;
    }

    const { data, error } = await supabase.from('book_issues').insert({
      library_id: library.id,
      book_id: selectedBook.id,
      borrower_type: form.borrower_type,
      borrower_name: form.borrower_name.trim(),
      borrower_id: form.borrower_id.trim(),
      borrower_department: form.borrower_department,
      issue_date: form.issue_date,
      return_date: form.return_date,
      fine_per_day: form.fine_per_day,
      notes: form.notes,
      status: 'issued',
    }).select().single();

    if (!error) {
      await supabase.from('books').update({
        available_copies: Math.max(0, selectedBook.available_copies - 1),
      }).eq('id', selectedBook.id);
      setBooks(prev => prev.map(b => b.id === selectedBook.id ? { ...b, available_copies: Math.max(0, b.available_copies - 1) } : b));
      setIssues(prev => [data, ...prev]);
      toast.success('✅ किताब जारी की गई / Book issued!');
      setIssueDialogOpen(false);
      resetIssueForm();
    } else {
      toast.error('Failed to issue');
      console.error(error);
    }
    setSaving(false);
  };

  const resetIssueForm = () => {
    setForm({ borrower_type: 'student', borrower_name: '', borrower_id: '', borrower_department: '', issue_date: today, return_date: '', fine_per_day: 5, notes: '' });
    setSelectedBook(null);
    setBookSearch('');
    setBorrowerQuery('');
  };

  const handleReturn = async () => {
    if (!selectedIssue) return;
    setSaving(true);
    const fine = calculateFine(selectedIssue);

    const { error } = await supabase.from('book_issues').update({
      status: 'returned',
      actual_return_date: today,
      fine_amount: fine,
      updated_at: new Date().toISOString(),
    }).eq('id', selectedIssue.id);

    if (!error) {
      const book = books.find(b => b.id === selectedIssue.book_id);
      if (book) {
        await supabase.from('books').update({ available_copies: book.available_copies + 1 }).eq('id', book.id);
        setBooks(prev => prev.map(b => b.id === book.id ? { ...b, available_copies: b.available_copies + 1 } : b));
      }
      setIssues(prev => prev.map(i => i.id === selectedIssue.id ? { ...i, status: 'returned', actual_return_date: today, fine_amount: fine } : i));
      toast.success(`✅ वापसी हो गई${fine > 0 ? ` | जुर्माना: ₹${fine}` : ''}`);
    } else toast.error('Failed');

    setSaving(false);
    setReturnDialogOpen(false);
  };

  const statusBadge = (issue: any) => {
    const s = getStatus(issue);
    if (s === 'returned') return <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Returned</Badge>;
    if (s === 'overdue') return <Badge variant="destructive">Overdue</Badge>;
    return <Badge className="bg-primary/10 text-primary">Issued</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Book Issues / किताब जारी
        </h1>
        <Button size="sm" onClick={() => { resetIssueForm(); setIssueDialogOpen(true); }} className="gradient-primary text-primary-foreground gap-1 shadow-primary">
          <Plus className="h-4 w-4" /> Issue Book / किताब जारी करें
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Issued / जारी', value: issuedCount, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Overdue / विलंबित', value: overdueCount, color: 'text-destructive', bg: 'bg-destructive/10' },
          { label: 'Returned / वापस', value: returnedCount, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
          { label: 'Total Fines / कुल जुर्माना', value: `₹${totalFines}`, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
        ].map((s, i) => (
          <Card key={i} className="shadow-card border-border/50">
            <CardContent className="p-4 text-center">
              <div className={`inline-flex h-10 w-10 rounded-lg ${s.bg} items-center justify-center mb-2`}>
                <span className={`text-lg font-bold ${s.color}`}>{typeof s.value === 'number' ? s.value : ''}</span>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {overdueCount > 0 && (
        <Card className="shadow-card mb-4 border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm font-medium text-destructive">⚠️ {overdueCount} books overdue! / {overdueCount} किताबें वापसी की तारीख निकल गई!</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="shadow-card mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search borrower, book name / उधारकर्ता, किताब खोजें" className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status / सभी</SelectItem>
                <SelectItem value="issued">Issued / जारी</SelectItem>
                <SelectItem value="overdue">Overdue / विलंबित</SelectItem>
                <SelectItem value="returned">Returned / वापस</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground self-center whitespace-nowrap">{filtered.length} records</p>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-card">
        {loading ? (
          <CardContent className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
        ) : filtered.length === 0 ? (
          <CardContent className="p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No issues found / कोई रिकॉर्ड नहीं</h3>
            <p className="text-sm text-muted-foreground">Click "Issue Book" to issue a book / "किताब जारी करें" पर क्लिक करें</p>
          </CardContent>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book / किताब</TableHead>
                    <TableHead>Borrower / उधारकर्ता</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fine / जुर्माना</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageIssues.map(issue => (
                    <TableRow key={issue.id} className={getStatus(issue) === 'overdue' ? 'bg-destructive/5' : ''}>
                      <TableCell>
                        <p className="font-medium text-sm">{getBookTitle(issue.book_id)}</p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{issue.borrower_name}</p>
                          <p className="text-xs text-muted-foreground">{issue.borrower_id} {issue.borrower_department && `• ${issue.borrower_department}`}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${issue.borrower_type === 'teacher' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                          {issue.borrower_type === 'teacher' ? 'Teacher' : 'Student'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{issue.issue_date}</TableCell>
                      <TableCell className="text-sm">{issue.return_date}</TableCell>
                      <TableCell>{statusBadge(issue)}</TableCell>
                      <TableCell>
                        {calculateFine(issue) > 0 && (
                          <span className="text-sm font-bold text-orange-600 flex items-center gap-0.5">
                            <IndianRupee className="h-3 w-3" />{calculateFine(issue)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {issue.status !== 'returned' && (
                          <Button variant="outline" size="sm" onClick={() => { setSelectedIssue(issue); setReturnDialogOpen(true); }} className="gap-1 text-xs">
                            <RotateCcw className="h-3 w-3" /> Return
                          </Button>
                        )}
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

      {/* Issue Book Dialog */}
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookPlus className="h-5 w-5 text-primary" />
              Issue Book / किताब जारी करें
            </DialogTitle>
            <DialogDescription>Search book by name, or add new if not found / किताब का नाम लिखकर खोजें</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Book Search with inline add */}
            <div className="space-y-2">
              <Label className="font-semibold">Book / किताब <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={bookSearch}
                  onChange={e => {
                    setBookSearch(e.target.value);
                    setSelectedBook(null);
                    setShowBookDropdown(true);
                  }}
                  onFocus={() => setShowBookDropdown(true)}
                  placeholder="Type book name to search / किताब का नाम लिखें..."
                  className="pl-10 h-11"
                />
                {selectedBook && (
                  <button onClick={() => { setSelectedBook(null); setBookSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              {/* Dropdown results */}
              {showBookDropdown && bookSearch.trim() && !selectedBook && (
                <div className="border rounded-lg bg-card shadow-lg max-h-48 overflow-y-auto">
                  {bookSearchResults.length > 0 ? (
                    bookSearchResults.map(b => (
                      <button key={b.id} onClick={() => selectBook(b)}
                        className="w-full text-left px-3 py-2.5 hover:bg-muted/50 border-b last:border-b-0 transition-colors">
                        <p className="text-sm font-medium">{b.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.author && `${b.author} • `}{b.available_copies} available / उपलब्ध
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center">
                      <p className="text-sm text-muted-foreground mb-2">No book found / किताब नहीं मिली</p>
                      <Button size="sm" variant="outline" onClick={() => {
                        setQuickBookForm({ title: bookSearch.trim(), author: '', total_copies: 1 });
                        setQuickAddOpen(true);
                        setShowBookDropdown(false);
                      }} className="gap-1">
                        <Plus className="h-3 w-3" /> Add "{bookSearch.trim()}" as new book
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {selectedBook && (
                <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-sm flex items-center justify-between">
                  <div>
                    <p className="font-medium text-primary">{selectedBook.title}</p>
                    <p className="text-xs text-muted-foreground">{selectedBook.author} • {selectedBook.available_copies} copies available</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Selected ✓</Badge>
                </div>
              )}
            </div>

            {/* Borrower Type */}
            <div className="space-y-2">
              <Label>Borrower Type / उधारकर्ता</Label>
              <Select value={form.borrower_type} onValueChange={v => setForm(p => ({ ...p, borrower_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student / छात्र</SelectItem>
                  <SelectItem value="teacher">Teacher / शिक्षक</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auto-fill */}
            <div className="p-3 rounded-lg bg-muted/50 border space-y-2">
              <Label className="text-xs text-muted-foreground">Auto-fill: Roll No / Employee ID लिखें</Label>
              <div className="flex gap-2">
                <Input value={borrowerQuery} onChange={e => setBorrowerQuery(e.target.value)}
                  placeholder={form.borrower_type === 'student' ? 'Roll No' : 'Employee ID'}
                  className="h-9 text-sm"
                  onKeyDown={e => e.key === 'Enter' && searchBorrower()} />
                <Button variant="outline" size="sm" onClick={searchBorrower} disabled={borrowerSearching} className="h-9">
                  {borrowerSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Borrower Name / नाम <span className="text-destructive">*</span></Label>
                <Input value={form.borrower_name} onChange={e => setForm(p => ({ ...p, borrower_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{form.borrower_type === 'student' ? 'Roll No *' : 'Employee ID *'}</Label>
                <Input value={form.borrower_id} onChange={e => setForm(p => ({ ...p, borrower_id: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Department / विभाग</Label>
              <Input value={form.borrower_department} onChange={e => setForm(p => ({ ...p, borrower_department: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date / जारी तिथि <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.issue_date} onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Return Date / वापसी तिथि <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.return_date} onChange={e => setForm(p => ({ ...p, return_date: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fine/day (₹) / प्रतिदिन जुर्माना</Label>
                <Input type="number" min={0} value={form.fine_per_day} onChange={e => setForm(p => ({ ...p, fine_per_day: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Notes / नोट्स</Label>
                <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueDialogOpen(false)}>Cancel / रद्द</Button>
            <Button onClick={handleIssue} disabled={saving || !selectedBook} className="gradient-primary text-primary-foreground shadow-primary">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : '✅ Issue Book / किताब जारी करें'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Book Dialog */}
      <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookPlus className="h-5 w-5 text-primary" />
              Quick Add Book / जल्दी किताब जोड़ें
            </DialogTitle>
            <DialogDescription>Add a new book and continue issuing / नई किताब जोड़ें और जारी करें</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Book Title / शीर्षक <span className="text-destructive">*</span></Label>
              <Input value={quickBookForm.title} onChange={e => setQuickBookForm(p => ({ ...p, title: e.target.value }))} placeholder="Book name" autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Author / लेखक</Label>
              <Input value={quickBookForm.author} onChange={e => setQuickBookForm(p => ({ ...p, author: e.target.value }))} placeholder="Author name" />
            </div>
            <div className="space-y-2">
              <Label>Total Copies / कुल प्रतियां</Label>
              <Input type="number" min={1} value={quickBookForm.total_copies} onChange={e => setQuickBookForm(p => ({ ...p, total_copies: parseInt(e.target.value) || 1 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickAddOpen(false)}>Cancel</Button>
            <Button onClick={handleQuickAddBook} disabled={quickAdding || !quickBookForm.title.trim()} className="gradient-primary text-primary-foreground">
              {quickAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : '✅ Add & Select'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>📖 Return Book / किताब वापसी</DialogTitle>
          </DialogHeader>
          {selectedIssue && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 space-y-1.5 text-sm">
                <p><span className="text-muted-foreground">Book:</span> <span className="font-medium">{getBookTitle(selectedIssue.book_id)}</span></p>
                <p><span className="text-muted-foreground">Borrower:</span> <span className="font-medium">{selectedIssue.borrower_name}</span></p>
                <p><span className="text-muted-foreground">Issue Date:</span> {selectedIssue.issue_date}</p>
                <p><span className="text-muted-foreground">Due Date:</span> {selectedIssue.return_date}</p>
                <p><span className="text-muted-foreground">Return Today:</span> <span className="font-medium text-primary">{today}</span></p>
              </div>
              {calculateFine(selectedIssue) > 0 && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                  <p className="text-sm text-destructive font-medium">Late Fine / विलंब जुर्माना</p>
                  <p className="text-2xl font-bold text-destructive">₹{calculateFine(selectedIssue)}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.floor((new Date(today).getTime() - new Date(selectedIssue.return_date).getTime()) / 86400000)} days × ₹{selectedIssue.fine_per_day}/day
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleReturn} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : '✅ Confirm Return / वापसी पक्की करें'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
