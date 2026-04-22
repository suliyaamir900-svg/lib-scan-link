import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import {
  ChevronLeft, GraduationCap, User, Mail, Phone, Calendar, MapPin, BookOpen, Clock,
  IndianRupee, CalendarDays, Eye, TrendingUp, Activity, Award, Loader2, Briefcase
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    const fetchAll = async () => {
      const { data: lib } = await supabase.from('libraries').select('id').eq('user_id', user.id).maybeSingle();
      if (!lib) { setLoading(false); return; }

      const { data: prof } = await (supabase as any)
        .from('student_profiles').select('*').eq('id', id).eq('library_id', lib.id).maybeSingle();

      if (!prof) { setLoading(false); return; }
      setProfile(prof);

      const orParts: string[] = [];
      if (prof.enrollment_number) orParts.push(`enrollment_number.eq.${prof.enrollment_number}`);
      if (prof.roll_number) orParts.push(`roll_number.eq.${prof.roll_number}`);
      if (prof.email) orParts.push(`email.eq.${prof.email}`);

      const [entRes, issRes] = await Promise.all([
        orParts.length
          ? supabase.from('student_entries').select('*').eq('library_id', lib.id).or(orParts.join(',')).order('entry_date', { ascending: false }).limit(200)
          : Promise.resolve({ data: [] }),
        prof.enrollment_number || prof.roll_number || prof.student_id
          ? supabase.from('book_issues').select('*').eq('library_id', lib.id).eq('borrower_id', prof.enrollment_number || prof.roll_number || prof.student_id).order('created_at', { ascending: false }).limit(100)
          : Promise.resolve({ data: [] }),
      ]);
      setEntries((entRes as any).data || []);
      setIssues((issRes as any).data || []);
      setLoading(false);
    };
    fetchAll();
  }, [user, id]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Student not found</p>
          <Link to="/students"><Button variant="outline" className="mt-4">Back to Students</Button></Link>
        </div>
      </DashboardLayout>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const totalVisits = entries.length;
  const totalStudyMins = entries.reduce((s, e) => s + (e.study_minutes || 0), 0);
  const studyHours = Math.floor(totalStudyMins / 60);
  const studyMinsRem = totalStudyMins % 60;
  const currentIssues = issues.filter(i => i.status === 'issued');
  const returnedIssues = issues.filter(i => i.status === 'returned');
  const totalFines = issues.reduce((s, i) => s + (i.fine_amount || 0), 0);
  const activeEntry = entries.find(e => e.entry_date === today && !e.exit_time);
  const last30Visits = entries.filter(e => e.entry_date >= new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]).length;

  // Last 30 days visit chart
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    return {
      name: d.toLocaleDateString('en', { day: 'numeric', month: 'short' }),
      visits: entries.filter(e => e.entry_date === dateStr).length,
      mins: entries.filter(e => e.entry_date === dateStr).reduce((s, e) => s + (e.study_minutes || 0), 0),
    };
  });

  const initial = (profile.full_name || '?')[0].toUpperCase();

  const detailRows: { icon: any; label: string; value: string }[] = [
    { icon: GraduationCap, label: 'Enrollment No', value: profile.enrollment_number || '—' },
    { icon: User, label: 'Roll Number', value: profile.roll_number || '—' },
    { icon: User, label: 'Student ID', value: profile.student_id || '—' },
    { icon: Mail, label: 'Email', value: profile.email || '—' },
    { icon: Phone, label: 'Mobile', value: profile.mobile || '—' },
    { icon: Briefcase, label: 'Department', value: profile.department || '—' },
    { icon: BookOpen, label: 'Course', value: profile.course || '—' },
    { icon: CalendarDays, label: 'Batch', value: profile.batch_year || '—' },
    { icon: Calendar, label: 'Date of Birth', value: profile.date_of_birth || '—' },
    { icon: User, label: 'Gender', value: profile.gender || '—' },
    { icon: User, label: "Father's Name", value: profile.father_name || '—' },
    { icon: Phone, label: "Father's Mobile", value: profile.father_mobile || '—' },
    { icon: Phone, label: 'Emergency Contact', value: profile.emergency_contact || '—' },
    { icon: MapPin, label: 'Address', value: profile.address || '—' },
  ];

  return (
    <DashboardLayout>
      <Link to="/students">
        <Button variant="ghost" size="sm" className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Students
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Profile Card */}
        <Card className="shadow-elevated overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
          <CardContent className="p-6 text-center">
            <Avatar className="h-28 w-28 mx-auto mb-4 ring-4 ring-primary/20 shadow-primary">
              {profile.photo_url && <AvatarImage src={profile.photo_url} alt={profile.full_name} />}
              <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">{initial}</AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-bold">{profile.full_name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{profile.department}</p>
            <p className="text-xs text-muted-foreground">{profile.batch_year} {profile.current_semester && `• Sem ${profile.current_semester}`}</p>

            {profile.enrollment_number && (
              <Badge variant="outline" className="mt-3 border-primary/30 text-primary">
                EN: {profile.enrollment_number}
              </Badge>
            )}

            {activeEntry && (
              <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <p className="text-sm font-semibold">Currently in Library</p>
                </div>
                <p className="text-[11px] text-green-600/80 dark:text-green-400/80 mt-1">
                  Since {activeEntry.entry_time?.slice(0, 5)} today
                </p>
              </div>
            )}

            {profile.signature_url && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Signature</p>
                <img src={profile.signature_url} alt="signature" className="h-12 mx-auto bg-card rounded border" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Total Visits', value: totalVisits, icon: Eye, gradient: 'gradient-primary', sub: `${last30Visits} in 30d` },
            { label: 'Study Time', value: `${studyHours}h ${studyMinsRem}m`, icon: Clock, gradient: 'gradient-accent', sub: `${totalStudyMins} min total` },
            { label: 'Currently Issued', value: currentIssues.length, icon: BookOpen, gradient: 'gradient-warm', sub: `${currentIssues.filter(i => i.return_date < today).length} overdue` },
            { label: 'Books Returned', value: returnedIssues.length, icon: Award, gradient: 'gradient-success', sub: 'lifetime' },
            { label: 'Total Borrowed', value: issues.length, icon: BookOpen, gradient: 'gradient-primary', sub: 'all-time' },
            { label: 'Total Fines', value: `₹${totalFines}`, icon: IndianRupee, gradient: 'gradient-warm', sub: totalFines > 0 ? 'pending' : 'clear' },
          ].map(s => (
            <Card key={s.label} className="stat-card overflow-hidden group">
              <div className={`h-1 ${s.gradient} opacity-60 group-hover:opacity-100 transition`} />
              <CardContent className="p-4">
                <div className={`h-9 w-9 rounded-lg ${s.gradient} flex items-center justify-center mb-2 group-hover:scale-110 transition`}>
                  <s.icon className="h-4 w-4 text-primary-foreground" />
                </div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className="text-[9px] text-muted-foreground/70 mt-0.5">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="visits" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="visits" className="text-xs gap-1"><CalendarDays className="h-3.5 w-3.5" />Visits</TabsTrigger>
          <TabsTrigger value="books" className="text-xs gap-1"><BookOpen className="h-3.5 w-3.5" />Books</TabsTrigger>
          <TabsTrigger value="trends" className="text-xs gap-1"><TrendingUp className="h-3.5 w-3.5" />Trends</TabsTrigger>
          <TabsTrigger value="info" className="text-xs gap-1"><User className="h-3.5 w-3.5" />Info</TabsTrigger>
        </TabsList>

        {/* Visit Timeline */}
        <TabsContent value="visits">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Visit History (last 200)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px] pr-3">
                {entries.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-12">No visits yet</p>
                ) : (
                  <div className="relative pl-6 border-l-2 border-primary/20 space-y-3">
                    {entries.map(e => {
                      const isActive = !e.exit_time && e.entry_date === today;
                      return (
                        <div key={e.id} className="relative">
                          <div className={`absolute -left-[29px] top-1 h-3 w-3 rounded-full ring-4 ring-background ${isActive ? 'bg-green-500 animate-pulse' : 'bg-primary'}`} />
                          <div className="p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-semibold">{new Date(e.entry_date).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                              {isActive ? (
                                <Badge className="text-[9px] bg-green-500/10 text-green-600 border-green-500/30 border">Active</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px]">{e.study_minutes || 0} min</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Entry: {e.entry_time?.slice(0, 5)}</span>
                              {e.exit_time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Exit: {e.exit_time?.slice(0, 5)}</span>}
                              {e.visit_purpose && <span>• {e.visit_purpose}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Book Issues */}
        <TabsContent value="books">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Book Issue History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px] pr-3">
                {issues.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-12">No books borrowed yet</p>
                ) : (
                  <div className="space-y-2">
                    {issues.map(i => {
                      const isOverdue = i.status === 'issued' && i.return_date < today;
                      return (
                        <div key={i.id} className={`p-3 rounded-lg border ${isOverdue ? 'border-destructive/30 bg-destructive/5' : i.status === 'returned' ? 'border-green-500/20 bg-green-500/5' : 'border-border bg-muted/30'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold">Book #{i.book_id?.slice(0, 8) || '—'}</p>
                            <Badge variant={i.status === 'issued' ? (isOverdue ? 'destructive' : 'default') : 'outline'} className="text-[9px]">
                              {isOverdue ? 'OVERDUE' : i.status?.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-muted-foreground space-y-0.5">
                            <p>Issued: {i.issue_date} • Due: {i.return_date}</p>
                            {i.actual_return_date && <p>Returned: {i.actual_return_date}</p>}
                            {(i.fine_amount > 0) && <p className="text-destructive">Fine: ₹{i.fine_amount}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Charts */}
        <TabsContent value="trends" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Visits — last 30 days</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={last30Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" fontSize={9} interval={3} />
                  <YAxis fontSize={10} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Study minutes — last 30 days</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={last30Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" fontSize={9} interval={3} />
                  <YAxis fontSize={10} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="mins" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Info */}
        <TabsContent value="info">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Personal Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {detailRows.map(r => (
                  <div key={r.label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <r.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.label}</p>
                      <p className="text-sm font-medium truncate">{r.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
