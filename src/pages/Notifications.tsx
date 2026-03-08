import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Loader2, Check, Trash2, BookOpen, AlertTriangle, Clock, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

const ICON_MAP: Record<string, any> = {
  overdue: AlertTriangle,
  reservation: BookOpen,
  reminder: Clock,
  entry: UserCheck,
};

const COLOR_MAP: Record<string, string> = {
  overdue: 'bg-destructive/10 text-destructive',
  reservation: 'bg-primary/10 text-primary',
  reminder: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30',
  entry: 'bg-green-100 text-green-600 dark:bg-green-900/30',
};

export default function Notifications() {
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lib } = await supabase.from('libraries').select('*').eq('user_id', user.id).maybeSingle();
      setLibrary(lib);
      if (lib) {
        const { data } = await supabase.from('notifications').select('*').eq('library_id', lib.id).order('created_at', { ascending: false }).limit(100);
        setNotifications(data || []);
      }
      setLoading(false);
    };
    fetchData();

    // Realtime
    const channel = supabase
      .channel('notif-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        setNotifications(prev => [payload.new as any, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!library) return;
    await supabase.from('notifications').update({ is_read: true }).eq('library_id', library.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success('All marked as read / सभी पढ़ लिया');
  };

  const deleteNotif = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" /> Notifications / सूचनाएं
          {unreadCount > 0 && <span className="text-sm bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">{unreadCount}</span>}
        </h1>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={markAllRead} className="gap-1">
            <Check className="h-4 w-4" /> Mark All Read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : notifications.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold">No notifications / कोई सूचना नहीं</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const Icon = ICON_MAP[n.type] || Bell;
            const color = COLOR_MAP[n.type] || 'bg-muted text-muted-foreground';
            return (
              <Card key={n.id} className={`shadow-card transition-all ${!n.is_read ? 'border-primary/30 bg-primary/5' : ''}`}>
                <CardContent className="p-3 flex items-start gap-3">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.is_read ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                    {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.is_read && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markRead(n.id)}>
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteNotif(n.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
