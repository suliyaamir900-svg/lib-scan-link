
-- Allow public read of library name/college for student entry form
CREATE POLICY "Public can view library info" ON public.libraries FOR SELECT TO anon USING (true);
