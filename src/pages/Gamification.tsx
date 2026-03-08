import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Award, Star, BookOpen, Clock, Trophy, Zap, Shield, Target, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BADGE_DEFS = [
  { id: 'first_visit', name: 'First Visit', icon: Star, desc: 'Visited library for the first time', points: 10 },
  { id: 'bookworm', name: 'Bookworm', icon: BookOpen, desc: 'Borrowed 10+ books', points: 50 },
  { id: 'regular', name: 'Regular', icon: Clock, desc: '20+ library visits', points: 30 },
  { id: 'champion', name: 'Library Champion', icon: Trophy, desc: '50+ visits & 20+ books', points: 100 },
  { id: 'speed_reader', name: 'Speed Reader', icon: Zap, desc: 'Returned 5 books on time', points: 25 },
  { id: 'dedicated', name: 'Dedicated Scholar', icon: Shield, desc: '100+ hours of study', points: 75 },
  { id: 'top_reader', name: 'Top Reader', icon: Target, desc: 'Top 3 in monthly leaderboard', points: 150 },
];

export default function Gamification() {
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        const { data } = await (supabase as any).from('student_points').select('*').eq('library_id', lib.id).order('total_points', { ascending: false });
        setStudents(data || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const recalculatePoints = async () => {
    if (!library) return;
    toast.info('Recalculating points...');

    // Fetch all entries and issues
    const [entRes, issRes] = await Promise.all([
      supabase.from('student_entries').select('roll_number, student_name, department, exit_time, entry_time').eq('library_id', library.id),
      supabase.from('book_issues').select('borrower_id, borrower_name, status, return_date, actual_return_date').eq('library_id', library.id),
    ]);

    const entries = entRes.data || [];
    const issues = issRes.data || [];

    // Aggregate per student
    const map: Record<string, any> = {};
    entries.forEach(e => {
      if (!map[e.roll_number]) map[e.roll_number] = { student_id: e.roll_number, student_name: e.student_name, department: e.department, visits: 0, books: 0, on_time: 0, study_min: 0, badges: [] };
      map[e.roll_number].visits++;
      // Calculate study time if exit exists
      if (e.exit_time && e.entry_time) {
        const [eh, em] = e.entry_time.split(':').map(Number);
        const [xh, xm] = e.exit_time.split(':').map(Number);
        map[e.roll_number].study_min += Math.max(0, (xh * 60 + xm) - (eh * 60 + em));
      }
    });

    issues.forEach(i => {
      if (!map[i.borrower_id]) map[i.borrower_id] = { student_id: i.borrower_id, student_name: i.borrower_name, department: '', visits: 0, books: 0, on_time: 0, study_min: 0, badges: [] };
      map[i.borrower_id].books++;
      if (i.status === 'returned' && i.actual_return_date && i.return_date && i.actual_return_date <= i.return_date) {
        map[i.borrower_id].on_time++;
      }
    });

    // Calculate badges and points
    for (const s of Object.values(map)) {
      const badges: string[] = [];
      if (s.visits >= 1) badges.push('first_visit');
      if (s.books >= 10) badges.push('bookworm');
      if (s.visits >= 20) badges.push('regular');
      if (s.visits >= 50 && s.books >= 20) badges.push('champion');
      if (s.on_time >= 5) badges.push('speed_reader');
      if (s.study_min >= 6000) badges.push('dedicated');
      s.badges = badges;

      const points = s.visits * 2 + s.books * 5 + s.on_time * 3 + Math.floor(s.study_min / 60);
      
      await (supabase as any).from('student_points').upsert({
        library_id: library.id,
        student_id: s.student_id,
        student_name: s.student_name,
        department: s.department,
        total_points: points,
        books_borrowed: s.books,
        library_visits: s.visits,
        on_time_returns: s.on_time,
        total_study_minutes: s.study_min,
        badges: s.badges,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'library_id,student_id' });
    }

    // Refresh
    const { data } = await (supabase as any).from('student_points').select('*').eq('library_id', library.id).order('total_points', { ascending: false });
    setStudents(data || []);
    toast.success(`✅ Points updated for ${Object.keys(map).length} students!`);
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" /> Gamification / गेमिफिकेशन
        </h1>
        <Button size="sm" onClick={recalculatePoints} className="gradient-primary text-primary-foreground gap-1">
          <Zap className="h-4 w-4" /> Recalculate Points
        </Button>
      </div>

      {/* Badge Definitions */}
      <Card className="shadow-card mb-6">
        <CardHeader><CardTitle className="text-lg">Badges / बैज</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {BADGE_DEFS.map(b => (
              <div key={b.id} className="p-3 rounded-lg bg-muted/50 text-center">
                <b.icon className="h-8 w-8 text-primary mx-auto mb-1" />
                <p className="text-sm font-semibold">{b.name}</p>
                <p className="text-[10px] text-muted-foreground">{b.desc}</p>
                <Badge variant="secondary" className="mt-1 text-[10px]">+{b.points} pts</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Student Rankings */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" /> Student Rankings</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : students.length === 0 ? (
            <div className="text-center py-10">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Click "Recalculate Points" to generate rankings</p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.slice(0, 20).map((s, i) => (
                <div key={s.id} className={`flex items-center gap-3 p-3 rounded-lg ${i < 3 ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'}`}>
                  <span className={`text-lg font-bold w-8 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{s.student_name}</p>
                    <p className="text-xs text-muted-foreground">{s.department} • {s.library_visits} visits • {s.books_borrowed} books • {Math.round(s.total_study_minutes / 60)}h study</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {(s.badges || []).map((b: string) => {
                        const def = BADGE_DEFS.find(d => d.id === b);
                        return def ? <Badge key={b} variant="secondary" className="text-[9px] px-1 py-0">{def.name}</Badge> : null;
                      })}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold text-primary">{s.total_points}</p>
                    <p className="text-[10px] text-muted-foreground">points</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
