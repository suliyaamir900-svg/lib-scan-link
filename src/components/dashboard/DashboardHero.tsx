import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Sun, Moon, Sunrise, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Props {
  libraryName?: string;
  collegeName?: string;
  adminName?: string;
  onRefresh: () => void;
  lastRefresh: Date;
}

function getGreeting(hour: number) {
  if (hour < 5) return { text: 'Good night', hi: 'शुभ रात्रि', icon: Moon };
  if (hour < 12) return { text: 'Good morning', hi: 'सुप्रभात', icon: Sunrise };
  if (hour < 17) return { text: 'Good afternoon', hi: 'नमस्कार', icon: Sun };
  if (hour < 21) return { text: 'Good evening', hi: 'शुभ संध्या', icon: Sun };
  return { text: 'Good night', hi: 'शुभ रात्रि', icon: Moon };
}

export default function DashboardHero({ libraryName, collegeName, adminName, onRefresh, lastRefresh }: Props) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const greeting = getGreeting(now.getHours());
  const Icon = greeting.icon;
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl mb-6 border border-border/50 shadow-card"
    >
      {/* Ambient background */}
      <div className="absolute inset-0 gradient-primary opacity-95" />
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl animate-float" />
      <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />

      <div className="relative p-5 sm:p-6 text-primary-foreground">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Greeting */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center">
                <Icon className="h-4 w-4" />
              </div>
              <Badge className="bg-white/15 hover:bg-white/20 text-white border-white/20 text-[10px] gap-1 backdrop-blur-md">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-300" />
                </span>
                Live · Real-time
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
              {greeting.text}{adminName ? `, ${adminName.split(' ')[0]}` : ''} 👋
            </h1>
            <p className="text-sm text-white/80 mt-1 truncate">
              {greeting.hi} · {libraryName || 'Library'}{collegeName ? ` · ${collegeName}` : ''}
            </p>
          </div>

          {/* Right: Live clock */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums leading-none">
                {timeStr}
              </div>
              <p className="text-[11px] text-white/75 mt-1">{dateStr}</p>
            </div>
            <div className="h-12 w-px bg-white/20" />
            <div className="flex flex-col gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={onRefresh}
                className="gap-1.5 h-8 text-xs bg-white/15 hover:bg-white/25 text-white border-white/20 backdrop-blur-md"
              >
                <RefreshCw className="h-3 w-3" /> Refresh
              </Button>
              <p className="text-[9px] text-white/60 text-center">
                Synced {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
