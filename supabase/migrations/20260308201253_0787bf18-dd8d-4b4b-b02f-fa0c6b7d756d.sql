
-- Library departments configuration
CREATE TABLE public.library_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(library_id, name)
);
ALTER TABLE public.library_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dept_select" ON public.library_departments FOR SELECT USING (true);
CREATE POLICY "dept_insert" ON public.library_departments FOR INSERT WITH CHECK (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));
CREATE POLICY "dept_update" ON public.library_departments FOR UPDATE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));
CREATE POLICY "dept_delete" ON public.library_departments FOR DELETE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

-- Library years configuration
CREATE TABLE public.library_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(library_id, name)
);
ALTER TABLE public.library_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "year_select" ON public.library_years FOR SELECT USING (true);
CREATE POLICY "year_insert" ON public.library_years FOR INSERT WITH CHECK (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));
CREATE POLICY "year_update" ON public.library_years FOR UPDATE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));
CREATE POLICY "year_delete" ON public.library_years FOR DELETE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

-- Library lockers
CREATE TABLE public.library_lockers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  locker_number text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(library_id, locker_number)
);
ALTER TABLE public.library_lockers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locker_select" ON public.library_lockers FOR SELECT USING (true);
CREATE POLICY "locker_insert" ON public.library_lockers FOR INSERT WITH CHECK (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));
CREATE POLICY "locker_update" ON public.library_lockers FOR UPDATE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));
CREATE POLICY "locker_delete" ON public.library_lockers FOR DELETE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

-- Locker assignments (public insert for students)
CREATE TABLE public.locker_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  locker_id uuid NOT NULL REFERENCES public.library_lockers(id) ON DELETE CASCADE,
  student_id text NOT NULL,
  student_name text NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz,
  status text NOT NULL DEFAULT 'assigned'
);
ALTER TABLE public.locker_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "la_select" ON public.locker_assignments FOR SELECT USING (true);
CREATE POLICY "la_insert" ON public.locker_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "la_update" ON public.locker_assignments FOR UPDATE USING (true);
CREATE POLICY "la_delete" ON public.locker_assignments FOR DELETE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

-- Book suggestions by students
CREATE TABLE public.book_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  suggested_by_name text NOT NULL,
  suggested_by_id text NOT NULL,
  title text NOT NULL,
  author text DEFAULT '',
  reason text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.book_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bs_select" ON public.book_suggestions FOR SELECT USING (true);
CREATE POLICY "bs_insert" ON public.book_suggestions FOR INSERT WITH CHECK (true);
CREATE POLICY "bs_update" ON public.book_suggestions FOR UPDATE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));
CREATE POLICY "bs_delete" ON public.book_suggestions FOR DELETE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

-- Library feedback
CREATE TABLE public.library_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  student_id text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  category text NOT NULL DEFAULT 'general',
  message text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.library_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fb_select" ON public.library_feedback FOR SELECT USING (true);
CREATE POLICY "fb_insert" ON public.library_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "fb_delete" ON public.library_feedback FOR DELETE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

-- Add visit_purpose to student_entries
ALTER TABLE public.student_entries ADD COLUMN IF NOT EXISTS visit_purpose text DEFAULT '';
-- Add locker_id to student_entries
ALTER TABLE public.student_entries ADD COLUMN IF NOT EXISTS locker_id uuid REFERENCES public.library_lockers(id);
