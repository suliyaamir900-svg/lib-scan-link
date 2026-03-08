import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Search, Trash2, Loader2, Users, ChevronLeft, ChevronRight, GraduationCap, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const PAGE_SIZE = 15;

export default function Students() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [historyStudent, setHistoryStudent] = useState<string | null>(null);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        // Get student entries (user_type = 'student' or default/legacy)
        const { data } = await supabase.from('student_entries').select('*').eq('library_id', lib.id).order('created_at', { ascending: false });
        setEntries((data || []).filter((e: any) => !e.user_type || e.user_type === 'student'));
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    let result = entries;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.student_name.toLowerCase().includes(q) ||
        e.roll_number.toLowerCase().includes(q) ||
        (e.enrollment_number || '').toLowerCase().includes(q) ||
        e.mobile.includes(q)
      );
    }
    if (deptFilter !== 'all') result = result.filter(e => e.department === deptFilter);
    if (yearFilter !== 'all') result = result.filter(e => e.year === yearFilter);
    setFiltered(result);
    setPage(0);
  }, [entries, search, deptFilter, yearFilter]);

  const viewHistory = (rollNumber: string) => {
    const history = entries.filter(e => e.roll_number === rollNumber).sort((a, b) => b.entry_date.localeCompare(a.entry_date));
    setStudentHistory(history);
    setHistoryStudent(rollNumber);
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const departments = [...new Set(entries.map(e => e.department))].sort();
  const years = [...new Set(entries.map(e => e.year))].sort();
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageEntries = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === pageEntries.length) setSelected(new Set());
    else setSelected(new Set(pageEntries.map(e => e.id)));
  };

  const handleDelete = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} entries?`)) return;
    const { error } = await supabase.from('student_entries').delete().in('id', ids);
    if (error) { toast.error('Failed'); } else {
      setEntries(prev => prev.filter(e => !ids.includes(e.id)));
      setSelected(new Set());
      toast.success(`${ids.length} deleted`);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          {t('nav.students')}
        </h1>
        <p className="text-sm text-muted-foreground">{filtered.length} entries</p>
      </div>

      <Card className="shadow-card mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, roll, enrollment, mobile" className="pl-10" />
            </div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dept</SelectItem>
                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Year</SelectItem>
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
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
          <CardContent className="p-10 text-center text-muted-foreground">No entries found</CardContent>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"><input type="checkbox" checked={selected.size === pageEntries.length && pageEntries.length > 0} onChange={toggleAll} className="rounded" /></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Enrollment</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageEntries.map(entry => (
                    <TableRow key={entry.id} className={selected.has(entry.id) ? 'bg-primary/5' : ''}>
                      <TableCell><input type="checkbox" checked={selected.has(entry.id)} onChange={() => toggleSelect(entry.id)} className="rounded" /></TableCell>
                      <TableCell className="font-medium">{entry.student_name}</TableCell>
                      <TableCell><span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">{entry.department}</span></TableCell>
                      <TableCell>{entry.year}</TableCell>
                      <TableCell>{entry.roll_number}</TableCell>
                      <TableCell>{entry.enrollment_number || '-'}</TableCell>
                      <TableCell>{entry.mobile}</TableCell>
                      <TableCell>{entry.entry_date}</TableCell>
                      <TableCell>{entry.entry_time?.slice(0, 5)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => viewHistory(entry.roll_number)} title="View History">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete([entry.id])} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Entry History Dialog */}
      <Dialog open={!!historyStudent} onOpenChange={() => setHistoryStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Entry History / एंट्री इतिहास</DialogTitle>
          </DialogHeader>
          {studentHistory.length > 0 && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-primary/5 text-center">
                <p className="font-bold">{studentHistory[0].student_name}</p>
                <p className="text-sm text-muted-foreground">{studentHistory[0].department} • {studentHistory[0].year}</p>
                <p className="text-lg font-bold text-primary mt-1">Total Visits: {studentHistory.length}</p>
                <p className="text-xs text-muted-foreground">Last Visit: {studentHistory[0].entry_date}</p>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {studentHistory.map(h => (
                  <div key={h.id} className="flex justify-between p-2 rounded bg-muted/50 text-sm">
                    <span>{h.entry_date}</span>
                    <span className="text-muted-foreground">{h.entry_time?.slice(0, 5)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
