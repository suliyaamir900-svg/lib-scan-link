import { RefObject, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface Props {
  canvasRef: RefObject<HTMLCanvasElement>;
  onClear: () => void;
}

export default function SignatureCanvas({ canvasRef, onClear }: Props) {
  const { t } = useLanguage();
  const [drawing, setDrawing] = useState(false);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => setDrawing(false);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{t('entry.signature')} *</Label>
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>{t('entry.clear_signature')}</Button>
      </div>
      <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="w-full cursor-crosshair touch-none"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        <p className="text-xs text-muted-foreground text-center py-1 bg-muted/30">{t('entry.sign_here')}</p>
      </div>
    </div>
  );
}
