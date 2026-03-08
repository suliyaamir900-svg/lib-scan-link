import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';

export default function QRCodePage() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">{t('nav.qr_code')}</h1>
      <Card className="shadow-card">
        <CardContent className="p-6 text-center text-muted-foreground">
          QR code management will appear here after database setup.
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
