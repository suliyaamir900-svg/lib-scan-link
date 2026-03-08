import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Clock, Trophy, Search, Loader2, Calendar, ArrowLeft, GraduationCap, TrendingUp, AlertCircle } from 'lucide-react';

export default function StudentPortal() {
  const { libraryId } = useParams<{ libraryId: string }>();
  const [libraryName, setLibraryName] = useState('');
  const [libraryNotFound, setLibraryNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [bookIssues, setBookIssues] = useState<any[]>([]);
  const [points, setPoints] = useState<any>(null);

  useEffect(() => {
    if (!libraryId) return;
    const fetchLib = async () => {
      const { data } = await supabase
        .from('libraries')
        .select('name, college_name')
        .eq('id', libraryId)
        .maybeSingle();
      if (!data) setLibraryNotFound(true);
      else setLibraryName(`${data.name} - ${data.college_name}`);
      setLoading(false);
    };
    fetchLib();
  }, [libraryId]);

  const handleSearch = async () => {
    if (!query.trim() || !libraryId) return;
    setSearching(true);
    setStudentData(null);

    // Fetch recent entries
    const { data: entriesData } = await supabase
      .from('student_entries')
      .select('*')
      .eq('library_id', libraryId)
      .or(`roll_number.eq.${query.trim()},employee_id.eq.${query.trim()}`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (entriesData && entriesData.length > 0) {
      const latest = entriesData[0];
      setStudentData({
        name: latest.student_name,
        department: latest.department,
        year: latest.year,
        rollNumber: latest.roll_number,
        userType: latest.user_type,
      });
      setEntries(entriesData);

      // Total study time
      const totalMins = entriesData.reduce((sum, e) => sum + (e.study_minutes || 0), 0);
      const totalVisits = entriesData.length;

      // Fetch book issues
      const { data: issues } = await supabase
        .from('book_issues')
        .select('*, books(title, author)')
        .eq('library_id', libraryId)
        .eq('borrower_id', query.trim())
        .order('created_at', { ascending: false })
        .limit(10);
      setBookIssues(issues || []);

      // Fetch gamification points
      const { data: pointsData } = await supabase
        .from('student_points')
        .select('*')
        .eq('library_id', libraryId)
        .eq('student_id', query.trim())
        .maybeSingle();
      setPoints(pointsData || { total_points: totalVisits * 2, library_visits: totalVisits, total_study_minutes: totalMins, badges: [], books_borrowed: issues?.length || 0 });
    } else {
      setStudentData(null);
      setEntries([]);
    }
    setSearching(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (libraryNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <Card className="w-full max-w-md shadow-card text-center">
          <CardContent className="p-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold">Library Not Found</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalStudyHrs = entries.reduce((s, e) => s + (e.study_minutes || 0), 0);
  const hrs = Math.floor(totalStudyHrs / 60);
  const mins = totalStudyHrs % 60;

  return (
    <div className="min-h-screen py-6 px-4 bg-background">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-card">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-3">
              <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-lg">Student Portal / छात्र पोर्टल</CardTitle>
            <CardDescription>{libraryName}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Enter Roll No / Employee ID"
                onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              <Button onClick={handleSearch} disabled={searching} className="gradient-primary text-primary-foreground shrink-0">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {studentData && (
          <>
            {/* Profile Card */}
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
                    {studentData.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">{studentData.name}</h2>
                    <p className="text-sm text-muted-foreground">{studentData.department} • {studentData.year}</p>
                    <p className="text-xs text-muted-foreground">Roll: {studentData.rollNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Visits', value: entries.length, icon: Calendar, color: 'text-primary' },
                { label: 'Study Time', value: `${hrs}h ${mins}m`, icon: Clock, color: 'text-orange-500' },
                { label: 'Books Borrowed', value: bookIssues.length, icon: BookOpen, color: 'text-green-500' },
                { label: 'Points', value: points?.total_points || 0, icon: Trophy, color: 'text-yellow-500' },
              ].map((s, i) => (
                <Card key={i} className="shadow-card">
                  <CardContent className="p-4 text-center">
                    <s.icon className={`h-6 w-6 mx-auto mb-1 ${s.color}`} />
                    <p className="text-xl font-bold">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Badges */}
            {points?.badges && points.badges.length > 0 && (
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500" /> Badges / बैज</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {points.badges.map((b: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{b}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Book Issues */}
            {bookIssues.length > 0 && (
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Books / किताबें</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {bookIssues.map((issue: any) => (
                    <div key={issue.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{(issue.books as any)?.title || 'Book'}</p>
                        <p className="text-[10px] text-muted-foreground">{(issue.books as any)?.author}</p>
                      </div>
                      <Badge variant={issue.status === 'issued' ? 'destructive' : 'secondary'} className="text-[10px] shrink-0">
                        {issue.status === 'issued' ? `Due: ${new Date(issue.return_date).toLocaleDateString('en-IN')}` : issue.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recent Visits */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Recent Visits / हाल की विज़िट</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {entries.slice(0, 10).map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border text-sm">
                    <div>
                      <p className="font-medium">{new Date(e.entry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {e.entry_time?.substring(0, 5)} → {e.exit_time ? e.exit_time.substring(0, 5) : 'Still inside'}
                      </p>
                    </div>
                    {e.study_minutes ? (
                      <Badge variant="outline" className="text-[10px]">
                        <Clock className="h-3 w-3 mr-1" />
                        {Math.floor(e.study_minutes / 60)}h {e.study_minutes % 60}m
                      </Badge>
                    ) : e.exit_time ? null : (
                      <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        {!studentData && !searching && query && (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No records found for "{query}"</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
