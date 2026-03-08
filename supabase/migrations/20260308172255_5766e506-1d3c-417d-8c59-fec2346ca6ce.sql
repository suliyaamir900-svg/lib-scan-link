
-- Fix: Drop RESTRICTIVE policies and recreate as PERMISSIVE
-- Books
DROP POLICY IF EXISTS "books_select" ON public.books;
DROP POLICY IF EXISTS "books_insert" ON public.books;
DROP POLICY IF EXISTS "books_update" ON public.books;
DROP POLICY IF EXISTS "books_delete" ON public.books;

CREATE POLICY "books_select" ON public.books FOR SELECT TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
CREATE POLICY "books_insert" ON public.books FOR INSERT TO authenticated
  WITH CHECK (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
CREATE POLICY "books_update" ON public.books FOR UPDATE TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()))
  WITH CHECK (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
CREATE POLICY "books_delete" ON public.books FOR DELETE TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));

-- Book Categories
DROP POLICY IF EXISTS "cats_select" ON public.book_categories;
DROP POLICY IF EXISTS "cats_insert" ON public.book_categories;
DROP POLICY IF EXISTS "cats_update" ON public.book_categories;
DROP POLICY IF EXISTS "cats_delete" ON public.book_categories;

CREATE POLICY "cats_select" ON public.book_categories FOR SELECT USING (true);
CREATE POLICY "cats_insert" ON public.book_categories FOR INSERT TO authenticated
  WITH CHECK (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
CREATE POLICY "cats_update" ON public.book_categories FOR UPDATE TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()))
  WITH CHECK (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
CREATE POLICY "cats_delete" ON public.book_categories FOR DELETE TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));

-- Book Issues
DROP POLICY IF EXISTS "issues_select" ON public.book_issues;
DROP POLICY IF EXISTS "issues_insert" ON public.book_issues;
DROP POLICY IF EXISTS "issues_update" ON public.book_issues;
DROP POLICY IF EXISTS "issues_delete" ON public.book_issues;

CREATE POLICY "issues_select" ON public.book_issues FOR SELECT TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
CREATE POLICY "issues_insert" ON public.book_issues FOR INSERT TO authenticated
  WITH CHECK (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
CREATE POLICY "issues_update" ON public.book_issues FOR UPDATE TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()))
  WITH CHECK (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
CREATE POLICY "issues_delete" ON public.book_issues FOR DELETE TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
