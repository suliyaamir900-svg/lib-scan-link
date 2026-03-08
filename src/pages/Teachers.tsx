import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Search, Trash2, Loader2, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 15;

export default function Teachers() {
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        const { data } = await supabase.from('student_entries').select('*').eq('library_id', lib.id).eq('user_type', 'teacher').order('created_at', { ascending: false });
        setEntries(data || []);
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
        (e.employee_id || '').toLowerCase().includes(q) ||
        e.mobile.includes(q)
      );
    }
    if (deptFilter !== 'all') result = result.filter(e => e.department === deptFilter);
    setFiltered(result);
    setPage(0);
  }, [entries, search, deptFilter]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const departments = [...new Set(entries.map(e => e.department))].sort();
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
          <Briefcase className="h-6 w-6 text-accent" />
          Teachers / शिक्षक
        </h1>
        <p className="text-sm text-muted-foreground">{filtered.length} entries</p>
      </div>

      <Card className="shadow-card mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, employee ID, mobile" className="pl-10" />
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
          <CardContent className="p-10 text-center text-muted-foreground">No teacher entries found</CardContent>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"><input type="checkbox" checked={selected.size === pageEntries.length && pageEntries.length > 0} onChange={toggleAll} className="rounded" /></TableHead>
                    <TableHead>Name / नाम</TableHead>
                    <TableHead>Dept / विभाग</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageEntries.map(entry => (
                    <TableRow key={entry.id} className={selected.has(entry.id) ? 'bg-primary/5' : ''}>
                      <TableCell><input type="checkbox" checked={selected.has(entry.id)} onChange={() => toggleSelect(entry.id)} className="rounded" /></TableCell>
                      <TableCell className="font-medium">{entry.student_name}</TableCell>
                      <TableCell><span className="px-2 py-0.5 rounded-full text-xs bg-accent/10 text-accent font-medium">{entry.department}</span></TableCell>
                      <TableCell>{entry.employee_id || '-'}</TableCell>
                      <TableCell>{entry.mobile}</TableCell>
                      <TableCell>{entry.entry_date}</TableCell>
                      <TableCell>{entry.entry_time?.slice(0, 5)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete([entry.id])} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
    </DashboardLayout>
  );
}
