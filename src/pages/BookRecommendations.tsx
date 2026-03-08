import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Loader2, BookOpen, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function BookRecommendations() {
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [department, setDepartment] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [borrowedBooks, setBorrowedBooks] = useState<string[]>([]);
  const [popularBooks, setPopularBooks] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        // Get popular books
        const { data: books } = await supabase.from('books').select('title').eq('library_id', lib.id).limit(20);
        setPopularBooks((books || []).map(b => b.title));
        // Get recently issued books
        const { data: issues } = await supabase.from('book_issues').select('borrower_department').eq('library_id', lib.id).limit(1);
        if (issues?.[0]?.borrower_department) setDepartment(issues[0].borrower_department);
      }
      setPageLoading(false);
    };
    fetchData();
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const getRecommendations = async () => {
    if (!department.trim()) { toast.error('Enter a department'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('recommend-books', {
        body: { department, borrowed_books: borrowedBooks, popular_books: popularBooks },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        setRecommendations(data?.recommendations || []);
        if ((data?.recommendations || []).length === 0) toast.info('No recommendations generated');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to get recommendations');
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" /> AI Book Recommendations / AI किताब सुझाव
      </h1>

      <Card className="shadow-card mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Department / विभाग</Label>
              <Input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Computer Science, MBA, Pharmacy..." />
            </div>
            <Button onClick={getRecommendations} disabled={loading} className="gradient-primary text-primary-foreground gap-2 h-10">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Get AI Suggestions
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">AI will suggest books based on your department and library's collection</p>
        </CardContent>
      </Card>

      {pageLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : recommendations.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-1">Enter a department and click "Get AI Suggestions"</h3>
            <p className="text-sm text-muted-foreground">AI will analyze your library and suggest relevant books</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((rec, i) => (
            <Card key={i} className="shadow-card border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{rec.title}</h3>
                    <p className="text-xs text-muted-foreground">{rec.author}</p>
                    <p className="text-xs text-primary mt-2 flex items-center gap-1">
                      <Star className="h-3 w-3" /> {rec.reason}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
