import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, BookOpen, Users, Medal, Loader2, Crown, Award } from 'lucide-react';

export default function Leaderboard() {
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        // Get this month's data
        const monthStart = new Date();
        monthStart.setDate(1);
        const monthStr = monthStart.toISOString().split('T')[0];

        const [entriesR, issuesR] = await Promise.all([
          supabase.from('student_entries').select('*').eq('library_id', lib.id).gte('entry_date', monthStr),
          supabase.from('book_issues').select('*').eq('library_id', lib.id).gte('issue_date', monthStr),
        ]);
        setEntries(entriesR.data || []);
        setIssues(issuesR.data || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Top visitors
  const topVisitors = useMemo(() => {
    const map: Record<string, { name: string; dept: string; count: number; type: string }> = {};
    entries.forEach(e => {
      const key = `${e.roll_number}-${e.user_type || 'student'}`;
      if (!map[key]) map[key] = { name: e.student_name, dept: e.department, count: 0, type: e.user_type || 'student' };
      map[key].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 20);
  }, [entries]);

  // Top readers (by books borrowed)
  const topReaders = useMemo(() => {
    const map: Record<string, { name: string; dept: string; count: number; type: string }> = {};
    issues.forEach(i => {
      const key = `${i.borrower_id}-${i.borrower_type}`;
      if (!map[key]) map[key] = { name: i.borrower_name, dept: i.borrower_department || '', count: 0, type: i.borrower_type };
      map[key].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 20);
  }, [issues]);

  // Most borrowed books
  const topBooks = useMemo(() => {
    const map: Record<string, { title: string; count: number }> = {};
    issues.forEach(i => {
      if (!map[i.book_id]) map[i.book_id] = { title: '', count: 0 };
      map[i.book_id].count++;
    });
    return Object.entries(map).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [issues]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{index + 1}</span>;
  };

  const getRankBg = (index: number) => {
    if (index === 0) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    if (index === 1) return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700';
    if (index === 2) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
    return 'bg-muted/50';
  };

  const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Leaderboard / लीडरबोर्ड
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{monthName} — Monthly Rankings / मासिक रैंकिंग</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <Tabs defaultValue="visitors" className="space-y-4">
          <TabsList>
            <TabsTrigger value="visitors" className="gap-1"><Users className="h-3.5 w-3.5" /> Top Visitors</TabsTrigger>
            <TabsTrigger value="readers" className="gap-1"><BookOpen className="h-3.5 w-3.5" /> Top Readers</TabsTrigger>
          </TabsList>

          <TabsContent value="visitors">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Most Frequent Visitors / सबसे ज़्यादा आने वाले
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topVisitors.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10">No data this month / इस महीने कोई डेटा नहीं</p>
                ) : (
                  <div className="space-y-2">
                    {topVisitors.map((v, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${getRankBg(i)}`}>
                        {getRankIcon(i)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{v.name}</p>
                          <p className="text-xs text-muted-foreground">{v.dept} • {v.type === 'teacher' ? 'Teacher' : 'Student'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{v.count}</p>
                          <p className="text-[10px] text-muted-foreground">visits</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="readers">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" /> Top Readers / शीर्ष पाठक
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topReaders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10">No books issued this month / इस महीने कोई किताब जारी नहीं</p>
                ) : (
                  <div className="space-y-2">
                    {topReaders.map((r, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${getRankBg(i)}`}>
                        {getRankIcon(i)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.dept} • {r.type === 'teacher' ? 'Teacher' : 'Student'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{r.count}</p>
                          <p className="text-[10px] text-muted-foreground">books</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </DashboardLayout>
  );
}
