import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { FileSpreadsheet, FileText, Download, Loader2, Calendar, Search, User, BookOpen, Clock, Eye, ChevronLeft, GraduationCap, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export default function Reports() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentEntries, setStudentEntries] = useState<any[]>([]);
  const [studentIssues, setStudentIssues] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        const [entRes, issRes, booksRes, spRes] = await Promise.all([
          supabase.from('student_entries').select('*').eq('library_id', lib.id).order('created_at', { ascending: false }),
          supabase.from('book_issues').select('*').eq('library_id', lib.id).order('created_at', { ascending: false }),
          supabase.from('books').select('id, title').eq('library_id', lib.id),
          (supabase as any).from('student_profiles').select('*').eq('library_id', lib.id),
        ]);
        setEntries(entRes.data || []);
        setIssues(issRes.data || []);
        setBooks(booksRes.data || []);
        setStudentProfiles(spRes.data || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const getFilteredEntries = () => {
    let result = entries;
    if (dateFrom) result = result.filter(e => e.entry_date >= dateFrom);
    if (dateTo) result = result.filter(e => e.entry_date <= dateTo);
    if (deptFilter !== 'all') result = result.filter(e => e.department === deptFilter);
    return result;
  };

  const departments = [...new Set(entries.map(e => e.department))].sort();
  const getBookTitle = (bookId: string) => books.find(b => b.id === bookId)?.title || 'Unknown';

  // Student personal report
  const openStudentReport = async (profile: any) => {
    setSelectedStudent(profile);
    if (library) {
      const orParts: string[] = [];
      if (profile.enrollment_number) orParts.push(`enrollment_number.eq.${profile.enrollment_number}`);
      if (profile.roll_number) orParts.push(`roll_number.eq.${profile.roll_number}`);
      if (profile.email) orParts.push(`email.eq.${profile.email}`);

      if (orParts.length > 0) {
        const { data } = await supabase.from('student_entries').select('*').eq('library_id', library.id).or(orParts.join(',')).order('entry_date', { ascending: false });
        setStudentEntries(data || []);
      } else setStudentEntries([]);

      const borrowerId = profile.enrollment_number || profile.roll_number || profile.student_id || '';
      if (borrowerId) {
        const { data } = await supabase.from('book_issues').select('*').eq('library_id', library.id).eq('borrower_id', borrowerId).order('created_at', { ascending: false });
        setStudentIssues(data || []);
      } else setStudentIssues([]);
    }
  };

  const exportStudentReport = () => {
    if (!selectedStudent) return;
    const wb = XLSX.utils.book_new();
    
    // Visit sheet
    const visitData = studentEntries.map((e, i) => ({
      '#': i + 1, Date: e.entry_date, 'Entry Time': e.entry_time, 'Exit Time': e.exit_time || '-',
      'Study (min)': e.study_minutes || 0, Department: e.department,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(visitData), 'Visits');
    
    // Book sheet
    const bookData = studentIssues.map((i, idx) => ({
      '#': idx + 1, Book: getBookTitle(i.book_id), 'Issue Date': i.issue_date,
      'Due Date': i.return_date, Status: i.status, 'Fine (₹)': i.fine_amount || 0,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bookData), 'Books');
    
    XLSX.writeFile(wb, `${selectedStudent.full_name}-report.xlsx`);
    toast.success('Student report exported!');
  };

  const exportStudentReportPDF = () => {
    if (!selectedStudent) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Student Report: ${selectedStudent.full_name}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Enrollment: ${selectedStudent.enrollment_number || '-'} | Department: ${selectedStudent.department || '-'}`, 14, 28);
    doc.text(`Total Visits: ${studentEntries.length} | Total Study: ${Math.floor(studentEntries.reduce((s, e) => s + (e.study_minutes || 0), 0) / 60)}h | Books: ${studentIssues.length}`, 14, 35);

    doc.autoTable({
      startY: 42,
      head: [['#', 'Date', 'Entry', 'Exit', 'Study (min)']],
      body: studentEntries.map((e, i) => [i + 1, e.entry_date, e.entry_time?.slice(0, 8), e.exit_time?.slice(0, 8) || '-', e.study_minutes || 0]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
    });

    if (studentIssues.length > 0) {
      doc.autoTable({
        head: [['#', 'Book', 'Issue Date', 'Due Date', 'Status', 'Fine']],
        body: studentIssues.map((i, idx) => [idx + 1, getBookTitle(i.book_id), i.issue_date, i.return_date, i.status, `₹${i.fine_amount || 0}`]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [220, 38, 38] },
      });
    }

    doc.save(`${selectedStudent.full_name}-report.pdf`);
    toast.success('PDF report downloaded!');
  };

  const exportExcel = () => {
    setExporting(true);
    const data = getFilteredEntries().map((e, i) => ({
      'S.No': i + 1, 'Student Name': e.student_name, Department: e.department, Year: e.year,
      'Roll Number': e.roll_number, Mobile: e.mobile, Email: e.email || '-',
      'ID Card': e.id_card_number || '-', Date: e.entry_date,
      'Entry Time': e.entry_time?.slice(0, 8) || '-', 'Exit Time': e.exit_time?.slice(0, 8) || '-',
      'Study (min)': e.study_minutes || 0, Type: e.user_type || 'student',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student Entries');
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, ...data.map(row => String((row as any)[key]).length)) + 2
    }));
    ws['!cols'] = colWidths;
    XLSX.writeFile(wb, `${library?.name || 'library'}-entries-${new Date().toISOString().split('T')[0]}.xlsx`);
    setExporting(false);
    toast.success('Excel downloaded!');
  };

  const exportBookIssuesExcel = () => {
    const today = new Date().toISOString().split('T')[0];
    const data = issues.map((i, idx) => ({
      '#': idx + 1, Book: getBookTitle(i.book_id), Borrower: i.borrower_name,
      'Borrower ID': i.borrower_id, Type: i.borrower_type, Department: i.borrower_department || '-',
      'Issue Date': i.issue_date, 'Due Date': i.return_date,
      'Return Date': i.actual_return_date || '-', Status: i.status, 'Fine (₹)': i.fine_amount || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Book Issues');
    XLSX.writeFile(wb, `book-issues-${today}.xlsx`);
    toast.success('Book issues exported!');
  };

  const exportPDF = () => {
    setExporting(true);
    const doc = new jsPDF('landscape');
    const filtered = getFilteredEntries();
    doc.setFontSize(18);
    doc.text(library?.name || 'Library', 14, 20);
    doc.setFontSize(11);
    doc.text(library?.college_name || '', 14, 28);
    doc.setFontSize(9);
    doc.text(`Report Generated: ${new Date().toLocaleDateString()} | Total Entries: ${filtered.length}`, 14, 35);

    doc.autoTable({
      startY: 42,
      head: [['#', 'Name', 'Dept', 'Year', 'Roll No', 'Mobile', 'Date', 'Entry', 'Exit', 'Study(min)']],
      body: filtered.map((e, i) => [
        i + 1, e.student_name, e.department, e.year, e.roll_number, e.mobile,
        e.entry_date, e.entry_time?.slice(0, 8) || '-', e.exit_time?.slice(0, 8) || '-', e.study_minutes || 0,
      ]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [99, 102, 241] },
      alternateRowStyles: { fillColor: [245, 245, 255] },
    });

    doc.save(`${library?.name || 'library'}-report-${new Date().toISOString().split('T')[0]}.pdf`);
    setExporting(false);
    toast.success('PDF downloaded!');
  };

  const filteredCount = getFilteredEntries().length;

  // Student report view
  if (selectedStudent) {
    const totalVisits = studentEntries.length;
    const totalStudyMins = studentEntries.reduce((s, e) => s + (e.study_minutes || 0), 0);
    const avgStudyMins = totalVisits > 0 ? Math.round(totalStudyMins / totalVisits) : 0;
    const currentIssues = studentIssues.filter(i => i.status === 'issued');
    const totalFines = studentIssues.reduce((s, i) => s + (i.fine_amount || 0), 0);
    const today = new Date().toISOString().split('T')[0];
    const activeFines = studentIssues.filter(i => i.status === 'issued' && i.return_date < today).reduce((s, i) => {
      const days = Math.floor((new Date(today).getTime() - new Date(i.return_date).getTime()) / 86400000);
      return s + days * (i.fine_per_day || 5);
    }, 0);

    return (
      <DashboardLayout>
        <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Reports
        </Button>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {selectedStudent.full_name} — Personal Report
            </h1>
            <p className="text-sm text-muted-foreground">
              {selectedStudent.enrollment_number && `EN: ${selectedStudent.enrollment_number} • `}
              {selectedStudent.department || ''} • {selectedStudent.batch_year || ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportStudentReport} className="gap-1">
              <FileSpreadsheet className="h-3 w-3" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportStudentReportPDF} className="gap-1">
              <FileText className="h-3 w-3" /> PDF
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Total Visits', value: totalVisits, icon: Eye, color: 'text-primary' },
            { label: 'Total Study', value: `${Math.floor(totalStudyMins / 60)}h ${totalStudyMins % 60}m`, icon: Clock, color: 'text-secondary' },
            { label: 'Avg/Visit', value: `${Math.floor(avgStudyMins / 60)}h ${avgStudyMins % 60}m`, icon: Clock, color: 'text-accent' },
            { label: 'Books Borrowed', value: studentIssues.length, icon: BookOpen, color: 'text-primary' },
            { label: 'Currently Issued', value: currentIssues.length, icon: BookOpen, color: 'text-orange-600' },
            { label: 'Active Fines', value: `₹${activeFines}`, icon: IndianRupee, color: 'text-destructive' },
          ].map(s => (
            <Card key={s.label} className="shadow-sm overflow-hidden">
              <div className="h-0.5 bg-gradient-to-r from-primary to-secondary" />
              <CardContent className="p-3 text-center">
                <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[9px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visit History */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Visit History ({studentEntries.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Entry</TableHead>
                      <TableHead className="text-xs">Exit</TableHead>
                      <TableHead className="text-xs">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentEntries.map((e, i) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-xs">{i + 1}</TableCell>
                        <TableCell className="text-xs font-medium">{e.entry_date}</TableCell>
                        <TableCell className="text-xs font-mono">{e.entry_time?.slice(0, 8)}</TableCell>
                        <TableCell className="text-xs font-mono">
                          {e.exit_time ? e.exit_time.slice(0, 8) : <Badge variant="secondary" className="text-[9px] bg-green-100 text-green-700">Active</Badge>}
                        </TableCell>
                        <TableCell className="text-xs">
                          {e.study_minutes ? `${Math.floor(e.study_minutes / 60)}h ${e.study_minutes % 60}m` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Book History */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Book History ({studentIssues.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Book</TableHead>
                      <TableHead className="text-xs">Issue</TableHead>
                      <TableHead className="text-xs">Due</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Fine</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentIssues.map((issue, i) => (
                      <TableRow key={issue.id}>
                        <TableCell className="text-xs">{i + 1}</TableCell>
                        <TableCell className="text-xs font-medium">{getBookTitle(issue.book_id)}</TableCell>
                        <TableCell className="text-xs">{issue.issue_date}</TableCell>
                        <TableCell className="text-xs">{issue.return_date}</TableCell>
                        <TableCell>
                          <Badge variant={issue.status === 'returned' ? 'secondary' : 'default'} className={`text-[9px] ${issue.status === 'returned' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}`}>
                            {issue.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{(issue.fine_amount || 0) > 0 ? `₹${issue.fine_amount}` : '-'}</TableCell>
                      </TableRow>
                    ))}
                    {studentIssues.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-8">No books borrowed</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        {t('nav.reports')}
      </h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="entries" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="entries" className="text-xs gap-1"><Calendar className="h-3 w-3" /> Entry Reports</TabsTrigger>
            <TabsTrigger value="books" className="text-xs gap-1"><BookOpen className="h-3 w-3" /> Book Reports</TabsTrigger>
            <TabsTrigger value="students" className="text-xs gap-1"><User className="h-3 w-3" /> Student Reports</TabsTrigger>
          </TabsList>

          {/* ── ENTRY REPORTS ── */}
          <TabsContent value="entries">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" /> Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>From Date</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
                  <div className="space-y-2"><Label>To Date</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={deptFilter} onValueChange={setDeptFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="pt-2 p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-2xl font-bold text-primary">{filteredCount}</p>
                    <p className="text-sm text-muted-foreground">Matching Entries</p>
                  </div>
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-green-600" /> Excel Export
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={exportExcel} disabled={exporting || filteredCount === 0}
                        className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white">
                        <Download className="h-4 w-4" /> Download Excel ({filteredCount})
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-red-600" /> PDF Report
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={exportPDF} disabled={exporting || filteredCount === 0}
                        className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white">
                        <Download className="h-4 w-4" /> Download PDF ({filteredCount})
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Summary Stats */}
                <Card className="shadow-card">
                  <CardHeader><CardTitle className="text-lg">Summary</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {(() => {
                        const f = getFilteredEntries();
                        const deptCounts: Record<string, number> = {};
                        f.forEach(e => { deptCounts[e.department] = (deptCounts[e.department] || 0) + 1; });
                        const topDept = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0];
                        const uniqueStudents = new Set(f.map(e => e.roll_number)).size;
                        const totalStudyMins = f.reduce((s, e) => s + (e.study_minutes || 0), 0);
                        return (
                          <>
                            <div className="text-center p-3 rounded-lg bg-primary/5">
                              <p className="text-xl font-bold text-primary">{f.length}</p>
                              <p className="text-xs text-muted-foreground">Total Entries</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-accent/5">
                              <p className="text-xl font-bold text-accent">{uniqueStudents}</p>
                              <p className="text-xs text-muted-foreground">Unique Visitors</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-secondary/5">
                              <p className="text-xl font-bold text-secondary">{Math.floor(totalStudyMins / 60)}h</p>
                              <p className="text-xs text-muted-foreground">Total Study Time</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-muted">
                              <p className="text-xl font-bold">{topDept?.[0] || '-'}</p>
                              <p className="text-xs text-muted-foreground">Top Department</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ── BOOK REPORTS ── */}
          <TabsContent value="books">
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Issues', value: issues.length, color: 'text-primary' },
                  { label: 'Currently Issued', value: issues.filter(i => i.status === 'issued').length, color: 'text-orange-600' },
                  { label: 'Returned', value: issues.filter(i => i.status === 'returned').length, color: 'text-green-600' },
                  { label: 'Total Fines', value: `₹${issues.reduce((s, i) => s + (i.fine_amount || 0), 0)}`, color: 'text-destructive' },
                ].map((s, i) => (
                  <Card key={i} className="shadow-card">
                    <CardContent className="p-4 text-center">
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">Export Book Data</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-3">
                  <Button onClick={exportBookIssuesExcel} className="gap-1 bg-green-600 hover:bg-green-700 text-white">
                    <FileSpreadsheet className="h-4 w-4" /> Export Book Issues Excel
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Issues Table */}
              <Card className="shadow-card">
                <CardHeader><CardTitle className="text-lg">Recent Book Issues</CardTitle></CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Book</TableHead>
                          <TableHead className="text-xs">Borrower</TableHead>
                          <TableHead className="text-xs">Issue</TableHead>
                          <TableHead className="text-xs">Due</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Fine</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {issues.slice(0, 30).map(issue => (
                          <TableRow key={issue.id}>
                            <TableCell className="text-xs font-medium">{getBookTitle(issue.book_id)}</TableCell>
                            <TableCell className="text-xs">{issue.borrower_name}</TableCell>
                            <TableCell className="text-xs">{issue.issue_date}</TableCell>
                            <TableCell className="text-xs">{issue.return_date}</TableCell>
                            <TableCell>
                              <Badge variant={issue.status === 'returned' ? 'secondary' : 'default'}
                                className={`text-[9px] ${issue.status === 'returned' ? 'bg-green-100 text-green-700' : issue.return_date < new Date().toISOString().split('T')[0] ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                                {issue.status === 'returned' ? 'Returned' : issue.return_date < new Date().toISOString().split('T')[0] ? 'Overdue' : 'Issued'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{(issue.fine_amount || 0) > 0 ? `₹${issue.fine_amount}` : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── STUDENT PERSONAL REPORTS ── */}
          <TabsContent value="students">
            <Card className="shadow-card mb-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" /> Search Student for Personal Report
                </CardTitle>
                <CardDescription>Search by name, enrollment, roll number, or phone to generate personal report</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                    placeholder="Search student name, enrollment, roll number..." className="pl-10" />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {studentProfiles
                .filter(s => {
                  if (!studentSearch.trim()) return true;
                  const q = studentSearch.toLowerCase();
                  return (s.full_name || '').toLowerCase().includes(q) ||
                    (s.enrollment_number || '').toLowerCase().includes(q) ||
                    (s.roll_number || '').toLowerCase().includes(q) ||
                    (s.mobile || '').includes(q);
                })
                .slice(0, 30)
                .map((s: any) => {
                  const sEntries = entries.filter(e =>
                    (s.enrollment_number && e.enrollment_number === s.enrollment_number) ||
                    (s.roll_number && e.roll_number === s.roll_number)
                  );
                  const visitCount = sEntries.length;
                  const totalMins = sEntries.reduce((sum: number, e: any) => sum + (e.study_minutes || 0), 0);

                  return (
                    <Card key={s.id} className="shadow-card hover:border-primary/30 transition-colors cursor-pointer" onClick={() => openStudentReport(s)}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{s.full_name}</p>
                            <p className="text-xs text-muted-foreground">{s.department} • {s.enrollment_number || s.roll_number || '-'}</p>
                          </div>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 rounded bg-muted/50">
                            <p className="text-sm font-bold text-primary">{visitCount}</p>
                            <p className="text-[9px] text-muted-foreground">Visits</p>
                          </div>
                          <div className="text-center p-2 rounded bg-muted/50">
                            <p className="text-sm font-bold text-secondary">{Math.floor(totalMins / 60)}h</p>
                            <p className="text-[9px] text-muted-foreground">Study</p>
                          </div>
                          <div className="text-center p-2 rounded bg-muted/50">
                            <p className="text-sm font-bold text-accent">{issues.filter(i => i.borrower_id === (s.enrollment_number || s.roll_number)).length}</p>
                            <p className="text-[9px] text-muted-foreground">Books</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </DashboardLayout>
  );
}
