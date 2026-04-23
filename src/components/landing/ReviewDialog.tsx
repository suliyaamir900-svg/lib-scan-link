import { useState } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Send, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getDeviceFingerprint } from '@/lib/fingerprint';

interface Props {
  trigger: React.ReactNode;
  onSubmitted?: () => void;
}

// Strict client-side schema — server enforces the same rules.
const reviewSchema = z.object({
  reviewer_name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name must be under 80 characters')
    .regex(/^[\p{L}\p{M}\s.\-']+$/u, 'Name contains invalid characters'),
  reviewer_role: z
    .string()
    .trim()
    .max(80, 'Role must be under 80 characters')
    .optional()
    .or(z.literal('')),
  rating: z.number().int().min(1).max(5),
  message: z
    .string()
    .trim()
    .min(10, 'Review must be at least 10 characters')
    .max(400, 'Review must be under 400 characters')
    .refine(
      (v) => !/(https?:\/\/|www\.|<script|<\/script|javascript:)/i.test(v),
      { message: 'Links and scripts are not allowed' },
    ),
});

export default function ReviewDialog({ trigger, onSubmitted }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = reviewSchema.safeParse({
      reviewer_name: name,
      reviewer_role: role,
      rating,
      message,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Please check your inputs');
      return;
    }

    setSubmitting(true);
    const fp = getDeviceFingerprint();

    const { error } = await (supabase as any).from('platform_reviews').insert({
      reviewer_name: parsed.data.reviewer_name,
      reviewer_role: parsed.data.reviewer_role || null,
      rating: parsed.data.rating,
      message: parsed.data.message,
      submitter_fingerprint: fp,
    });
    setSubmitting(false);

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('already submitted')) {
        toast.error('You\'ve already submitted a review in the last 24 hours.');
      } else if (msg.includes('similar review')) {
        toast.error('A very similar review was just submitted.');
      } else if (msg.includes('links and scripts')) {
        toast.error('Links and scripts are not allowed in your review.');
      } else if (msg.includes('check constraint')) {
        toast.error('Review does not meet the length requirements.');
      } else {
        toast.error(error.message || 'Failed to submit review');
      }
      return;
    }

    toast.success('🎉 Thank you! Your review is live.');
    setName(''); setRole(''); setMessage(''); setRating(5);
    setOpen(false);
    onSubmitted?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-xl tracking-tight">Share your experience</DialogTitle>
          <DialogDescription>
            Tell us how LibScan is helping your library. Reviews are public.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-2">
          {/* Star rating */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Your rating</Label>
            <div
              className="flex gap-1.5"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((n) => {
                const active = (hoverRating || rating) >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded p-0.5"
                    aria-label={`${n} star`}
                  >
                    <Star className={`h-7 w-7 transition-colors ${active ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`} />
                  </button>
                );
              })}
              <span className="ml-2 self-center text-sm font-semibold text-muted-foreground">
                {hoverRating || rating}.0
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="rev-name" className="text-xs">Name *</Label>
              <Input
                id="rev-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="mt-1"
                required
                minLength={2}
                maxLength={80}
              />
            </div>
            <div>
              <Label htmlFor="rev-role" className="text-xs">Role / College</Label>
              <Input
                id="rev-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Librarian, IIT Bombay"
                className="mt-1"
                maxLength={80}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="rev-msg" className="text-xs">Your review *</Label>
            <Textarea
              id="rev-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you love about LibScan…"
              className="mt-1 min-h-[100px] resize-none"
              required
              minLength={10}
              maxLength={400}
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Spam-protected · Links not allowed
              </p>
              <p className="text-[10px] text-muted-foreground">{message.length}/400</p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full gradient-primary text-primary-foreground shadow-primary h-11 rounded-xl font-semibold gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? 'Submitting…' : 'Submit review'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
