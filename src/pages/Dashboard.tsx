import { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, CalendarDays, CalendarRange, CalendarClock, TrendingUp, GraduationCap, Briefcase,
  DoorOpen, BookOpen, AlertTriangle, Trophy, IndianRupee, FileText,
  Download, UserX, BookCopy, Activity, RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import LibraryTypeSetup from './LibraryTypeSetup';
import LiveOccupancy from '@/components/dashboard/LiveOccupancy';
import AIInsightsCard from '@/components/dashboard/AIInsightsCard';
import PeakHoursChart from '@/components/dashboard/PeakHoursChart';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

const COLORS = ['hsl(250, 80%, 60%)', 'hsl(200, 90%, 55%)', 'hsl(320, 75%, 55%)', 'hsl(30, 90%, 55%)', 'hsl(160, 70%, 45%)', 'hsl(0, 84%, 60%)'];

export default function Dashboard() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<any[]>([]);
  const [teacherProfiles, setTeacherProfiles] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
    setLibrary(lib);
    if (lib) {
      const [entRes, issRes, spRes, tpRes, booksRes] = await Promise.all([
        supabase.from('student_entries').select('*').eq('library_id', lib.id).order('created_at', { ascending: false }),
        supabase.from('book_issues').select('*').eq('library_id', lib.id),
        (supabase as any).from('student_profiles').select('id, full_name, department, enrollment_number, roll_number').eq('library_id', lib.id),
        (supabase as any).from('teacher_profiles').select('id, full_name, department, employee_id').eq('library_id', lib.id),
        supabase.from('books').select('id, title, total_copies, available_copies, status').eq('library_id', lib.id),
      ]);
      setEntries(entRes.data || []);
      setIssues(issRes.data || []);
      setStudentProfiles(spRes.data || []);
      setTeacherProfiles(tpRes.data || []);
      setBooks(booksRes.data || []);
    }
    setLoading(false);
    setLastRefresh(new Date());
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime subscriptions
  useEffect(() => {
    if (!library) return;
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_entries', filter: `library_id=eq.${library.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') setEntries(prev => [payload.new as any, ...prev]);
        else if (payload.eventType === 'UPDATE') setEntries(prev => prev.map(e => e.id === (payload.new as any).id ? payload.new as any : e));
        else if (payload.eventType === 'DELETE') setEntries(prev => prev.filter(e => e.id !== (payload.old as any).id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'book_issues', filter: `library_id=eq.${library.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') setIssues(prev => [payload.new as any, ...prev]);
        else if (payload.eventType === 'UPDATE') setIssues(prev => prev.map(i => i.id === (payload.new as any).id ? payload.new as any : i));
        else if (payload.eventType === 'DELETE') setIssues(prev => prev.filter(i => i.id !== (payload.old as any).id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books', filter: `library_id=eq.${library.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') setBooks(prev => [payload.new as any, ...prev]);
        else if (payload.eventType === 'UPDATE') setBooks(prev => prev.map(b => b.id === (payload.new as any).id ? payload.new as any : b));
        else if (payload.eventType === 'DELETE') setBooks(prev => prev.filter(b => b.id !== (payload.old as any).id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_profiles', filter: `library_id=eq.${library.id}` }, () => { fetchData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teacher_profiles', filter: `library_id=eq.${library.id}` }, () => { fetchData(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [library?.id]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{t('common.loading')}</div>;
  if (!user) return <Navigate to="/login" />;
  if (library && !library.library_type) return <LibraryTypeSetup libraryId={library.id} onDone={(type) => setLibrary({ ...library, library_type: type })} />;

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];

  const todayEntries = entries.filter(e => e.entry_date === today);
  const studentsInside = todayEntries.filter(e => (e.user_type || 'student') === 'student' && !e.exit_time).length;
  const teachersInside = todayEntries.filter(e => e.user_type === 'teacher' && !e.exit_time).length;
  const overdueBooks = issues.filter(i => i.status === 'issued' && i.return_date < today).length;
  const totalFines = issues.filter(i => i.status === 'issued' && i.return_date < today).reduce((sum, i) => {
    const days = Math.floor((new Date(today).getTime() - new Date(i.return_date).getTime()) / 86400000);
    return sum + days * (i.fine_per_day || 5);
  }, 0);
  const issuedBooksCount = issues.filter(i => i.status === 'issued').length;
  const totalBooksCount = books.length;
  const totalCopies = books.reduce((s, b) => s + (b.total_copies || 0), 0);
  const availableCopies = books.reduce((s, b) => s + (b.available_copies || 0), 0);

  // Inactive students (no visit in 90 days)
  const activeStudentIds = new Set(entries.filter(e => e.entry_date >= ninetyDaysAgo).map(e => e.roll_number || e.enrollment_number));
  const inactiveStudents = studentProfiles.filter(s => !activeStudentIds.has(s.enrollment_number) && !activeStudentIds.has(s.roll_number));

  // Quick exports
  const exportStudentList = () => {
    const data = studentProfiles.map((s: any, i: number) => ({ 'S.No': i + 1, Name: s.full_name, Department: s.department || '-', Enrollment: s.enrollment_number || '-' }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, `students-${today}.xlsx`);
    toast.success('Student list exported!');
  };
  const exportTeacherList = () => {
    const data = teacherProfiles.map((t: any, i: number) => ({ 'S.No': i + 1, Name: t.full_name, Department: t.department || '-', 'Employee ID': t.employee_id || '-' }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Teachers');
    XLSX.writeFile(wb, `teachers-${today}.xlsx`);
    toast.success('Teacher list exported!');
  };
  const exportEntryLogs = () => {
    const data = entries.map((e: any, i: number) => ({
      'S.No': i + 1, Name: e.student_name, Department: e.department, 'Roll/ID': e.roll_number,
      Date: e.entry_date, 'Entry Time': e.entry_time, 'Exit Time': e.exit_time || '-',
      'Study (min)': e.study_minutes || 0, Type: e.user_type || 'student',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Entry Logs');
    XLSX.writeFile(wb, `entry-logs-${today}.xlsx`);
    toast.success('Entry logs exported!');
  };
  const exportBookIssues = () => {
    const data = issues.map((i: any, idx: number) => ({
      'S.No': idx + 1, Borrower: i.borrower_name, 'Borrower ID': i.borrower_id, Type: i.borrower_type,
      'Issue Date': i.issue_date, 'Due Date': i.return_date, Status: i.status, 'Fine (₹)': i.fine_amount || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Book Issues');
    XLSX.writeFile(wb, `book-issues-${today}.xlsx`);
    toast.success('Book issues exported!');
  };

  const mainStats = [
    { label: 'Registered Students', value: studentProfiles.length, icon: GraduationCap, gradient: 'gradient-primary' },
    { label: 'Registered Teachers', value: teacherProfiles.length, icon: Briefcase, gradient: 'gradient-accent' },
    { label: 'Total Books', value: totalBooksCount, icon: BookOpen, gradient: 'gradient-warm' },
    { label: 'Books Issued', value: issuedBooksCount, icon: BookCopy, gradient: 'gradient-success' },
  ];

  const activityStats = [
    { label: t('dashboard.today_entries'), value: todayEntries.length.toString(), icon: CalendarDays, gradient: 'gradient-primary' },
    { label: 'Weekly / साप्ताहिक', value: entries.filter(e => e.entry_date >= weekAgo).length.toString(), icon: CalendarRange, gradient: 'gradient-accent' },
    { label: 'Monthly / मासिक', value: entries.filter(e => e.entry_date >= monthAgo).length.toString(), icon: CalendarClock, gradient: 'gradient-warm' },
    { label: 'Total Entries', value: entries.length.toString(), icon: Users, gradient: 'gradient-success' },
  ];

  const occupancy = [
    { label: 'Students Inside', value: studentsInside, icon: GraduationCap, color: 'text-primary' },
    { label: 'Teachers Inside', value: teachersInside, icon: Briefcase, color: 'text-accent' },
    { label: 'Total Inside', value: studentsInside + teachersInside, icon: DoorOpen, color: 'text-secondary' },
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

  // Monthly trend (last 30 days grouped by week)
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000);
    return d.toISOString().split('T')[0];
  });
  const weeklyTrend = [0, 1, 2, 3].map(week => {
    const weekDates = last30.slice(week * 7, (week + 1) * 7);
    const count = entries.filter(e => weekDates.includes(e.entry_date)).length;
    const studyMins = entries.filter(e => weekDates.includes(e.entry_date)).reduce((s, e) => s + (e.study_minutes || 0), 0);
    return { name: `Week ${week + 1}`, entries: count, hours: Math.round(studyMins / 60) };
  });

  // Top visitors
  const visitorMap: Record<string, { name: string; count: number; dept: string }> = {};
  entries.forEach(e => {
    const key = e.roll_number;
    if (!visitorMap[key]) visitorMap[key] = { name: e.student_name, count: 0, dept: e.department };
    visitorMap[key].count++;
  });
  const topVisitors = Object.values(visitorMap).sort((a, b) => b.count - a.count).slice(0, 5);
  const recentEntries = entries.slice(0, 8);

  // Total study hours
  const totalStudyHours = Math.round(entries.reduce((s, e) => s + (e.study_minutes || 0), 0) / 60);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
          {library && <p className="text-sm text-muted-foreground">{library.name} — {library.college_name}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={fetchData} className="h-8 w-8">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Badge variant="outline" className="gap-1 text-xs animate-pulse border-green-500 text-green-600">
            <Activity className="h-3 w-3" /> Live
          </Badge>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">{t('common.loading')}</div>
      ) : (
        <>
          {/* ── SMART SUMMARY ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {mainStats.map((s, i) => (
              <Card key={i} className="stat-card border-border/50 overflow-hidden group">
                <div className={`h-1 ${s.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-11 w-11 rounded-xl ${s.gradient} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <s.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Activity Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {activityStats.map((s, i) => (
              <Card key={i} className="stat-card border-border/50 overflow-hidden group">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${s.gradient} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <s.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Alerts Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                      <o.icon className={`h-4 w-4 mx-auto mb-1 ${o.color}`} />
                      <p className="text-lg font-bold">{o.value}</p>
                      <p className="text-[9px] text-muted-foreground">{o.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Book Alerts */}
            <Card className={`shadow-card ${overdueBooks > 0 ? 'border-destructive/30' : 'border-primary/20'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" /> Books Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-green-600">{availableCopies}</p>
                    <p className="text-[9px] text-muted-foreground">Available</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-primary">{issuedBooksCount}</p>
                    <p className="text-[9px] text-muted-foreground">Issued</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className={`text-lg font-bold ${overdueBooks > 0 ? 'text-destructive' : 'text-green-600'}`}>{overdueBooks}</p>
                    <p className="text-[9px] text-muted-foreground">Overdue</p>
                  </div>
                </div>
                {overdueBooks > 0 && (
                  <div className="mt-2 p-2 rounded bg-destructive/5 text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {overdueBooks} overdue!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fines */}
            <Link to="/fines">
              <Card className="shadow-card border-destructive/20 hover:border-destructive/40 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-destructive" /> Active Fines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-destructive">₹{totalFines}</p>
                  <p className="text-xs text-muted-foreground mt-1">{overdueBooks} overdue • ₹{issues[0]?.fine_per_day || 5}/day</p>
                </CardContent>
              </Card>
            </Link>

            {/* Inactive Students */}
            <Card className={`shadow-card ${inactiveStudents.length > 0 ? 'border-orange-300' : 'border-primary/20'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserX className="h-4 w-4 text-orange-500" /> Inactive (90d)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${inactiveStudents.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>{inactiveStudents.length}</p>
                {inactiveStudents.length > 0 && (
                  <div className="mt-1 text-[10px] text-muted-foreground max-h-12 overflow-y-auto">
                    {inactiveStudents.slice(0, 3).map((s: any) => (
                      <p key={s.id} className="truncate">{s.full_name} • {s.department}</p>
                    ))}
                    {inactiveStudents.length > 3 && <p>+{inactiveStudents.length - 3} more</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* One-Click Exports */}
          <Card className="shadow-card mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" /> Quick Exports / एक-क्लिक एक्सपोर्ट
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={exportStudentList} className="gap-1 text-xs">
                  <GraduationCap className="h-3 w-3" /> Students ({studentProfiles.length})
                </Button>
                <Button variant="outline" size="sm" onClick={exportTeacherList} className="gap-1 text-xs">
                  <Briefcase className="h-3 w-3" /> Teachers ({teacherProfiles.length})
                </Button>
                <Button variant="outline" size="sm" onClick={exportEntryLogs} className="gap-1 text-xs">
                  <CalendarDays className="h-3 w-3" /> Entry Logs ({entries.length})
                </Button>
                <Button variant="outline" size="sm" onClick={exportBookIssues} className="gap-1 text-xs">
                  <BookOpen className="h-3 w-3" /> Book Issues ({issues.length})
                </Button>
                <Link to="/reports">
                  <Button variant="outline" size="sm" className="gap-1 text-xs">
                    <FileText className="h-3 w-3" /> Advanced Reports →
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Live Occupancy + AI Insights + Peak Hours */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {library && <LiveOccupancy libraryId={library.id} />}
            <AIInsightsCard
              stats={{
                studentsInside,
                teachersInside,
                todayEntries: todayEntries.length,
                weekEntries: entries.filter(e => e.entry_date >= weekAgo).length,
                overdueBooks,
                totalFines,
                inactiveStudents: inactiveStudents.length,
                issuedBooks: issuedBooksCount,
                availableCopies,
                topDept: deptData[0]?.name,
              }}
            />
            <PeakHoursChart entries={entries} />
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
                <CardTitle className="text-lg">Monthly Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="entries" name="Entries" stroke="hsl(250, 80%, 60%)" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="hours" name="Study Hours" stroke="hsl(160, 70%, 45%)" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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
                          <span className={`text-xs font-bold w-5 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : 'text-muted-foreground'}`}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                          </span>
                          <div>
                            <span className="text-sm font-medium truncate">{v.name}</span>
                            <p className="text-[9px] text-muted-foreground">{v.dept}</p>
                          </div>
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
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">{entry.entry_time?.slice(0, 5)}</p>
                          {entry.exit_time ? <p className="text-[10px] text-green-600">Exit: {entry.exit_time?.slice(0, 5)}</p>
                            : <Badge variant="outline" className="text-[8px] py-0 border-green-500 text-green-600">Inside</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Footer */}
          <Card className="shadow-card overflow-hidden">
            <div className="h-1 gradient-primary" />
            <CardContent className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors">
                  <p className="text-2xl font-bold gradient-text">{totalStudyHours}h</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Study Hours</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-accent/5 hover:bg-accent/10 transition-colors">
                  <p className="text-2xl font-bold text-accent">{totalCopies}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Book Copies</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-secondary/5 hover:bg-secondary/10 transition-colors">
                  <p className="text-2xl font-bold text-secondary">{new Set(entries.map(e => e.roll_number)).size}</p>
                  <p className="text-xs text-muted-foreground mt-1">Unique Visitors</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                  <p className="text-2xl font-bold">{deptData[0]?.name || '-'}</p>
                  <p className="text-xs text-muted-foreground mt-1">Top Department</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-right mt-3">Last refreshed: {lastRefresh.toLocaleTimeString()}</p>
            </CardContent>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
