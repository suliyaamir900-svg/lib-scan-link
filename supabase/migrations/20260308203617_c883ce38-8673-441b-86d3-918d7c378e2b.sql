
-- Add permissive SELECT policy for public exit search on student_entries
CREATE POLICY "Public can search entries for exit"
ON public.student_entries
FOR SELECT
TO anon, authenticated
USING (true);

-- Add permissive UPDATE policy for public exit marking on student_entries
CREATE POLICY "Public can mark exit on entries"
ON public.student_entries
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
