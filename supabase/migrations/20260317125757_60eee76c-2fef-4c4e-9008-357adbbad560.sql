
-- Enable realtime on book_issues and books (student_entries already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.book_issues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.books;
