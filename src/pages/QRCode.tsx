import { useEffect, useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, Share2, Printer, QrCode, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function QRCodePage() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchLibrary = async () => {
      const { data } = await supabase
        .from('libraries')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setLibrary(data);
      setLoading(false);
    };
    fetchLibrary();
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;

  const entryUrl = library ? `${window.location.origin}/entry/${library.id}` : '';
  const portalUrl = library ? `${window.location.origin}/portal/${library.id}` : '';

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(entryUrl);
    setCopied(true);
    toast.success('Link copied! / लिंक कॉपी हो गया!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPNG = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);
      const link = document.createElement('a');
      link.download = `${library?.name || 'library'}-qr-code.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleDownloadSVG = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = `${library?.name || 'library'}-qr-code.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  const handlePrint = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>QR Code - ${library?.name}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;margin:0}
      h1{font-size:24px;margin-bottom:8px}p{color:#666;margin-bottom:24px}
      .url{font-size:12px;color:#999;margin-top:16px;word-break:break-all;max-width:400px;text-align:center}</style></head>
      <body><h1>${library?.name || 'Library'}</h1><p>${library?.college_name || ''}</p>
      ${svgData}<p class="url">${entryUrl}</p>
      <script>setTimeout(()=>window.print(),300)</script></body></html>
    `);
    printWindow.document.close();
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: `${library?.name} - Entry QR`, url: entryUrl });
    } else {
      handleCopyLink();
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">{t('nav.qr_code')}</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !library ? (
        <Card className="shadow-card">
          <CardContent className="p-6 text-center text-muted-foreground">
            No library found. / कोई लाइब्रेरी नहीं मिली।
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Display */}
          <Card className="shadow-card">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                {library.name}
              </CardTitle>
              <CardDescription>{library.college_name}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <div ref={qrRef} className="p-6 bg-white rounded-2xl shadow-card">
                <QRCodeSVG
                  value={entryUrl}
                  size={240}
                  level="H"
                  includeMargin={false}
                  fgColor="#1a1a2e"
                  bgColor="#ffffff"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center max-w-xs break-all">
                {entryUrl}
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Share Link / लिंक शेयर करें</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input value={entryUrl} readOnly className="text-xs" />
                  <Button onClick={handleCopyLink} variant="outline" size="icon" className="shrink-0">
                    {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <Button onClick={handleShare} className="w-full gradient-primary text-primary-foreground" size="sm">
                  <Share2 className="h-4 w-4 mr-2" /> Share / शेयर करें
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Download / डाउनलोड</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button onClick={handleDownloadPNG} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" /> PNG
                </Button>
                <Button onClick={handleDownloadSVG} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" /> SVG
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Print Poster / पोस्टर प्रिंट करें</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handlePrint} variant="outline" className="w-full gap-2">
                  <Printer className="h-4 w-4" /> Print QR Poster / QR पोस्टर प्रिंट करें
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
