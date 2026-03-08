import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, Loader2, Armchair } from 'lucide-react';

const HOUR_LABELS = Array.from({ length: 15 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);

export default function SeatHeatmap() {
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [seats, setSeats] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        const [seatRes, entryRes] = await Promise.all([
          supabase.from('library_seats').select('*').eq('library_id', lib.id).order('seat_number'),
          supabase.from('student_entries').select('seat_id, entry_time, exit_time, entry_date').eq('library_id', lib.id),
        ]);
        setSeats(seatRes.data || []);
        setEntries(entryRes.data || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Calculate seat usage counts
  const seatUsage = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach(e => {
      if (e.seat_id) map[e.seat_id] = (map[e.seat_id] || 0) + 1;
    });
    return map;
  }, [entries]);

  // Calculate hourly distribution
  const hourlyData = useMemo(() => {
    const hours: Record<string, number> = {};
    HOUR_LABELS.forEach(h => { hours[h] = 0; });
    entries.forEach(e => {
      if (e.entry_time) {
        const hour = e.entry_time.slice(0, 2);
        const key = `${hour}:00`;
        if (hours[key] !== undefined) hours[key]++;
      }
    });
    return Object.entries(hours).map(([hour, count]) => ({ hour, count }));
  }, [entries]);

  const maxUsage = Math.max(...Object.values(seatUsage), 1);
  const maxHourly = Math.max(...hourlyData.map(h => h.count), 1);

  const getHeatColor = (count: number, max: number) => {
    const ratio = count / max;
    if (ratio === 0) return 'bg-muted';
    if (ratio < 0.25) return 'bg-green-200 dark:bg-green-900/40';
    if (ratio < 0.5) return 'bg-yellow-200 dark:bg-yellow-900/40';
    if (ratio < 0.75) return 'bg-orange-300 dark:bg-orange-900/40';
    return 'bg-red-400 dark:bg-red-900/60';
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-primary" /> Seat Heatmap / सीट हीटमैप
      </h1>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* Seat Usage Heatmap */}
          <Card className="shadow-card mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Armchair className="h-5 w-5 text-primary" /> Seat Usage / सीट उपयोग
              </CardTitle>
            </CardHeader>
            <CardContent>
              {seats.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No seats defined. Add seats in Seat Management.</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {seats.map(seat => {
                      const count = seatUsage[seat.id] || 0;
                      return (
                        <div
                          key={seat.id}
                          className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all ${getHeatColor(count, maxUsage)}`}
                          title={`${seat.seat_number}: ${count} uses`}
                        >
                          <span className="font-bold">{seat.seat_number}</span>
                          <span className="text-[10px] opacity-70">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Low</span>
                    <div className="flex gap-1">
                      <div className="w-6 h-3 rounded bg-muted" />
                      <div className="w-6 h-3 rounded bg-green-200 dark:bg-green-900/40" />
                      <div className="w-6 h-3 rounded bg-yellow-200 dark:bg-yellow-900/40" />
                      <div className="w-6 h-3 rounded bg-orange-300 dark:bg-orange-900/40" />
                      <div className="w-6 h-3 rounded bg-red-400 dark:bg-red-900/60" />
                    </div>
                    <span>High</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Peak Hours */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Peak Hours / व्यस्त समय</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {hourlyData.map(h => (
                  <div key={h.hour} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-12 shrink-0">{h.hour}</span>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getHeatColor(h.count, maxHourly)}`}
                        style={{ width: `${Math.max(2, (h.count / maxHourly) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-8 text-right">{h.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
