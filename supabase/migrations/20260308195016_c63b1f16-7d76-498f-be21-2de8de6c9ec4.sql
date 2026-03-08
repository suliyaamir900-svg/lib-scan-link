
ALTER TABLE public.library_settings 
ADD COLUMN IF NOT EXISTS allow_seat_booking boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_queue boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_announcements_on_entry boolean DEFAULT true;
