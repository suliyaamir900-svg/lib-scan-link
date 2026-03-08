
-- Gamification: student points and badges
CREATE TABLE IF NOT EXISTS public.student_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  student_id text NOT NULL,
  student_name text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  total_points integer NOT NULL DEFAULT 0,
  books_borrowed integer NOT NULL DEFAULT 0,
  library_visits integer NOT NULL DEFAULT 0,
  on_time_returns integer NOT NULL DEFAULT 0,
  total_study_minutes integer NOT NULL DEFAULT 0,
  badges text[] DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(library_id, student_id)
);
ALTER TABLE public.student_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sp_select" ON public.student_points FOR SELECT USING (true);
CREATE POLICY "sp_insert" ON public.student_points FOR INSERT WITH CHECK (true);
CREATE POLICY "sp_update" ON public.student_points FOR UPDATE USING (true);

-- Study rooms
CREATE TABLE IF NOT EXISTS public.study_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 4,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sr_select" ON public.study_rooms FOR SELECT USING (true);
CREATE POLICY "sr_insert" ON public.study_rooms FOR INSERT WITH CHECK (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));
CREATE POLICY "sr_update" ON public.study_rooms FOR UPDATE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));
CREATE POLICY "sr_delete" ON public.study_rooms FOR DELETE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

-- Study room bookings
CREATE TABLE IF NOT EXISTS public.room_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  booked_by_name text NOT NULL,
  booked_by_id text NOT NULL,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  purpose text DEFAULT '',
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.room_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rb_select" ON public.room_bookings FOR SELECT USING (true);
CREATE POLICY "rb_insert" ON public.room_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "rb_update" ON public.room_bookings FOR UPDATE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));
CREATE POLICY "rb_delete" ON public.room_bookings FOR DELETE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

-- Library events
CREATE TABLE IF NOT EXISTS public.library_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  event_date date NOT NULL,
  start_time time NOT NULL,
  end_time time,
  location text DEFAULT '',
  max_participants integer DEFAULT 50,
  registered_count integer DEFAULT 0,
  type text DEFAULT 'workshop',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.library_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "le_select" ON public.library_events FOR SELECT USING (true);
CREATE POLICY "le_insert" ON public.library_events FOR INSERT WITH CHECK (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));
CREATE POLICY "le_update" ON public.library_events FOR UPDATE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));
CREATE POLICY "le_delete" ON public.library_events FOR DELETE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

-- Event registrations
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.library_events(id) ON DELETE CASCADE,
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  student_id text NOT NULL,
  department text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "er_select" ON public.event_registrations FOR SELECT USING (true);
CREATE POLICY "er_insert" ON public.event_registrations FOR INSERT WITH CHECK (true);

-- Digital resources
CREATE TABLE IF NOT EXISTS public.digital_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  title text NOT NULL,
  author text DEFAULT '',
  category text DEFAULT 'ebook',
  file_url text DEFAULT '',
  description text DEFAULT '',
  download_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.digital_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dr_select" ON public.digital_resources FOR SELECT USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));
CREATE POLICY "dr_insert" ON public.digital_resources FOR INSERT WITH CHECK (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));
CREATE POLICY "dr_update" ON public.digital_resources FOR UPDATE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));
CREATE POLICY "dr_delete" ON public.digital_resources FOR DELETE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

-- Seat queue
CREATE TABLE IF NOT EXISTS public.seat_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  student_id text NOT NULL,
  phone text DEFAULT '',
  queue_position integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'waiting',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.seat_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sq_select" ON public.seat_queue FOR SELECT USING (true);
CREATE POLICY "sq_insert" ON public.seat_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "sq_update" ON public.seat_queue FOR UPDATE USING (true);
CREATE POLICY "sq_delete" ON public.seat_queue FOR DELETE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

-- Add book condition to books
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS condition text DEFAULT 'good';

-- Add study_minutes to student_entries for time tracking
ALTER TABLE public.student_entries ADD COLUMN IF NOT EXISTS study_minutes integer DEFAULT 0;
