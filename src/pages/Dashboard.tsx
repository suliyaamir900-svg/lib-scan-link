import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CalendarDays, CalendarRange, CalendarClock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['hsl(250, 80%, 60%)', 'hsl(200, 90%, 55%)', 'hsl(320, 75%, 55%)', 'hsl(30, 90%, 55%)', 'hsl(160, 70%, 45%)', 'hsl(0, 84%, 60%)'];

export default function Dashboard() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase
        .from('libraries')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setLibrary(lib);

      if (lib) {
        const { data: ent } = await supabase
          .from('student_entries')
          .select('*')
          .eq('library_id', lib.id)
          .order('created_at', { ascending: false });
        setEntries(ent || []);
      }
      setLoading(false);
    };
    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel('dashboard-entries')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'student_entries' }, (payload) => {
        setEntries(prev => [payload.new as any, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{t('common.loading')}</div>;
  if (!user) return <Navigate to="/login" />;

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const todayEntries = entries.filter(e => e.entry_date === today).length;
  const weeklyEntries = entries.filter(e => e.entry_date >= weekAgo).length;
  const monthlyEntries = entries.filter(e => e.entry_date >= monthAgo).length;

  const stats = [
    { label: t('dashboard.total_students'), value: entries.length.toString(), icon: Users, gradient: 'gradient-primary' },
    { label: t('dashboard.today_entries'), value: todayEntries.toString(), icon: CalendarDays, gradient: 'gradient-accent' },
    { label: t('dashboard.weekly_entries'), value: weeklyEntries.toString(), icon: CalendarRange, gradient: 'gradient-warm' },
    { label: t('dashboard.monthly_entries'), value: monthlyEntries.toString(), icon: CalendarClock, gradient: 'gradient-success' },
  ];

  // Department distribution
  const deptMap: Record<string, number> = {};
  entries.forEach(e => { deptMap[e.department] = (deptMap[e.department] || 0) + 1; });
  const deptData = Object.entries(deptMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Year distribution
  const yearMap: Record<string, number> = {};
  entries.forEach(e => { yearMap[e.year] = (yearMap[e.year] || 0) + 1; });
  const yearData = Object.entries(yearMap).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));

  // Last 7 days activity
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en', { weekday: 'short' });
    const count = entries.filter(e => e.entry_date === dateStr).length;
    return { name: dayLabel, entries: count };
  });

  // Recent entries
  const recentEntries = entries.slice(0, 8);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
        {library && <p className="text-sm text-muted-foreground">{library.name} — {library.college_name}</p>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">{t('common.loading')}</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((s, i) => (
              <Card key={i} className="shadow-card border-border/50 overflow-hidden">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl ${s.gradient} flex items-center justify-center shrink-0`}>
                    <s.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Activity Line */}
            <Card className="shadow-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Last 7 Days Activity / पिछले 7 दिन
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={last7}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="entries" stroke="hsl(250, 80%, 60%)" strokeWidth={3} dot={{ fill: 'hsl(250, 80%, 60%)', r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Department Pie */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Department / विभाग</CardTitle>
              </CardHeader>
              <CardContent>
                {deptData.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-10">No data yet / अभी कोई डेटा नहीं</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={deptData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
                        {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Year Bar Chart */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Year Distribution / वर्ष वितरण</CardTitle>
              </CardHeader>
              <CardContent>
                {yearData.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-10">No data yet / अभी कोई डेटा नहीं</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={yearData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {yearData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Recent Entries */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Recent Entries / हाल की एंट्री</CardTitle>
              </CardHeader>
              <CardContent>
                {recentEntries.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-10">No entries yet / अभी कोई एंट्री नहीं</p>
                ) : (
                  <div className="space-y-3">
                    {recentEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{entry.student_name}</p>
                          <p className="text-xs text-muted-foreground">{entry.department} • {entry.year} • {entry.roll_number}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{entry.entry_date}</p>
                          <p className="text-xs text-muted-foreground">{entry.entry_time?.slice(0, 5)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
