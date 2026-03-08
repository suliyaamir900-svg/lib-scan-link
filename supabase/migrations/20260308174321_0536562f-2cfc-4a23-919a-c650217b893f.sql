
-- Add exit_time and seat_id to student_entries
ALTER TABLE public.student_entries ADD COLUMN IF NOT EXISTS exit_time time without time zone;
ALTER TABLE public.student_entries ADD COLUMN IF NOT EXISTS seat_id uuid;
ALTER TABLE public.student_entries ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'student';
ALTER TABLE public.student_entries ADD COLUMN IF NOT EXISTS employee_id text;
ALTER TABLE public.student_entries ADD COLUMN IF NOT EXISTS enrollment_number text;

-- Library seats table
CREATE TABLE IF NOT EXISTS public.library_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  seat_number text NOT NULL,
  section text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(library_id, seat_number)
);
ALTER TABLE public.library_seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seats_select" ON public.library_seats FOR SELECT USING (true);
CREATE POLICY "seats_insert" ON public.library_seats FOR INSERT TO authenticated
  WITH CHECK (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
CREATE POLICY "seats_update" ON public.library_seats FOR UPDATE TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()))
  WITH CHECK (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
CREATE POLICY "seats_delete" ON public.library_seats FOR DELETE TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));

-- Book reservations table
CREATE TABLE IF NOT EXISTS public.book_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  reserved_by_name text NOT NULL,
  reserved_by_id text NOT NULL,
  reserved_by_type text DEFAULT 'student',
  status text DEFAULT 'waiting',
  queue_position integer DEFAULT 1,
  reserved_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.book_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reservations_select" ON public.book_reservations FOR SELECT TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
CREATE POLICY "reservations_insert" ON public.book_reservations FOR INSERT TO authenticated
  WITH CHECK (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
CREATE POLICY "reservations_update" ON public.book_reservations FOR UPDATE TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()))
  WITH CHECK (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
CREATE POLICY "reservations_delete" ON public.book_reservations FOR DELETE TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text DEFAULT '',
  related_id text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_select" ON public.notifications FOR SELECT TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
CREATE POLICY "notif_insert" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
CREATE POLICY "notif_update" ON public.notifications FOR UPDATE TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
CREATE POLICY "notif_delete" ON public.notifications FOR DELETE TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));

-- Library settings table
CREATE TABLE IF NOT EXISTS public.library_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE UNIQUE,
  total_seats integer DEFAULT 0,
  max_capacity integer DEFAULT 100,
  default_issue_days integer DEFAULT 14,
  default_fine_per_day numeric DEFAULT 5,
  allow_reservations boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.library_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_select" ON public.library_settings FOR SELECT TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
CREATE POLICY "settings_insert" ON public.library_settings FOR INSERT TO authenticated
  WITH CHECK (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
CREATE POLICY "settings_update" ON public.library_settings FOR UPDATE TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()))
  WITH CHECK (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));

-- Add lost/damaged status to books
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS status text DEFAULT 'available';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS last_borrower_name text;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS last_borrower_id text;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS lost_date date;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS replacement_fine numeric DEFAULT 0;

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.library_seats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.book_reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Allow update on student_entries for exit tracking
DROP POLICY IF EXISTS "Library owners can update entries" ON public.student_entries;
CREATE POLICY "Library owners can update entries" ON public.student_entries FOR UPDATE TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
