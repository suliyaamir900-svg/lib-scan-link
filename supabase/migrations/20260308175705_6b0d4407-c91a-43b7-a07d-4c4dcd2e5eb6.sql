
-- Add borrower_phone to book_issues for fine notifications
ALTER TABLE public.book_issues ADD COLUMN IF NOT EXISTS borrower_phone text DEFAULT '';

-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'general',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ann_select" ON public.announcements FOR SELECT USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));
CREATE POLICY "ann_insert" ON public.announcements FOR INSERT WITH CHECK (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));
CREATE POLICY "ann_update" ON public.announcements FOR UPDATE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));
CREATE POLICY "ann_delete" ON public.announcements FOR DELETE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

-- Create visitor_logs table
CREATE TABLE IF NOT EXISTS public.visitor_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  purpose text NOT NULL DEFAULT '',
  entry_time timestamptz NOT NULL DEFAULT now(),
  exit_time timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "visitor_select" ON public.visitor_logs FOR SELECT USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));
CREATE POLICY "visitor_insert" ON public.visitor_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "visitor_update" ON public.visitor_logs FOR UPDATE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));
CREATE POLICY "visitor_delete" ON public.visitor_logs FOR DELETE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
