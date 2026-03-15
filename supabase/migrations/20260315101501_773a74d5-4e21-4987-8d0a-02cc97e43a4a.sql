
ALTER TABLE public.library_settings 
ADD COLUMN IF NOT EXISTS max_books_student integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS max_books_teacher integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS max_fine_limit numeric DEFAULT 500;
