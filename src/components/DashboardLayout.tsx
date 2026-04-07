import { ReactNode, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard, Users, QrCode, FileText, Settings, LogOut, BookOpen, Menu, X, Briefcase, Library, BookCopy, Search, IndianRupee, Bell, ChevronRight
} from 'lucide-react';

const PAGE_TITLES: Record<string, { en: string; hi: string; icon: any }> = {
  '/dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड', icon: LayoutDashboard },
  '/students': { en: 'Students', hi: 'छात्र', icon: Users },
  '/teachers': { en: 'Teachers', hi: 'शिक्षक', icon: Briefcase },
  '/books': { en: 'Books', hi: 'किताबें', icon: Library },
  '/book-issues': { en: 'Issue / Return', hi: 'जारी / वापसी', icon: BookCopy },
  '/fines': { en: 'Fines', hi: 'जुर्माना', icon: IndianRupee },
  '/search': { en: 'Smart Search', hi: 'स्मार्ट खोज', icon: Search },
  '/qr-code': { en: 'QR Code', hi: 'क्यूआर कोड', icon: QrCode },
  '/reports': { en: 'Reports', hi: 'रिपोर्ट', icon: FileText },
  '/settings': { en: 'Settings', hi: 'सेटिंग्स', icon: Settings },
};

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
  const currentPage = PAGE_TITLES[location.pathname];

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
        <nav className="p-3 space-y-0.5 overflow-y-auto flex-1">
          {navItems.map(item => (
            <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}>
              <div className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative
                ${isActive(item.to)
                  ? 'gradient-primary text-primary-foreground shadow-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:translate-x-0.5'}
              `}>
                <item.icon className={`h-[18px] w-[18px] transition-all duration-200 ${!isActive(item.to) ? 'group-hover:scale-110 group-hover:text-primary' : ''}`} />
                <span className="truncate">{item.label}</span>
                {isActive(item.to) && (
                  <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-primary-foreground/80 animate-pulse" />
                )}
                {!isActive(item.to) && (
                  <ChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
                )}
              </div>
            </Link>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t shrink-0 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors">
            <Avatar className="h-9 w-9 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{userInitial}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{user?.email}</p>
              <p className="text-[10px] text-muted-foreground">Librarian</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all" onClick={signOut}>
            <LogOut className="h-4 w-4" /> {t('auth.logout')}
          </Button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-14 border-b flex items-center justify-between px-4 lg:px-6 bg-card/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            {currentPage && (
              <div className="hidden sm:flex items-center gap-2">
                <currentPage.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">{currentPage.en}</span>
                <span className="text-xs text-muted-foreground hidden md:inline">/ {currentPage.hi}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:flex gap-1 text-[10px] border-green-500/30 text-green-600 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Online
            </Badge>
            <LanguageToggle />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
