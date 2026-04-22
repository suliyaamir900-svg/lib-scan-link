import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface Props {
  entries: any[];
}

export default function PeakHoursChart({ entries }: Props) {
  // Group entries by hour of day (0-23)
  const hourBuckets = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
  entries.forEach(e => {
    if (!e.entry_time) return;
    const hour = parseInt(e.entry_time.split(':')[0]);
    if (!isNaN(hour) && hour >= 0 && hour < 24) {
      hourBuckets[hour].count++;
    }
  });

  // Trim to active hours (6 AM to 11 PM typically)
  const visible = hourBuckets.slice(6, 23).map(b => ({
    name: `${b.hour > 12 ? b.hour - 12 : b.hour || 12}${b.hour >= 12 ? 'p' : 'a'}`,
    visits: b.count,
  }));

  const peak = hourBuckets.reduce((max, b) => b.count > max.count ? b : max, hourBuckets[0]);
  const peakLabel = peak.count > 0 ? `${peak.hour > 12 ? peak.hour - 12 : peak.hour || 12}:00 ${peak.hour >= 12 ? 'PM' : 'AM'}` : '—';

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Peak Hours / व्यस्त समय
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            Peak: <span className="text-primary font-semibold">{peakLabel}</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={visible}>
            <defs>
              <linearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" fontSize={10} />
            <YAxis fontSize={10} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
            />
            <Area type="monotone" dataKey="visits" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#peakGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
