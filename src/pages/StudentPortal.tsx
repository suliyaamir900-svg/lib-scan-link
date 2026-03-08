import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Clock, Trophy, Search, Loader2, Calendar, GraduationCap, TrendingUp, AlertCircle, Star, MessageSquare, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentPortal() {
  const { libraryId } = useParams<{ libraryId: string }>();
  const [libraryName, setLibraryName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [libraryNotFound, setLibraryNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [bookIssues, setBookIssues] = useState<any[]>([]);
  const [points, setPoints] = useState<any>(null);
  const [tab, setTab] = useState<'overview' | 'feedback' | 'suggest'>('overview');

  // Feedback
  const [fbRating, setFbRating] = useState(5);
  const [fbCategory, setFbCategory] = useState('general');
  const [fbMessage, setFbMessage] = useState('');
  const [fbSubmitting, setFbSubmitting] = useState(false);

  // Book suggestion
  const [sugTitle, setSugTitle] = useState('');
  const [sugAuthor, setSugAuthor] = useState('');
  const [sugReason, setSugReason] = useState('');
  const [sugSubmitting, setSugSubmitting] = useState(false);

  useEffect(() => {
    if (!libraryId) return;
    const fetchLib = async () => {
      const { data } = await supabase
        .from('libraries')
        .select('name, college_name')
        .eq('id', libraryId)
        .maybeSingle();
      if (!data) setLibraryNotFound(true);
      else { setLibraryName(data.name); setCollegeName(data.college_name); }
      setLoading(false);
    };
    fetchLib();
  }, [libraryId]);

  const handleSearch = async () => {
    if (!query.trim() || !libraryId) return;
    setSearching(true);
    setStudentData(null);

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

      const [issuesRes, pointsRes] = await Promise.all([
        supabase.from('book_issues').select('*, books(title, author)').eq('library_id', libraryId)
          .eq('borrower_id', query.trim()).order('created_at', { ascending: false }).limit(10),
        supabase.from('student_points').select('*').eq('library_id', libraryId)
          .eq('student_id', query.trim()).maybeSingle(),
      ]);

      setBookIssues(issuesRes.data || []);
      const totalMins = entriesData.reduce((s: number, e: any) => s + (e.study_minutes || 0), 0);
      setPoints(pointsRes.data || {
        total_points: entriesData.length * 2,
        library_visits: entriesData.length,
        total_study_minutes: totalMins,
        badges: [],
        books_borrowed: issuesRes.data?.length || 0,
      });
    } else {
      setStudentData(null);
      setEntries([]);
    }
    setSearching(false);
  };

  const handleFeedback = async () => {
    if (!libraryId || !studentData) return;
    setFbSubmitting(true);
    const { error } = await (supabase as any).from('library_feedback').insert({
      library_id: libraryId,
      student_name: studentData.name,
      student_id: query.trim(),
      rating: fbRating,
      category: fbCategory,
      message: fbMessage.trim(),
    });
    setFbSubmitting(false);
    if (error) toast.error('Failed to submit feedback');
    else { toast.success('Feedback submitted! / फीडबैक जमा!'); setFbMessage(''); setFbRating(5); }
  };

  const handleSuggestion = async () => {
    if (!libraryId || !studentData || !sugTitle.trim()) return;
    setSugSubmitting(true);
    const { error } = await (supabase as any).from('book_suggestions').insert({
      library_id: libraryId,
      suggested_by_name: studentData.name,
      suggested_by_id: query.trim(),
      title: sugTitle.trim(),
      author: sugAuthor.trim(),
      reason: sugReason.trim(),
    });
    setSugSubmitting(false);
    if (error) toast.error('Failed to submit suggestion');
    else { toast.success('Book suggestion submitted! / किताब का सुझाव जमा!'); setSugTitle(''); setSugAuthor(''); setSugReason(''); }
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

  const totalStudyMins = entries.reduce((s, e) => s + (e.study_minutes || 0), 0);
  const hrs = Math.floor(totalStudyMins / 60);
  const mins = totalStudyMins % 60;

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
            <CardDescription>{libraryName} - {collegeName}</CardDescription>
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

            {/* Tab Navigation */}
            <div className="flex gap-2 justify-center">
              {[
                { key: 'overview', label: '📊 Overview', icon: TrendingUp },
                { key: 'feedback', label: '💬 Feedback', icon: MessageSquare },
                { key: 'suggest', label: '📚 Suggest Book', icon: Sparkles },
              ].map(t => (
                <Button key={t.key} size="sm" variant={tab === t.key ? 'default' : 'outline'}
                  className={tab === t.key ? 'gradient-primary text-primary-foreground' : ''}
                  onClick={() => setTab(t.key as any)}>
                  {t.label}
                </Button>
              ))}
            </div>

            {tab === 'overview' && (
              <>
                {/* Badges */}
                {points?.badges && points.badges.length > 0 && (
                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500" /> Badges</CardTitle>
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

                {/* Books */}
                {bookIssues.length > 0 && (
                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Books</CardTitle>
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
                    <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Recent Visits</CardTitle>
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
                        ) : !e.exit_time ? (
                          <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>
                        ) : null}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}

            {tab === 'feedback' && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Library Feedback / फीडबैक</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Rating / रेटिंग</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(r => (
                        <button key={r} onClick={() => setFbRating(r)} className="p-1">
                          <Star className={`h-7 w-7 transition-colors ${r <= fbRating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Category / श्रेणी</Label>
                    <Select value={fbCategory} onValueChange={setFbCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General / सामान्य</SelectItem>
                        <SelectItem value="seating">Seating / बैठक</SelectItem>
                        <SelectItem value="books">Books / किताबें</SelectItem>
                        <SelectItem value="cleanliness">Cleanliness / स्वच्छता</SelectItem>
                        <SelectItem value="staff">Staff / कर्मचारी</SelectItem>
                        <SelectItem value="facilities">Facilities / सुविधाएं</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Message / संदेश</Label>
                    <Textarea value={fbMessage} onChange={e => setFbMessage(e.target.value)} placeholder="Share your experience..." rows={3} />
                  </div>
                  <Button onClick={handleFeedback} disabled={fbSubmitting} className="w-full gradient-primary text-primary-foreground">
                    {fbSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Feedback / फीडबैक जमा करें'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {tab === 'suggest' && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4" /> Suggest a Book / किताब सुझाएं</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Book Title / किताब का नाम *</Label>
                    <Input value={sugTitle} onChange={e => setSugTitle(e.target.value)} placeholder="e.g. Clean Code" />
                  </div>
                  <div className="space-y-2">
                    <Label>Author / लेखक</Label>
                    <Input value={sugAuthor} onChange={e => setSugAuthor(e.target.value)} placeholder="e.g. Robert C. Martin" />
                  </div>
                  <div className="space-y-2">
                    <Label>Reason / कारण</Label>
                    <Textarea value={sugReason} onChange={e => setSugReason(e.target.value)} placeholder="Why should this book be added?" rows={2} />
                  </div>
                  <Button onClick={handleSuggestion} disabled={sugSubmitting || !sugTitle.trim()} className="w-full gradient-primary text-primary-foreground">
                    {sugSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Suggestion / सुझाव जमा करें'}
                  </Button>
                </CardContent>
              </Card>
            )}
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

        <div className="text-center text-[10px] text-muted-foreground pb-4">
          © {new Date().getFullYear()} S_Amir786. All rights reserved.
        </div>
      </div>
    </div>
  );
}
