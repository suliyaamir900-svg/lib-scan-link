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
import { Search, Plus, Loader2, BookOpen, RotateCcw, AlertTriangle, ChevronLeft, ChevronRight, IndianRupee, BookPlus, X, Activity } from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 15;

export default function BookIssues() {
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [bookSearch, setBookSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [showBookDropdown, setShowBookDropdown] = useState(false);
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
        const [issuesRes, booksRes, settingsRes] = await Promise.all([
          supabase.from('book_issues').select('*').eq('library_id', lib.id).order('created_at', { ascending: false }),
          supabase.from('books').select('*').eq('library_id', lib.id).order('title'),
          supabase.from('library_settings').select('*').eq('library_id', lib.id).maybeSingle(),
        ]);
        setIssues(issuesRes.data || []);
        setBooks(booksRes.data || []);
        setSettings(settingsRes.data || null);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Realtime for book_issues
  useEffect(() => {
    if (!library) return;
    const channel = supabase
      .channel('bookissues-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'book_issues', filter: `library_id=eq.${library.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') setIssues(prev => [payload.new as any, ...prev]);
        else if (payload.eventType === 'UPDATE') setIssues(prev => prev.map(i => i.id === (payload.new as any).id ? payload.new as any : i));
        else if (payload.eventType === 'DELETE') setIssues(prev => prev.filter(i => i.id !== (payload.old as any).id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books', filter: `library_id=eq.${library.id}` }, (payload) => {
        if (payload.eventType === 'UPDATE') setBooks(prev => prev.map(b => b.id === (payload.new as any).id ? payload.new as any : b));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [library?.id]);

  const bookSearchResults = useMemo(() => {
    if (!bookSearch.trim()) return [];
    const q = bookSearch.toLowerCase();
    return books.filter(b => b.title.toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q) || (b.isbn || '').toLowerCase().includes(q)).slice(0, 8);
  }, [bookSearch, books]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const today = new Date().toISOString().split('T')[0];
  const maxBooksStudent = settings?.max_books_student || 3;
  const maxBooksTeacher = settings?.max_books_teacher || 5;
  const maxFineLimit = settings?.max_fine_limit || 500;

  const getStatus = (issue: any) => {
    if (issue.status === 'returned') return 'returned';
    if (issue.return_date < today) return 'overdue';
    return 'issued';
  };

  const calculateFine = (issue: any) => {
    if (issue.status === 'returned') return issue.fine_amount || 0;
    if (issue.return_date >= today) return 0;
    const days = Math.floor((new Date(today).getTime() - new Date(issue.return_date).getTime()) / 86400000);
    const fine = days * (issue.fine_per_day || 5);
    return Math.min(fine, maxFineLimit); // Apply max fine limit
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

  const selectBook = (book: any) => { setSelectedBook(book); setBookSearch(book.title); setShowBookDropdown(false); };

  const searchBorrower = async () => {
    if (!borrowerQuery.trim() || !library) return;
    setBorrowerSearching(true);
    try {
      if (form.borrower_type === 'student') {
        const { data } = await (supabase as any).from('student_profiles').select('*').eq('library_id', library.id)
          .or(`enrollment_number.eq.${borrowerQuery.trim()},roll_number.eq.${borrowerQuery.trim()}`).limit(1).maybeSingle();
        if (data) {
          setForm(p => ({ ...p, borrower_name: data.full_name, borrower_id: data.enrollment_number || data.roll_number, borrower_department: data.department || '', borrower_phone: data.mobile || '' }));
          toast.success('Student found!');
        } else {
          const { data: entryData } = await supabase.from('student_entries').select('*').eq('library_id', library.id)
            .eq('roll_number', borrowerQuery.trim()).order('created_at', { ascending: false }).limit(1).maybeSingle();
          if (entryData) {
            setForm(p => ({ ...p, borrower_name: entryData.student_name, borrower_id: entryData.roll_number, borrower_department: entryData.department, borrower_phone: entryData.mobile || '' }));
            toast.success('Found from entries!');
          } else toast.info('Not found — enter manually');
        }
      } else {
        const { data } = await (supabase as any).from('teacher_profiles').select('*').eq('library_id', library.id)
          .eq('employee_id', borrowerQuery.trim()).limit(1).maybeSingle();
        if (data) {
          setForm(p => ({ ...p, borrower_name: data.full_name, borrower_id: data.employee_id, borrower_department: data.department || '', borrower_phone: data.mobile || '' }));
          toast.success('Teacher found!');
        } else toast.info('Not found — enter manually');
      }
    } catch { toast.info('Enter details manually'); }
    setBorrowerSearching(false);
  };

  const handleQuickAddBook = async () => {
    if (!quickBookForm.title.trim() || !library) return;
    setQuickAdding(true);
    const { data, error } = await supabase.from('books').insert({
      library_id: library.id, title: quickBookForm.title.trim(), author: quickBookForm.author.trim(),
      total_copies: quickBookForm.total_copies, available_copies: quickBookForm.total_copies,
    }).select().single();
    if (error) toast.error(`Failed: ${error.message}`);
    else {
      setBooks(prev => [...prev, data].sort((a: any, b: any) => a.title.localeCompare(b.title)));
      setSelectedBook(data); setBookSearch(data.title); setQuickAddOpen(false);
      setQuickBookForm({ title: '', author: '', total_copies: 1 });
      toast.success('Book added!');
    }
    setQuickAdding(false);
  };

  const handleIssue = async () => {
    if (!selectedBook || !form.borrower_name.trim() || !form.borrower_id.trim() || !form.return_date) {
      toast.error('Fill all required fields / सभी ज़रूरी फ़ील्ड भरें'); return;
    }
    if (!library) return;
    setSaving(true);

    if (selectedBook.available_copies <= 0) {
      toast.error('No copies available / कोई प्रति उपलब्ध नहीं'); setSaving(false); return;
    }

    // Check borrowing limit
    const borrowerActiveIssues = issues.filter(i => i.status === 'issued' && i.borrower_id === form.borrower_id.trim()).length;
    const maxBooks = form.borrower_type === 'teacher' ? maxBooksTeacher : maxBooksStudent;
    if (borrowerActiveIssues >= maxBooks) {
      toast.error(`Borrowing limit reached! ${form.borrower_type === 'teacher' ? 'Teacher' : 'Student'} can borrow max ${maxBooks} books. Currently has ${borrowerActiveIssues}.`);
      setSaving(false); return;
    }

    const { data, error } = await supabase.from('book_issues').insert({
      library_id: library.id, book_id: selectedBook.id, borrower_type: form.borrower_type,
      borrower_name: form.borrower_name.trim(), borrower_id: form.borrower_id.trim(),
      borrower_department: form.borrower_department, borrower_phone: form.borrower_phone,
      issue_date: form.issue_date, return_date: form.return_date, fine_per_day: form.fine_per_day,
      notes: form.notes, status: 'issued',
    }).select().single();

    if (!error) {
      await supabase.from('books').update({ available_copies: Math.max(0, selectedBook.available_copies - 1) }).eq('id', selectedBook.id);
      setBooks(prev => prev.map(b => b.id === selectedBook.id ? { ...b, available_copies: Math.max(0, b.available_copies - 1) } : b));
      setIssues(prev => [data, ...prev]);
      toast.success('✅ Book issued!'); setIssueDialogOpen(false); resetIssueForm();
    } else { toast.error('Failed to issue'); console.error(error); }
    setSaving(false);
  };

  const resetIssueForm = () => {
    setForm({ borrower_type: 'student', borrower_name: '', borrower_id: '', borrower_department: '', borrower_phone: '', issue_date: today, return_date: '', fine_per_day: settings?.default_fine_per_day || 5, notes: '' });
    setSelectedBook(null); setBookSearch(''); setBorrowerQuery('');
  };

  const handleReturn = async () => {
    if (!selectedIssue) return;
    setSaving(true);
    const fine = calculateFine(selectedIssue);
    const { error } = await supabase.from('book_issues').update({
      status: 'returned', actual_return_date: today, fine_amount: fine, updated_at: new Date().toISOString(),
    }).eq('id', selectedIssue.id);
    if (!error) {
      const book = books.find(b => b.id === selectedIssue.book_id);
      if (book) {
        await supabase.from('books').update({ available_copies: book.available_copies + 1 }).eq('id', book.id);
        setBooks(prev => prev.map(b => b.id === book.id ? { ...b, available_copies: b.available_copies + 1 } : b));
      }
      setIssues(prev => prev.map(i => i.id === selectedIssue.id ? { ...i, status: 'returned', actual_return_date: today, fine_amount: fine } : i));
      toast.success(`✅ Returned${fine > 0 ? ` | Fine: ₹${fine}` : ''}`);
    } else toast.error('Failed');
    setSaving(false); setReturnDialogOpen(false);
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
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> Book Issues / किताब जारी
          </h1>
          <Badge variant="outline" className="gap-1 text-[10px] animate-pulse border-green-500 text-green-600">
            <Activity className="h-3 w-3" /> Live
          </Badge>
        </div>
        <Button size="sm" onClick={() => { resetIssueForm(); setIssueDialogOpen(true); }} className="gradient-primary text-primary-foreground gap-1 shadow-primary">
          <Plus className="h-4 w-4" /> Issue Book
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        {[
          { label: 'Issued', value: issuedCount, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Overdue', value: overdueCount, color: 'text-destructive', bg: 'bg-destructive/10' },
          { label: 'Returned', value: returnedCount, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
          { label: 'Total Fines', value: `₹${totalFines}`, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
          { label: 'Limit', value: `S:${maxBooksStudent} T:${maxBooksTeacher}`, color: 'text-secondary', bg: 'bg-secondary/10' },
        ].map((s, i) => (
          <Card key={i} className="shadow-card border-border/50">
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {overdueCount > 0 && (
        <Card className="shadow-card mb-4 border-destructive/30 bg-destructive/5">
          <CardContent className="p-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm font-medium text-destructive">⚠️ {overdueCount} books overdue!</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="shadow-card mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search borrower, book..." className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
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
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4"><BookOpen className="h-8 w-8 text-muted-foreground" /></div>
            <h3 className="font-semibold mb-1">No issues found</h3>
          </CardContent>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Book</TableHead><TableHead>Borrower</TableHead><TableHead>Type</TableHead>
                  <TableHead>Issue Date</TableHead><TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead><TableHead>Fine</TableHead><TableHead className="w-24"></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {pageIssues.map(issue => (
                    <TableRow key={issue.id} className={getStatus(issue) === 'overdue' ? 'bg-destructive/5' : ''}>
                      <TableCell><p className="font-medium text-sm">{getBookTitle(issue.book_id)}</p></TableCell>
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
                            {calculateFine(issue) >= maxFineLimit && <Badge variant="outline" className="text-[8px] ml-1 border-destructive text-destructive">MAX</Badge>}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {issue.status === 'issued' && (
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

      {/* Issue Dialog */}
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Issue Book / किताब जारी करें</DialogTitle>
            <DialogDescription>Search and select book, then enter borrower details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Book Search */}
            <div className="space-y-2">
              <Label className="font-medium">Book / किताब *</Label>
              <div className="relative">
                <Input value={bookSearch} onChange={e => { setBookSearch(e.target.value); setShowBookDropdown(true); setSelectedBook(null); }} placeholder="Search book title, author, ISBN..." />
                {showBookDropdown && bookSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-popover border rounded-lg shadow-lg">
                    {bookSearchResults.map(b => (
                      <div key={b.id} className={`p-3 hover:bg-muted cursor-pointer border-b last:border-0 ${b.available_copies <= 0 ? 'opacity-50' : ''}`} onClick={() => b.available_copies > 0 && selectBook(b)}>
                        <p className="text-sm font-medium">{b.title}</p>
                        <p className="text-xs text-muted-foreground">{b.author} • {b.available_copies}/{b.total_copies} available</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedBook && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <div className="flex-1"><p className="text-sm font-medium">{selectedBook.title}</p><p className="text-xs text-muted-foreground">{selectedBook.available_copies} copies available</p></div>
                  <Button variant="ghost" size="icon" onClick={() => { setSelectedBook(null); setBookSearch(''); }} className="h-6 w-6"><X className="h-3 w-3" /></Button>
                </div>
              )}
              <Button variant="link" size="sm" onClick={() => setQuickAddOpen(true)} className="text-xs gap-1 p-0 h-auto"><BookPlus className="h-3 w-3" /> Add new book</Button>
            </div>

            {/* Borrower Type */}
            <div className="space-y-2">
              <Label>Borrower Type *</Label>
              <Select value={form.borrower_type} onValueChange={v => setForm(p => ({ ...p, borrower_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student (max {maxBooksStudent})</SelectItem>
                  <SelectItem value="teacher">Teacher (max {maxBooksTeacher})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Search */}
            <div className="space-y-2">
              <Label>Quick Search (Enrollment/Roll/Employee ID)</Label>
              <div className="flex gap-2">
                <Input value={borrowerQuery} onChange={e => setBorrowerQuery(e.target.value)} placeholder="Enter ID..." onKeyDown={e => e.key === 'Enter' && searchBorrower()} />
                <Button variant="outline" onClick={searchBorrower} disabled={borrowerSearching}>
                  {borrowerSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Name *</Label><Input value={form.borrower_name} onChange={e => setForm(p => ({ ...p, borrower_name: e.target.value }))} className="h-9" /></div>
              <div className="space-y-1"><Label className="text-xs">ID *</Label><Input value={form.borrower_id} onChange={e => setForm(p => ({ ...p, borrower_id: e.target.value }))} className="h-9" /></div>
              <div className="space-y-1"><Label className="text-xs">Department</Label><Input value={form.borrower_department} onChange={e => setForm(p => ({ ...p, borrower_department: e.target.value }))} className="h-9" /></div>
              <div className="space-y-1"><Label className="text-xs">Phone</Label><Input value={form.borrower_phone} onChange={e => setForm(p => ({ ...p, borrower_phone: e.target.value }))} className="h-9" /></div>
              <div className="space-y-1"><Label className="text-xs">Issue Date *</Label><Input type="date" value={form.issue_date} onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))} className="h-9" /></div>
              <div className="space-y-1"><Label className="text-xs">Return Date *</Label><Input type="date" value={form.return_date} onChange={e => setForm(p => ({ ...p, return_date: e.target.value }))} className="h-9" /></div>
              <div className="space-y-1"><Label className="text-xs">Fine/Day (₹)</Label><Input type="number" value={form.fine_per_day} onChange={e => setForm(p => ({ ...p, fine_per_day: parseInt(e.target.value) || 5 }))} className="h-9" /></div>
              <div className="space-y-1"><Label className="text-xs">Notes</Label><Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="h-9" /></div>
            </div>

            {/* Current borrow count warning */}
            {form.borrower_id && (() => {
              const activeCount = issues.filter(i => i.status === 'issued' && i.borrower_id === form.borrower_id.trim()).length;
              const max = form.borrower_type === 'teacher' ? maxBooksTeacher : maxBooksStudent;
              if (activeCount > 0) return (
                <div className={`p-2 rounded-lg text-xs ${activeCount >= max ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                  Currently issued: {activeCount}/{max} {activeCount >= max && '⚠️ LIMIT REACHED!'}
                </div>
              );
              return null;
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleIssue} disabled={saving} className="gradient-primary text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Issue Book'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Book Dialog */}
      <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Quick Add Book</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={quickBookForm.title} onChange={e => setQuickBookForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div><Label>Author</Label><Input value={quickBookForm.author} onChange={e => setQuickBookForm(p => ({ ...p, author: e.target.value }))} /></div>
            <div><Label>Copies</Label><Input type="number" value={quickBookForm.total_copies} onChange={e => setQuickBookForm(p => ({ ...p, total_copies: parseInt(e.target.value) || 1 }))} /></div>
          </div>
          <DialogFooter>
            <Button onClick={handleQuickAddBook} disabled={quickAdding} className="gradient-primary text-primary-foreground">
              {quickAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Book'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Return Book / किताब वापसी</DialogTitle></DialogHeader>
          {selectedIssue && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium">{getBookTitle(selectedIssue.book_id)}</p>
                <p className="text-sm text-muted-foreground">{selectedIssue.borrower_name} • {selectedIssue.borrower_id}</p>
                <p className="text-xs text-muted-foreground">Due: {selectedIssue.return_date}</p>
              </div>
              {calculateFine(selectedIssue) > 0 && (
                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <p className="text-sm text-destructive font-medium">Fine: ₹{calculateFine(selectedIssue)}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.floor((new Date(today).getTime() - new Date(selectedIssue.return_date).getTime()) / 86400000)} days overdue × ₹{selectedIssue.fine_per_day || 5}/day
                    {calculateFine(selectedIssue) >= maxFineLimit && ' (Max limit applied)'}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleReturn} disabled={saving} className="gradient-primary text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Return'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
