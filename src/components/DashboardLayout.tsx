import { ReactNode, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, QrCode, FileText, Settings, LogOut, BookOpen, Menu, X, Shield, Briefcase, Library, BookCopy, Armchair, Search, Trophy, Bell, Megaphone, IndianRupee, UserPlus, DoorOpen, CalendarDays, FileDown, Award, Sparkles, BarChart3
} from 'lucide-react';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const { signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/students', icon: Users, label: t('nav.students') },
    { to: '/teachers', icon: Briefcase, label: 'Teachers / शिक्षक' },
    { to: '/books', icon: Library, label: 'Books / किताबें' },
    { to: '/book-issues', icon: BookCopy, label: 'Issue/Return' },
    { to: '/fines', icon: IndianRupee, label: 'Fines / जुर्माना' },
    { to: '/seats', icon: Armchair, label: 'Seats / सीटें' },
    { to: '/seat-heatmap', icon: BarChart3, label: 'Seat Heatmap' },
    { to: '/visitors', icon: UserPlus, label: 'Visitors / आगंतुक' },
    { to: '/study-rooms', icon: DoorOpen, label: 'Study Rooms / कक्ष' },
    { to: '/events', icon: CalendarDays, label: 'Events / इवेंट्स' },
    { to: '/recommendations', icon: Sparkles, label: 'AI Suggestions' },
    { to: '/gamification', icon: Award, label: 'Gamification / गेम' },
    { to: '/search', icon: Search, label: 'Search / खोज' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/announcements', icon: Megaphone, label: 'Announcements' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/qr-code', icon: QrCode, label: t('nav.qr_code') },
    { to: '/reports', icon: FileText, label: t('nav.reports') },
    { to: '/settings', icon: Settings, label: t('nav.settings') },
    { to: '/super-admin', icon: Shield, label: t('nav.super_admin') },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200
        lg:translate-x-0 lg:static lg:z-auto flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center gap-2 h-16 px-4 border-b shrink-0">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm">{t('app.name')}</span>
          <Button variant="ghost" size="icon" className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="p-3 space-y-0.5 overflow-y-auto flex-1">
          {navItems.map(item => (
            <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}>
              <div className={`
                flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${isActive(item.to) ? 'gradient-primary text-primary-foreground shadow-primary' : 'text-muted-foreground hover:bg-muted'}
              `}>
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t shrink-0">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={signOut}>
            <LogOut className="h-4 w-4" /> {t('auth.logout')}
          </Button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-14 border-b flex items-center justify-between px-4 bg-card shrink-0">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <LanguageToggle />
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
