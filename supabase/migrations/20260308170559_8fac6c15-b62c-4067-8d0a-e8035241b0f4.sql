
-- Book Categories
CREATE TABLE IF NOT EXISTS public.book_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(library_id, name)
);

ALTER TABLE public.book_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Library owners can manage categories" ON public.book_categories
  FOR ALL USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));

CREATE POLICY "Public can view categories" ON public.book_categories
  FOR SELECT USING (true);

-- Books
CREATE TABLE IF NOT EXISTS public.books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  title text NOT NULL,
  author text NOT NULL DEFAULT '',
  publisher text DEFAULT '',
  edition text DEFAULT '',
  isbn text DEFAULT '',
  category_id uuid REFERENCES public.book_categories(id) ON DELETE SET NULL,
  category_name text DEFAULT '',
  total_copies int NOT NULL DEFAULT 1,
  available_copies int NOT NULL DEFAULT 1,
  rack_number text DEFAULT '',
  row_number text DEFAULT '',
  shelf_number text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Library owners can manage books" ON public.books
  FOR ALL USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));

-- Book Issues
CREATE TABLE IF NOT EXISTS public.book_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  borrower_type text NOT NULL DEFAULT 'student',
  borrower_name text NOT NULL,
  borrower_id text NOT NULL,
  borrower_department text DEFAULT '',
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  return_date date NOT NULL,
  actual_return_date date,
  status text NOT NULL DEFAULT 'issued',
  fine_amount numeric(10,2) DEFAULT 0,
  fine_per_day numeric(10,2) DEFAULT 5,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.book_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Library owners can manage issues" ON public.book_issues
  FOR ALL USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
