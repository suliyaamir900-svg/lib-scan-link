import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Users, CalendarDays, CalendarRange, CalendarClock } from 'lucide-react';

export default function Dashboard() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">{t('common.loading')}</div>;
  if (!user) return <Navigate to="/login" />;

  const stats = [
    { label: t('dashboard.total_students'), value: '0', icon: Users, gradient: 'gradient-primary' },
    { label: t('dashboard.today_entries'), value: '0', icon: CalendarDays, gradient: 'gradient-accent' },
    { label: t('dashboard.weekly_entries'), value: '0', icon: CalendarRange, gradient: 'gradient-warm' },
    { label: t('dashboard.monthly_entries'), value: '0', icon: CalendarClock, gradient: 'gradient-success' },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">{t('dashboard.title')}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <Card key={i} className="shadow-card border-border/50 overflow-hidden">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl ${s.gradient} flex items-center justify-center shrink-0`}>
                <s.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="shadow-card border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          Charts and recent entries will appear here after database setup.
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
