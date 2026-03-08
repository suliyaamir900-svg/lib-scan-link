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
import { supabase } from '@/integrations/supabase/client';
import { FileSpreadsheet, FileText, Download, Loader2, Calendar } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        const { data } = await supabase.from('student_entries').select('*').eq('library_id', lib.id).order('created_at', { ascending: false });
        setEntries(data || []);
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

  const exportExcel = () => {
    setExporting(true);
    const data = getFilteredEntries().map((e, i) => ({
      'S.No': i + 1,
      'Student Name': e.student_name,
      'Department': e.department,
      'Year': e.year,
      'Roll Number': e.roll_number,
      'Mobile': e.mobile,
      'Email': e.email || '-',
      'ID Card': e.id_card_number || '-',
      'Date': e.entry_date,
      'Time': e.entry_time?.slice(0, 5) || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student Entries');
    
    // Auto width
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, ...data.map(row => String((row as any)[key]).length)) + 2
    }));
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `${library?.name || 'library'}-entries-${new Date().toISOString().split('T')[0]}.xlsx`);
    setExporting(false);
    toast.success('Excel downloaded! / Excel डाउनलोड हो गया!');
  };

  const exportPDF = () => {
    setExporting(true);
    const doc = new jsPDF('landscape');
    const filtered = getFilteredEntries();

    // Header
    doc.setFontSize(18);
    doc.text(library?.name || 'Library', 14, 20);
    doc.setFontSize(11);
    doc.text(library?.college_name || '', 14, 28);
    doc.setFontSize(9);
    doc.text(`Report Generated: ${new Date().toLocaleDateString()} | Total Entries: ${filtered.length}`, 14, 35);

    // Table
    doc.autoTable({
      startY: 42,
      head: [['#', 'Name', 'Dept', 'Year', 'Roll No', 'Mobile', 'Email', 'Date', 'Time']],
      body: filtered.map((e, i) => [
        i + 1,
        e.student_name,
        e.department,
        e.year,
        e.roll_number,
        e.mobile,
        e.email || '-',
        e.entry_date,
        e.entry_time?.slice(0, 5) || '-',
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [99, 102, 241] },
      alternateRowStyles: { fillColor: [245, 245, 255] },
    });

    doc.save(`${library?.name || 'library'}-report-${new Date().toISOString().split('T')[0]}.pdf`);
    setExporting(false);
    toast.success('PDF downloaded! / PDF डाउनलोड हो गया!');
  };

  const filteredCount = getFilteredEntries().length;

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Filters / फ़िल्टर
              </CardTitle>
              <CardDescription>Select date range and department / दिनांक और विभाग चुनें</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>From Date / से</Label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>To Date / तक</Label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Department / विभाग</Label>
                <Select value={deptFilter} onValueChange={setDeptFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All / सभी</SelectItem>
                    {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-2 p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold text-primary">{filteredCount}</p>
                <p className="text-sm text-muted-foreground">Matching Entries / मिलान एंट्री</p>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  Excel Export / एक्सेल एक्सपोर्ट
                </CardTitle>
                <CardDescription>
                  Download all filtered student entries in Excel format / सभी फ़िल्टर्ड एंट्री Excel में डाउनलोड करें
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={exportExcel}
                  disabled={exporting || filteredCount === 0}
                  className="w-full sm:w-auto gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download Excel ({filteredCount} entries)
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-red-600" />
                  PDF Report / PDF रिपोर्ट
                </CardTitle>
                <CardDescription>
                  Generate detailed PDF report with library header / लाइब्रेरी हेडर के साथ PDF रिपोर्ट बनाएं
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={exportPDF}
                  disabled={exporting || filteredCount === 0}
                  className="w-full sm:w-auto gap-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download PDF ({filteredCount} entries)
                </Button>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Summary / सारांश</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(() => {
                    const f = getFilteredEntries();
                    const deptCounts: Record<string, number> = {};
                    f.forEach(e => { deptCounts[e.department] = (deptCounts[e.department] || 0) + 1; });
                    const topDept = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0];
                    const uniqueStudents = new Set(f.map(e => e.roll_number)).size;
                    return (
                      <>
                        <div className="text-center p-3 rounded-lg bg-primary/5">
                          <p className="text-xl font-bold text-primary">{f.length}</p>
                          <p className="text-xs text-muted-foreground">Total / कुल</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-accent/5">
                          <p className="text-xl font-bold text-accent">{uniqueStudents}</p>
                          <p className="text-xs text-muted-foreground">Unique / अद्वितीय</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-secondary/5">
                          <p className="text-xl font-bold text-secondary">{Object.keys(deptCounts).length}</p>
                          <p className="text-xs text-muted-foreground">Departments / विभाग</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted">
                          <p className="text-xl font-bold">{topDept?.[0] || '-'}</p>
                          <p className="text-xs text-muted-foreground">Top Dept / शीर्ष</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
