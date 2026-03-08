
-- Drop and recreate book policies as PERMISSIVE
DROP POLICY IF EXISTS "Library owners can manage books" ON public.books;
DROP POLICY IF EXISTS "Library owners can manage categories" ON public.book_categories;
DROP POLICY IF EXISTS "Public can view categories" ON public.book_categories;
DROP POLICY IF EXISTS "Library owners can manage issues" ON public.book_issues;

-- Books - separate policies for each operation
CREATE POLICY "books_select" ON public.books FOR SELECT TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));

CREATE POLICY "books_insert" ON public.books FOR INSERT TO authenticated
  WITH CHECK (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));

CREATE POLICY "books_update" ON public.books FOR UPDATE TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));

CREATE POLICY "books_delete" ON public.books FOR DELETE TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));

-- Book Categories
CREATE POLICY "cats_select" ON public.book_categories FOR SELECT USING (true);

CREATE POLICY "cats_insert" ON public.book_categories FOR INSERT TO authenticated
  WITH CHECK (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));

CREATE POLICY "cats_update" ON public.book_categories FOR UPDATE TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));

CREATE POLICY "cats_delete" ON public.book_categories FOR DELETE TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));

-- Book Issues
CREATE POLICY "issues_select" ON public.book_issues FOR SELECT TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));

CREATE POLICY "issues_insert" ON public.book_issues FOR INSERT TO authenticated
  WITH CHECK (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));

CREATE POLICY "issues_update" ON public.book_issues FOR UPDATE TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));

CREATE POLICY "issues_delete" ON public.book_issues FOR DELETE TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
