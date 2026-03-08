import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CalendarDays, CalendarRange, CalendarClock, TrendingUp, GraduationCap, Briefcase, DoorOpen, BookOpen, AlertTriangle, Armchair, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(250, 80%, 60%)', 'hsl(200, 90%, 55%)', 'hsl(320, 75%, 55%)', 'hsl(30, 90%, 55%)', 'hsl(160, 70%, 45%)', 'hsl(0, 84%, 60%)'];

export default function Dashboard() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [seats, setSeats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        const [entRes, issRes, seatRes] = await Promise.all([
          supabase.from('student_entries').select('*').eq('library_id', lib.id).order('created_at', { ascending: false }),
          supabase.from('book_issues').select('*').eq('library_id', lib.id),
          supabase.from('library_seats').select('*').eq('library_id', lib.id),
        ]);
        setEntries(entRes.data || []);
        setIssues(issRes.data || []);
        setSeats(seatRes.data || []);
      }
      setLoading(false);
    };
    fetchData();

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

  const todayEntries = entries.filter(e => e.entry_date === today);
  const studentsInside = todayEntries.filter(e => (e.user_type || 'student') === 'student' && !e.exit_time).length;
  const teachersInside = todayEntries.filter(e => e.user_type === 'teacher' && !e.exit_time).length;
  const overdueBooks = issues.filter(i => i.status === 'issued' && i.return_date < today).length;
  const occupiedSeats = new Set(todayEntries.filter(e => e.seat_id && !e.exit_time).map(e => e.seat_id)).size;

  const stats = [
    { label: t('dashboard.total_students'), value: entries.length.toString(), icon: Users, gradient: 'gradient-primary' },
    { label: t('dashboard.today_entries'), value: todayEntries.length.toString(), icon: CalendarDays, gradient: 'gradient-accent' },
    { label: 'Weekly / साप्ताहिक', value: entries.filter(e => e.entry_date >= weekAgo).length.toString(), icon: CalendarRange, gradient: 'gradient-warm' },
    { label: 'Monthly / मासिक', value: entries.filter(e => e.entry_date >= monthAgo).length.toString(), icon: CalendarClock, gradient: 'gradient-success' },
  ];

  const occupancy = [
    { label: 'Students Inside / छात्र अंदर', value: studentsInside, icon: GraduationCap, color: 'text-primary' },
    { label: 'Teachers Inside / शिक्षक अंदर', value: teachersInside, icon: Briefcase, color: 'text-accent' },
    { label: 'Total Inside / कुल अंदर', value: studentsInside + teachersInside, icon: DoorOpen, color: 'text-secondary' },
  ];

  // Department distribution
  const deptMap: Record<string, number> = {};
  entries.forEach(e => { deptMap[e.department] = (deptMap[e.department] || 0) + 1; });
  const deptData = Object.entries(deptMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // User type distribution
  const studentCount = entries.filter(e => (e.user_type || 'student') === 'student').length;
  const teacherCount = entries.filter(e => e.user_type === 'teacher').length;
  const typeData = [
    { name: 'Students', value: studentCount },
    { name: 'Teachers', value: teacherCount },
  ].filter(d => d.value > 0);

  // Last 7 days activity
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en', { weekday: 'short' });
    const dayEntries = entries.filter(e => e.entry_date === dateStr);
    return {
      name: dayLabel,
      students: dayEntries.filter(e => (e.user_type || 'student') === 'student').length,
      teachers: dayEntries.filter(e => e.user_type === 'teacher').length,
    };
  });

  // Most borrowed books
  const bookBorrowCount: Record<string, number> = {};
  issues.forEach(i => { bookBorrowCount[i.book_id] = (bookBorrowCount[i.book_id] || 0) + 1; });
  const topBorrowedCount = Object.values(bookBorrowCount).sort((a, b) => b - a).slice(0, 5);

  // Most frequent visitors
  const visitorMap: Record<string, { name: string; count: number }> = {};
  entries.forEach(e => {
    const key = e.roll_number;
    if (!visitorMap[key]) visitorMap[key] = { name: e.student_name, count: 0 };
    visitorMap[key].count++;
  });
  const topVisitors = Object.values(visitorMap).sort((a, b) => b.count - a.count).slice(0, 5);

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

          {/* Alerts Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Live Occupancy */}
            <Card className="shadow-card border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DoorOpen className="h-4 w-4 text-primary" /> Live Occupancy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {occupancy.map((o, i) => (
                    <div key={i} className="text-center p-2 rounded-lg bg-muted/50">
                      <o.icon className={`h-5 w-5 mx-auto mb-1 ${o.color}`} />
                      <p className="text-xl font-bold">{o.value}</p>
                      <p className="text-[10px] text-muted-foreground">{o.label.split('/')[0].trim()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Seat Status */}
            <Card className="shadow-card border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Armchair className="h-4 w-4 text-primary" /> Seat Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary">{occupiedSeats}</p>
                    <p className="text-[10px] text-muted-foreground">Occupied</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-green-600">{Math.max(0, seats.length - occupiedSeats)}</p>
                    <p className="text-[10px] text-muted-foreground">Free</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Book Alerts */}
            <Card className={`shadow-card ${overdueBooks > 0 ? 'border-destructive/30' : 'border-primary/20'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" /> Book Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary">{issues.filter(i => i.status === 'issued').length}</p>
                    <p className="text-[10px] text-muted-foreground">Issued</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className={`text-2xl font-bold ${overdueBooks > 0 ? 'text-destructive' : 'text-green-600'}`}>{overdueBooks}</p>
                    <p className="text-[10px] text-muted-foreground">Overdue</p>
                  </div>
                </div>
                {overdueBooks > 0 && (
                  <div className="mt-2 p-2 rounded bg-destructive/5 text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {overdueBooks} overdue books!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="shadow-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Last 7 Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={last7}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="students" name="Students" stackId="a" fill="hsl(250, 80%, 60%)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="teachers" name="Teachers" stackId="a" fill="hsl(320, 75%, 55%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">User Type / प्रकार</CardTitle>
              </CardHeader>
              <CardContent>
                {typeData.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-10">No data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={typeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
                        {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Department */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Department / विभाग</CardTitle>
              </CardHeader>
              <CardContent>
                {deptData.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-10">No data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={deptData.slice(0, 6)} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
                        {deptData.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top Visitors */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" /> Top Visitors</CardTitle>
              </CardHeader>
              <CardContent>
                {topVisitors.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-10">No data yet</p>
                ) : (
                  <div className="space-y-2">
                    {topVisitors.map((v, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold w-5 text-center ${i === 0 ? 'text-yellow-500' : 'text-muted-foreground'}`}>{i + 1}</span>
                          <span className="text-sm font-medium truncate">{v.name}</span>
                        </div>
                        <span className="text-sm font-bold text-primary">{v.count}</span>
                      </div>
                    ))}
                  </div>
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
                  <p className="text-center text-muted-foreground text-sm py-10">No entries yet</p>
                ) : (
                  <div className="space-y-2">
                    {recentEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center ${entry.user_type === 'teacher' ? 'bg-accent/10' : 'bg-primary/10'}`}>
                            {entry.user_type === 'teacher'
                              ? <Briefcase className="h-3 w-3 text-accent" />
                              : <GraduationCap className="h-3 w-3 text-primary" />}
                          </div>
                          <div>
                            <p className="font-medium text-xs">{entry.student_name}</p>
                            <p className="text-[10px] text-muted-foreground">{entry.department}</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{entry.entry_time?.slice(0, 5)}</p>
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
