import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Building2, Landmark, Library, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const TYPES = [
  { value: 'college', label: 'College Library', labelHi: 'कॉलेज लाइब्रेरी', icon: Building2, desc: 'Full student & teacher profile management, departments, semesters' },
  { value: 'government', label: 'Government Library', labelHi: 'सरकारी लाइब्रेरी', icon: Landmark, desc: 'Public access, visitor logs, digital resources' },
  { value: 'private', label: 'Private Library', labelHi: 'निजी लाइब्रेरी', icon: Library, desc: 'Simplified management, membership tracking' },
];

export default function LibraryTypeSetup({ libraryId, onDone }: { libraryId: string; onDone: (type: string) => void }) {
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selected) { toast.error('Please select a library type'); return; }
    setSaving(true);
    const { error } = await (supabase as any).from('libraries').update({ library_type: selected }).eq('id', libraryId);
    setSaving(false);
    if (error) toast.error('Failed to save');
    else { toast.success('Library type set!'); onDone(selected); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-lg shadow-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="h-14 w-14 rounded-xl gradient-primary flex items-center justify-center">
              <BookOpen className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-xl">Select Library Type / लाइब्रेरी प्रकार चुनें</CardTitle>
          <CardDescription>Choose the type of library you are managing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {TYPES.map(t => (
            <button key={t.value} onClick={() => setSelected(t.value)}
              className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left ${selected === t.value ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/50'}`}>
              <t.icon className={`h-8 w-8 shrink-0 ${selected === t.value ? 'text-primary' : 'text-muted-foreground'}`} />
              <div>
                <p className="font-semibold text-sm">{t.label} / {t.labelHi}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
            </button>
          ))}
          <Button onClick={handleSave} disabled={!selected || saving} className="w-full gradient-primary text-primary-foreground h-11">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue / आगे बढ़ें'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
