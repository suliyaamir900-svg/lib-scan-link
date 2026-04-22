import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Bell, BookOpen, IndianRupee, DoorOpen, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';

interface Alert {
  id: string;
  type: 'overdue' | 'fine' | 'inside' | 'success';
  title: string;
  desc: string;
  href: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let libraryId: string | null = null;

    const compute = async () => {
      if (!libraryId) {
        const { data: lib } = await supabase.from('libraries').select('id').eq('user_id', user.id).maybeSingle();
        if (!lib) return;
        libraryId = lib.id;
      }
      const today = new Date().toISOString().split('T')[0];
      const [issuesRes, entriesRes] = await Promise.all([
        supabase.from('book_issues').select('id, borrower_name, return_date, status, fine_per_day').eq('library_id', libraryId).eq('status', 'issued'),
        supabase.from('student_entries').select('id, student_name, user_type').eq('library_id', libraryId).eq('entry_date', today).is('exit_time', null),
      ]);

      const issues = issuesRes.data || [];
      const entries = entriesRes.data || [];
      const overdue = issues.filter(i => i.return_date < today);
      const fineTotal = overdue.reduce((s, i) => {
        const days = Math.floor((new Date(today).getTime() - new Date(i.return_date).getTime()) / 86400000);
        return s + days * (i.fine_per_day || 5);
      }, 0);

      const next: Alert[] = [];
      if (overdue.length > 0) {
        next.push({
          id: 'overdue',
          type: 'overdue',
          title: `${overdue.length} overdue book${overdue.length > 1 ? 's' : ''}`,
          desc: overdue.slice(0, 2).map(o => o.borrower_name).join(', ') + (overdue.length > 2 ? '…' : ''),
          href: '/book-issues',
        });
      }
      if (fineTotal > 0) {
        next.push({
          id: 'fine',
          type: 'fine',
          title: `₹${fineTotal} pending fines`,
          desc: 'Click to review and collect',
          href: '/fines',
        });
      }
      if (entries.length > 0) {
        next.push({
          id: 'inside',
          type: 'inside',
          title: `${entries.length} currently inside`,
          desc: entries.slice(0, 2).map(e => e.student_name).join(', ') + (entries.length > 2 ? '…' : ''),
          href: '/dashboard',
        });
      }
      if (next.length === 0) {
        next.push({ id: 'ok', type: 'success', title: 'All caught up!', desc: 'No alerts right now.', href: '/dashboard' });
      }
      setAlerts(next);
    };

    compute();
    const interval = setInterval(compute, 60_000);
    return () => clearInterval(interval);
  }, [user]);

  const actionable = alerts.filter(a => a.type !== 'success').length;

  const iconFor = (t: Alert['type']) => {
    switch (t) {
      case 'overdue': return <BookOpen className="h-4 w-4 text-destructive" />;
      case 'fine': return <IndianRupee className="h-4 w-4 text-orange-500" />;
      case 'inside': return <DoorOpen className="h-4 w-4 text-primary" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {actionable > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/60" />
              <Badge className="relative h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-destructive text-destructive-foreground">
                {actionable}
              </Badge>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Notifications</p>
            <p className="text-[11px] text-muted-foreground">Live alerts • auto-refresh 1 min</p>
          </div>
          {actionable > 0 ? (
            <Badge variant="destructive" className="text-[10px]">{actionable} new</Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] border-green-500 text-green-600">Clear</Badge>
          )}
        </div>
        <ScrollArea className="max-h-[320px]">
          <div className="divide-y">
            {alerts.map(a => (
              <Link
                key={a.id}
                to={a.href}
                onClick={() => setOpen(false)}
                className="flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="mt-0.5 shrink-0 h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                  {iconFor(a.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{a.desc}</p>
                </div>
                {a.type === 'overdue' && <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />}
              </Link>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
