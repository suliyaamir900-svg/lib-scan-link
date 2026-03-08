import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  libraryId: string;
  userType: 'student' | 'teacher';
  onDetected: (data: any) => void;
}

export default function RepeatEntryDetector({ libraryId, userType, onDetected }: Props) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);

    if (userType === 'student') {
      // Search from students table
      const { data } = await (supabase as any)
        .from('students')
        .select('*')
        .eq('library_id', libraryId)
        .or(`roll_number.eq.${query.trim()},enrollment_number.eq.${query.trim()}`)
        .maybeSingle();

      if (data) {
        onDetected(data);
      } else {
        // Fallback: search from entries
        const { data: entry } = await supabase
          .from('student_entries')
          .select('*')
          .eq('library_id', libraryId)
          .eq('roll_number', query.trim())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (entry) onDetected(entry);
      }
    } else {
      const { data } = await (supabase as any)
        .from('teachers')
        .select('*')
        .eq('library_id', libraryId)
        .eq('employee_id', query.trim())
        .maybeSingle();

      if (data) onDetected(data);
    }

    setSearching(false);
  };

  return (
    <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
      <Label className="text-xs text-muted-foreground">
        {userType === 'student'
          ? 'Repeat visit? Enter Roll/Enrollment No. / दोबारा आए? रोल/नामांकन नंबर डालें'
          : 'Repeat visit? Enter Employee ID / दोबारा आए? कर्मचारी आईडी डालें'}
      </Label>
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={userType === 'student' ? 'Roll No / Enrollment No' : 'Employee ID'}
          className="h-9 text-sm"
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <Button type="button" variant="outline" size="sm" onClick={handleSearch} disabled={searching} className="h-9 px-3">
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
