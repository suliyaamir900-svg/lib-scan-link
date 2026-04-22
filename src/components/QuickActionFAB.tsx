import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, GraduationCap, BookCopy, DoorOpen, X, QrCode } from 'lucide-react';

const actions = [
  { icon: GraduationCap, label: 'Add Student', href: '/students', color: 'gradient-primary' },
  { icon: BookCopy, label: 'Issue Book', href: '/book-issues', color: 'gradient-accent' },
  { icon: DoorOpen, label: 'Mark Entry', href: '/qr-code', color: 'gradient-warm' },
  { icon: QrCode, label: 'View QR', href: '/qr-code', color: 'gradient-success' },
];

export default function QuickActionFAB() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5">
      {open && actions.map((a, i) => (
        <div
          key={a.label}
          className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2"
          style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'backwards' }}
        >
          <span className="px-3 py-1.5 rounded-lg bg-card shadow-elevated border text-xs font-medium whitespace-nowrap">
            {a.label}
          </span>
          <Button
            size="icon"
            onClick={() => { setOpen(false); navigate(a.href); }}
            className={`h-11 w-11 rounded-full shadow-elevated ${a.color} text-primary-foreground hover:scale-110 transition-transform`}
          >
            <a.icon className="h-5 w-5" />
          </Button>
        </div>
      ))}
      <Button
        size="icon"
        onClick={() => setOpen(o => !o)}
        className={`h-14 w-14 rounded-full shadow-elevated gradient-primary text-primary-foreground hover:scale-105 transition-all ${open ? 'rotate-45' : ''}`}
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </div>
  );
}
