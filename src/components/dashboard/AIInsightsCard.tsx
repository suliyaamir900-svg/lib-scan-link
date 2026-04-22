import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Lightbulb, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Stats {
  studentsInside: number;
  teachersInside: number;
  todayEntries: number;
  weekEntries: number;
  overdueBooks: number;
  totalFines: number;
  inactiveStudents: number;
  issuedBooks: number;
  availableCopies: number;
  topDept?: string;
}

interface Insight {
  summary: string;
  suggestions: string[];
}

export default function AIInsightsCard({ stats }: { stats: Stats }) {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-insights', { body: { stats } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setInsight(data);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-card border-primary/20 overflow-hidden">
      <div className="h-1 gradient-primary" />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Daily Insights / आज की समीक्षा
          </span>
          <Button size="sm" variant="ghost" onClick={generate} disabled={loading} className="h-7 gap-1 text-xs">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            {insight ? 'Refresh' : 'Generate'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!insight && !loading && (
          <div className="text-center py-6 text-xs text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Click <strong>Generate</strong> for an AI-powered summary of today's library activity.
          </div>
        )}
        {loading && (
          <div className="text-center py-6 text-xs text-muted-foreground">
            <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin text-primary" />
            Analyzing today's data…
          </div>
        )}
        {insight && (
          <>
            <p className="text-sm leading-relaxed">{insight.summary}</p>
            {insight.suggestions?.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t">
                <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" /> Suggestions
                </p>
                {insight.suggestions.map((s, i) => (
                  <div key={i} className="text-xs flex items-start gap-2 p-2 rounded-lg bg-primary/5">
                    <span className="text-primary font-bold">{i + 1}.</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
