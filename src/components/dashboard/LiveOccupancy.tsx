import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Activity, Clock, GraduationCap, Briefcase } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  libraryId: string;
}

interface ActiveEntry {
  id: string;
  student_name: string;
  user_type: string | null;
  department: string;
  entry_time: string;
  roll_number: string;
}

function calcDuration(entryTime: string): string {
  const [h, m, s] = entryTime.split(':').map(Number);
  const entrySec = h * 3600 + m * 60 + (s || 0);
  const now = new Date();
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const diffMin = Math.max(0, Math.floor((nowSec - entrySec) / 60));
  if (diffMin < 60) return `${diffMin}m`;
  return `${Math.floor(diffMin / 60)}h ${diffMin % 60}m`;
}

export default function LiveOccupancy({ libraryId }: Props) {
  const [active, setActive] = useState<ActiveEntry[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!libraryId) return;
    const today = new Date().toISOString().split('T')[0];

    const fetchActive = async () => {
      const { data } = await supabase
        .from('student_entries')
        .select('id, student_name, user_type, department, entry_time, roll_number')
        .eq('library_id', libraryId)
        .eq('entry_date', today)
        .is('exit_time', null)
        .order('entry_time', { ascending: false });
      setActive((data as ActiveEntry[]) || []);
    };

    fetchActive();

    const channel = supabase
      .channel(`live-occupancy-${libraryId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_entries', filter: `library_id=eq.${libraryId}` },
        () => fetchActive()
      )
      .subscribe();

    const interval = setInterval(() => setTick(t => t + 1), 30_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [libraryId]);

  // Force re-render with tick to refresh durations
  void tick;

  const students = active.filter(a => (a.user_type ?? 'student') === 'student');
  const teachers = active.filter(a => a.user_type === 'teacher');

  return (
    <Card className="shadow-card border-border/50 overflow-hidden">
      <CardHeader className="pb-3 border-b bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <Activity className="h-4 w-4 text-primary" />
            Currently Inside / अभी अंदर
          </span>
          <div className="flex gap-1.5">
            <Badge variant="outline" className="gap-1 text-[10px]">
              <GraduationCap className="h-3 w-3" /> {students.length}
            </Badge>
            <Badge variant="outline" className="gap-1 text-[10px]">
              <Briefcase className="h-3 w-3" /> {teachers.length}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[280px]">
          {active.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 text-sm">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No one inside right now / कोई अंदर नहीं
            </div>
          ) : (
            <div className="divide-y">
              {active.map(entry => {
                const isTeacher = entry.user_type === 'teacher';
                const initial = entry.student_name?.[0]?.toUpperCase() || '?';
                return (
                  <div key={entry.id} className="flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors">
                    <Avatar className="h-9 w-9 ring-2 ring-primary/15 shrink-0">
                      <AvatarFallback className={`text-xs font-bold ${isTeacher ? 'bg-accent/15 text-accent' : 'bg-primary/15 text-primary'}`}>
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate">{entry.student_name}</p>
                        {isTeacher && <Badge variant="secondary" className="text-[9px] py-0 px-1.5 h-4">Teacher</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {entry.department} · {entry.roll_number}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-primary">
                        <Clock className="h-3 w-3" />
                        {calcDuration(entry.entry_time)}
                      </div>
                      <p className="text-[9px] text-muted-foreground">since {entry.entry_time.slice(0, 5)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
