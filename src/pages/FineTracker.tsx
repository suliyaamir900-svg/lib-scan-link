import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { IndianRupee, Search, Loader2, AlertTriangle, Phone, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function FineTracker() {
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        const [issRes, bookRes] = await Promise.all([
          supabase.from('book_issues').select('*').eq('library_id', lib.id).eq('status', 'issued').order('return_date'),
          supabase.from('books').select('id, title').eq('library_id', lib.id),
        ]);
        setIssues(issRes.data || []);
        setBooks(bookRes.data || []);
      }
      setLoading(false);
    };
    fetchData();

    // Auto-refresh every 60 seconds to keep fines real-time
    const interval = setInterval(() => {
      // Force re-render to recalculate fines
      setIssues(prev => [...prev]);
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const today = new Date().toISOString().split('T')[0];

  const calculateFine = (issue: any) => {
    if (issue.return_date >= today) return 0;
    const days = Math.floor((new Date(today).getTime() - new Date(issue.return_date).getTime()) / 86400000);
    return days * (issue.fine_per_day || 5);
  };

  const overdueIssues = useMemo(() => {
    return issues
      .filter(i => i.return_date < today)
      .map(i => ({ ...i, fine: calculateFine(i), overdueDays: Math.floor((new Date(today).getTime() - new Date(i.return_date).getTime()) / 86400000) }))
      .sort((a, b) => b.fine - a.fine);
  }, [issues, today]);

  const filtered = useMemo(() => {
    if (!search.trim()) return overdueIssues;
    const q = search.toLowerCase();
    return overdueIssues.filter(i =>
      i.borrower_name.toLowerCase().includes(q) || i.borrower_id.toLowerCase().includes(q) ||
      (books.find(b => b.id === i.book_id)?.title || '').toLowerCase().includes(q)
    );
  }, [overdueIssues, search, books]);

  const totalFine = overdueIssues.reduce((s, i) => s + i.fine, 0);
  const getBookTitle = (id: string) => books.find(b => b.id === id)?.title || 'Unknown';

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <IndianRupee className="h-6 w-6 text-primary" /> Fine Tracker / जुर्माना ट्रैकर
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Card className="shadow-card"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-destructive">₹{totalFine}</p>
          <p className="text-xs text-muted-foreground">Total Fines / कुल जुर्माना</p>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{overdueIssues.length}</p>
          <p className="text-xs text-muted-foreground">Overdue Books / विलंबित</p>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{overdueIssues.filter(i => i.overdueDays > 30).length}</p>
          <p className="text-xs text-muted-foreground">30+ Days / 30+ दिन</p>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-accent">₹{overdueIssues.length > 0 ? Math.round(totalFine / overdueIssues.length) : 0}</p>
          <p className="text-xs text-muted-foreground">Avg Fine / औसत</p>
        </CardContent></Card>
      </div>

      {overdueIssues.length > 0 && (
        <Card className="shadow-card mb-4 border-destructive/30 bg-destructive/5">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">⚠️ Fine increases daily by ₹{issues[0]?.fine_per_day || 5}/day per overdue book! / जुर्माना रोज़ बढ़ रहा है!</p>
            <Clock className="h-4 w-4 text-destructive ml-auto shrink-0 animate-pulse" />
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card mb-4">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search borrower or book / खोजें..." className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        {loading ? (
          <CardContent className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent>
        ) : filtered.length === 0 ? (
          <CardContent className="p-12 text-center">
            <IndianRupee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-1">{overdueIssues.length === 0 ? 'No overdue books! 🎉' : 'No results'}</h3>
            <p className="text-sm text-muted-foreground">{overdueIssues.length === 0 ? 'All books returned on time / सभी किताबें समय पर वापस' : 'Try different search'}</p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Borrower / उधारकर्ता</TableHead>
                  <TableHead>Book / किताब</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Overdue Days</TableHead>
                  <TableHead>Fine / जुर्माना</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(issue => (
                  <TableRow key={issue.id} className="bg-destructive/5">
                    <TableCell>
                      <p className="font-medium text-sm">{issue.borrower_name}</p>
                      <p className="text-xs text-muted-foreground">{issue.borrower_id}</p>
                    </TableCell>
                    <TableCell className="text-sm">{getBookTitle(issue.book_id)}</TableCell>
                    <TableCell className="text-sm text-destructive font-medium">{issue.return_date}</TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="gap-1">
                        <Clock className="h-3 w-3" /> {issue.overdueDays} days
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-lg font-bold text-destructive flex items-center gap-0.5">
                        <IndianRupee className="h-4 w-4" />{issue.fine}
                      </span>
                      <p className="text-[10px] text-muted-foreground">+₹{issue.fine_per_day || 5}/day</p>
                    </TableCell>
                    <TableCell>
                      {issue.borrower_phone ? (
                        <a href={`tel:${issue.borrower_phone}`} className="text-sm text-primary flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {issue.borrower_phone}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
