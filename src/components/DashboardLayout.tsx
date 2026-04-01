import { ReactNode, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  LayoutDashboard, Users, QrCode, FileText, Settings, LogOut, BookOpen, Menu, X, Briefcase, Library, BookCopy, Search, IndianRupee
} from 'lucide-react';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/students', icon: Users, label: t('nav.students') },
    { to: '/teachers', icon: Briefcase, label: 'Teachers / शिक्षक' },
    { to: '/books', icon: Library, label: 'Books / किताबें' },
    { to: '/book-issues', icon: BookCopy, label: 'Issue/Return' },
    { to: '/fines', icon: IndianRupee, label: 'Fines / जुर्माना' },
    { to: '/search', icon: Search, label: 'Search / खोज' },
    { to: '/qr-code', icon: QrCode, label: t('nav.qr_code') },
    { to: '/reports', icon: FileText, label: t('nav.reports') },
    { to: '/settings', icon: Settings, label: t('nav.settings') },
  ];

  const isActive = (path: string) => location.pathname === path;
  const userInitial = user?.email?.[0]?.toUpperCase() || 'L';

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[260px] bg-card/95 backdrop-blur-xl border-r transform transition-all duration-300 ease-out
        lg:translate-x-0 lg:static lg:z-auto flex flex-col
        ${sidebarOpen ? 'translate-x-0 shadow-elevated' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 h-16 px-5 border-b shrink-0">
          <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-primary animate-glow">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-bold text-sm block truncate">{t('app.name')}</span>
            <span className="text-[10px] text-muted-foreground">Library System</span>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto flex-1">
          {navItems.map(item => (
            <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}>
              <div className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative
                ${isActive(item.to) 
                  ? 'gradient-primary text-primary-foreground shadow-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}
              `}>
                <item.icon className={`h-[18px] w-[18px] transition-transform duration-200 ${!isActive(item.to) ? 'group-hover:scale-110' : ''}`} />
                <span className="truncate">{item.label}</span>
                {isActive(item.to) && (
                  <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-primary-foreground/80 animate-pulse" />
                )}
              </div>
            </Link>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t shrink-0 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/50">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{userInitial}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.email}</p>
              <p className="text-[10px] text-muted-foreground">Librarian</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl" onClick={signOut}>
            <LogOut className="h-4 w-4" /> {t('auth.logout')}
          </Button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-14 border-b flex items-center justify-between px-4 bg-card/80 backdrop-blur-md shrink-0">
          <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" onClick={() => setSidebarOpen(true)}>
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
