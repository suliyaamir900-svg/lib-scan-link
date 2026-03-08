import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, Loader2, BookOpen, RotateCcw, AlertTriangle, ChevronLeft, ChevronRight, IndianRupee } from 'lucide-react';
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

  const [form, setForm] = useState({
    book_id: '', borrower_type: 'student', borrower_name: '', borrower_id: '',
    borrower_department: '', issue_date: new Date().toISOString().split('T')[0],
    return_date: '', fine_per_day: 5,
  });

  // Borrower search for repeat issue
  const [borrowerQuery, setBorrowerQuery] = useState('');
  const [borrowerSearching, setBorrowerSearching] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        const [issuesRes, booksRes] = await Promise.all([
          (supabase as any).from('book_issues').select('*').eq('library_id', lib.id).order('created_at', { ascending: false }),
          (supabase as any).from('books').select('*').eq('library_id', lib.id).order('title'),
        ]);
        setIssues(issuesRes.data || []);
        setBooks(booksRes.data || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const today = new Date().toISOString().split('T')[0];

  // Calculate overdue for display
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
    const matchesSearch = !q || i.borrower_name.toLowerCase().includes(q) || i.borrower_id.toLowerCase().includes(q);
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

  const searchBorrower = async () => {
    if (!borrowerQuery.trim() || !library) return;
    setBorrowerSearching(true);

    if (form.borrower_type === 'student') {
      const { data } = await (supabase as any).from('students').select('*').eq('library_id', library.id)
        .or(`roll_number.eq.${borrowerQuery.trim()},enrollment_number.eq.${borrowerQuery.trim()}`).maybeSingle();
      if (data) {
        setForm(p => ({ ...p, borrower_name: data.name, borrower_id: data.roll_number || borrowerQuery.trim(), borrower_department: data.department }));
        toast.success('Student found / छात्र मिला');
      } else toast.info('Not found, enter manually');
    } else {
      const { data } = await (supabase as any).from('teachers').select('*').eq('library_id', library.id)
        .eq('employee_id', borrowerQuery.trim()).maybeSingle();
      if (data) {
        setForm(p => ({ ...p, borrower_name: data.name, borrower_id: data.employee_id, borrower_department: data.department }));
        toast.success('Teacher found / शिक्षक मिला');
      } else toast.info('Not found, enter manually');
    }
    setBorrowerSearching(false);
  };

  const handleIssue = async () => {
    if (!form.book_id || !form.borrower_name.trim() || !form.borrower_id.trim() || !form.return_date) {
      toast.error('Fill all required fields'); return;
    }
    if (!library) return;
    setSaving(true);

    const book = books.find(b => b.id === form.book_id);
    if (book && book.available_copies <= 0) {
      toast.error('No copies available / कोई प्रति उपलब्ध नहीं');
      setSaving(false); return;
    }

    const { data, error } = await (supabase as any).from('book_issues').insert({
      library_id: library.id,
      book_id: form.book_id,
      borrower_type: form.borrower_type,
      borrower_name: form.borrower_name.trim(),
      borrower_id: form.borrower_id.trim(),
      borrower_department: form.borrower_department,
      issue_date: form.issue_date,
      return_date: form.return_date,
      fine_per_day: form.fine_per_day,
      status: 'issued',
    }).select().single();

    if (!error && book) {
      await (supabase as any).from('books').update({
        available_copies: Math.max(0, book.available_copies - 1),
      }).eq('id', book.id);
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, available_copies: Math.max(0, b.available_copies - 1) } : b));
    }

    setSaving(false);
    if (error) { toast.error('Failed to issue'); console.error(error); }
    else {
      setIssues(prev => [data, ...prev]);
      toast.success('Book issued / किताब जारी की गई');
      setIssueDialogOpen(false);
      setForm({ book_id: '', borrower_type: 'student', borrower_name: '', borrower_id: '', borrower_department: '', issue_date: today, return_date: '', fine_per_day: 5 });
      setBorrowerQuery('');
    }
  };

  const openReturn = (issue: any) => {
    setSelectedIssue(issue);
    setReturnDialogOpen(true);
  };

  const handleReturn = async () => {
    if (!selectedIssue) return;
    setSaving(true);
    const fine = calculateFine(selectedIssue);

    const { error } = await (supabase as any).from('book_issues').update({
      status: 'returned',
      actual_return_date: today,
      fine_amount: fine,
      updated_at: new Date().toISOString(),
    }).eq('id', selectedIssue.id);

    if (!error) {
      const book = books.find(b => b.id === selectedIssue.book_id);
      if (book) {
        await (supabase as any).from('books').update({
          available_copies: book.available_copies + 1,
        }).eq('id', book.id);
        setBooks(prev => prev.map(b => b.id === book.id ? { ...b, available_copies: b.available_copies + 1 } : b));
      }
      setIssues(prev => prev.map(i => i.id === selectedIssue.id ? { ...i, status: 'returned', actual_return_date: today, fine_amount: fine } : i));
      toast.success(`Returned${fine > 0 ? ` | Fine: ₹${fine}` : ''}`);
    } else toast.error('Failed');

    setSaving(false);
    setReturnDialogOpen(false);
  };

  const statusBadge = (issue: any) => {
    const s = getStatus(issue);
    if (s === 'returned') return <Badge variant="secondary" className="bg-green-100 text-green-700">Returned</Badge>;
    if (s === 'overdue') return <Badge variant="destructive">Overdue</Badge>;
    return <Badge className="bg-primary/10 text-primary">Issued</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Book Issues / किताब जारी
        </h1>
        <Button size="sm" onClick={() => setIssueDialogOpen(true)} className="gradient-primary text-primary-foreground gap-1">
          <Plus className="h-4 w-4" /> Issue Book
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Issued', value: issuedCount, color: 'text-primary' },
          { label: 'Overdue', value: overdueCount, color: 'text-destructive' },
          { label: 'Returned', value: returnedCount, color: 'text-green-600' },
          { label: 'Total Fines', value: `₹${totalFines}`, color: 'text-orange-600' },
        ].map((s, i) => (
          <Card key={i} className="shadow-card">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {overdueCount > 0 && (
        <Card className="shadow-card mb-4 border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-sm font-medium text-destructive">{overdueCount} books overdue! / {overdueCount} किताबें वापसी की तारीख निकल गई!</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="shadow-card mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search borrower name, ID" className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-card">
        {loading ? (
          <CardContent className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
        ) : filtered.length === 0 ? (
          <CardContent className="p-10 text-center text-muted-foreground">No issues found</CardContent>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fine</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageIssues.map(issue => (
                    <TableRow key={issue.id} className={getStatus(issue) === 'overdue' ? 'bg-destructive/5' : ''}>
                      <TableCell className="font-medium text-sm">{getBookTitle(issue.book_id)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{issue.borrower_name}</p>
                          <p className="text-xs text-muted-foreground">{issue.borrower_id} {issue.borrower_department && `• ${issue.borrower_department}`}</p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize text-xs">{issue.borrower_type}</TableCell>
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
                          <Button variant="outline" size="sm" onClick={() => openReturn(issue)} className="gap-1 text-xs">
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
            <DialogTitle>Issue Book / किताब जारी करें</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Book / किताब चुनें *</Label>
              <Select value={form.book_id} onValueChange={v => setForm(p => ({ ...p, book_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Search and select book" /></SelectTrigger>
                <SelectContent>
                  {books.filter(b => b.available_copies > 0).map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.title} — {b.author} ({b.available_copies} avail.)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            {/* Repeat issue search */}
            <div className="p-3 rounded-lg bg-muted/50 border space-y-2">
              <Label className="text-xs text-muted-foreground">Auto-fill: Enter Roll No / Employee ID</Label>
              <div className="flex gap-2">
                <Input value={borrowerQuery} onChange={e => setBorrowerQuery(e.target.value)} placeholder={form.borrower_type === 'student' ? 'Roll No' : 'Employee ID'} className="h-9 text-sm" onKeyDown={e => e.key === 'Enter' && searchBorrower()} />
                <Button variant="outline" size="sm" onClick={searchBorrower} disabled={borrowerSearching} className="h-9">
                  {borrowerSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Borrower Name *</Label>
                <Input value={form.borrower_name} onChange={e => setForm(p => ({ ...p, borrower_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{form.borrower_type === 'student' ? 'Roll No *' : 'Employee ID *'}</Label>
                <Input value={form.borrower_id} onChange={e => setForm(p => ({ ...p, borrower_id: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={form.borrower_department} onChange={e => setForm(p => ({ ...p, borrower_department: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date *</Label>
                <Input type="date" value={form.issue_date} onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Return Date *</Label>
                <Input type="date" value={form.return_date} onChange={e => setForm(p => ({ ...p, return_date: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fine per day (₹) / प्रतिदिन जुर्माना</Label>
              <Input type="number" min={0} value={form.fine_per_day} onChange={e => setForm(p => ({ ...p, fine_per_day: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleIssue} disabled={saving} className="gradient-primary text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Issue Book'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Return Book / किताब वापसी</DialogTitle>
          </DialogHeader>
          {selectedIssue && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
                <p><span className="text-muted-foreground">Book:</span> <span className="font-medium">{getBookTitle(selectedIssue.book_id)}</span></p>
                <p><span className="text-muted-foreground">Borrower:</span> <span className="font-medium">{selectedIssue.borrower_name}</span></p>
                <p><span className="text-muted-foreground">Issue Date:</span> {selectedIssue.issue_date}</p>
                <p><span className="text-muted-foreground">Due Date:</span> {selectedIssue.return_date}</p>
                <p><span className="text-muted-foreground">Return Today:</span> {today}</p>
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
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Return'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
