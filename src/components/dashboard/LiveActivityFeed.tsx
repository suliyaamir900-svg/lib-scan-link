import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Activity, LogIn, LogOut, BookOpen, BookCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props { libraryId: string }

type FeedItem = {
  id: string;
  type: 'entry' | 'exit' | 'issue' | 'return';
  title: string;
  subtitle: string;
  ts: number; // epoch ms
};

function relativeTime(ts: number, now: number): string {
  const diff = Math.max(0, Math.floor((now - ts) / 1000));
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ICONS = {
  entry: { icon: LogIn, color: 'text-green-600', bg: 'bg-green-500/10', label: 'Entry' },
  exit: { icon: LogOut, color: 'text-orange-600', bg: 'bg-orange-500/10', label: 'Exit' },
  issue: { icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10', label: 'Book Issued' },
  return: { icon: BookCheck, color: 'text-secondary', bg: 'bg-secondary/10', label: 'Book Returned' },
} as const;

export default function LiveActivityFeed({ libraryId }: Props) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!libraryId) return;
    let mounted = true;

    const load = async () => {
      const today = new Date().toISOString().split('T')[0];
      const [entRes, issRes] = await Promise.all([
        supabase.from('student_entries')
          .select('id, student_name, department, entry_time, exit_time, entry_date, created_at')
          .eq('library_id', libraryId)
          .eq('entry_date', today)
          .order('created_at', { ascending: false })
          .limit(15),
        supabase.from('book_issues')
          .select('id, borrower_name, status, issue_date, actual_return_date, created_at, updated_at')
          .eq('library_id', libraryId)
          .order('updated_at', { ascending: false })
          .limit(15),
      ]);

      const feed: FeedItem[] = [];
      (entRes.data || []).forEach((e: any) => {
        feed.push({
          id: `entry-${e.id}`,
          type: 'entry',
          title: e.student_name,
          subtitle: e.department,
          ts: new Date(e.created_at).getTime(),
        });
        if (e.exit_time) {
          const [h, m] = e.exit_time.split(':').map(Number);
          const d = new Date(e.entry_date);
          d.setHours(h, m, 0, 0);
          feed.push({
            id: `exit-${e.id}`,
            type: 'exit',
            title: e.student_name,
            subtitle: e.department,
            ts: d.getTime(),
          });
        }
      });
      (issRes.data || []).forEach((i: any) => {
        const isReturn = i.status === 'returned' && i.actual_return_date;
        feed.push({
          id: `${isReturn ? 'return' : 'issue'}-${i.id}`,
          type: isReturn ? 'return' : 'issue',
          title: i.borrower_name,
          subtitle: isReturn ? 'returned a book' : 'borrowed a book',
          ts: new Date(i.updated_at || i.created_at).getTime(),
        });
      });

      feed.sort((a, b) => b.ts - a.ts);
      if (mounted) setItems(feed.slice(0, 25));
    };

    load();

    const channel = supabase
      .channel(`live-feed-${libraryId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_entries', filter: `library_id=eq.${libraryId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'book_issues', filter: `library_id=eq.${libraryId}` }, () => load())
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [libraryId]);

  return (
    <Card className="shadow-card border-border/50 overflow-hidden">
      <CardHeader className="pb-3 border-b bg-gradient-to-r from-primary/5 to-accent/5">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
            <Activity className="h-4 w-4 text-primary" />
            Live Activity / लाइव गतिविधि
          </span>
          <Badge variant="outline" className="text-[10px] gap-1">
            <Sparkles className="h-3 w-3 text-primary" /> {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[280px]">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 text-sm">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No activity yet today
            </div>
          ) : (
            <div className="divide-y">
              <AnimatePresence initial={false}>
                {items.map((item) => {
                  const cfg = ICONS[item.type];
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className={`h-8 w-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold truncate">{item.title}</p>
                          <Badge variant="secondary" className="text-[9px] py-0 px-1.5 h-4 shrink-0">{cfg.label}</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                        {relativeTime(item.ts, now)}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
