import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard, Users, Briefcase, Library, BookCopy, Search, IndianRupee,
  QrCode, FileText, Settings, LogOut, Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, actions... / पेज खोजें..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation / नेविगेशन">
          <CommandItem onSelect={() => go('/dashboard')}><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</CommandItem>
          <CommandItem onSelect={() => go('/students')}><Users className="mr-2 h-4 w-4" />Students</CommandItem>
          <CommandItem onSelect={() => go('/teachers')}><Briefcase className="mr-2 h-4 w-4" />Teachers</CommandItem>
          <CommandItem onSelect={() => go('/books')}><Library className="mr-2 h-4 w-4" />Books</CommandItem>
          <CommandItem onSelect={() => go('/book-issues')}><BookCopy className="mr-2 h-4 w-4" />Issue / Return</CommandItem>
          <CommandItem onSelect={() => go('/fines')}><IndianRupee className="mr-2 h-4 w-4" />Fines</CommandItem>
          <CommandItem onSelect={() => go('/search')}><Search className="mr-2 h-4 w-4" />Smart Search</CommandItem>
          <CommandItem onSelect={() => go('/qr-code')}><QrCode className="mr-2 h-4 w-4" />QR Code</CommandItem>
          <CommandItem onSelect={() => go('/reports')}><FileText className="mr-2 h-4 w-4" />Reports</CommandItem>
          <CommandItem onSelect={() => go('/settings')}><Settings className="mr-2 h-4 w-4" />Settings</CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions / त्वरित क्रियाएँ">
          <CommandItem onSelect={() => go('/students')}>
            <Sparkles className="mr-2 h-4 w-4" />Add new student
          </CommandItem>
          <CommandItem onSelect={() => go('/books')}>
            <Sparkles className="mr-2 h-4 w-4" />Add new book
          </CommandItem>
          <CommandItem onSelect={() => go('/book-issues')}>
            <Sparkles className="mr-2 h-4 w-4" />Issue a book
          </CommandItem>
          <CommandItem onSelect={() => { setOpen(false); signOut(); }}>
            <LogOut className="mr-2 h-4 w-4" />Sign out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
