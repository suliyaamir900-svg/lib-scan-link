import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageToggle() {
  const { toggleLang, t } = useLanguage();

  return (
    <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-2">
      <Globe className="h-4 w-4" />
      {t('common.language')}
    </Button>
  );
}
