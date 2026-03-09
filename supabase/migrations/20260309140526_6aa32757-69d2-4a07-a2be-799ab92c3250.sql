
-- Add library_type column to libraries table
ALTER TABLE public.libraries ADD COLUMN IF NOT EXISTS library_type text DEFAULT 'college';

-- Create student_profiles table
CREATE TABLE public.student_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  photo_url text,
  signature_url text,
  email text,
  enrollment_number text,
  student_id text,
  batch_year text,
  department text,
  course text,
  mobile text,
  address text,
  date_of_birth date,
  gender text,
  father_name text,
  father_mobile text,
  father_email text,
  guardian_occupation text,
  emergency_contact text,
  admission_year text,
  current_semester text,
  roll_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create teacher_profiles table
CREATE TABLE public.teacher_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  photo_url text,
  email text,
  employee_id text,
  department text,
  mobile text,
  address text,
  designation text,
  joining_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

-- RLS for student_profiles
CREATE POLICY "Owner can manage student_profiles" ON public.student_profiles
FOR ALL TO authenticated
USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()))
WITH CHECK (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));

CREATE POLICY "Public can view student_profiles" ON public.student_profiles
FOR SELECT TO anon, authenticated
USING (true);

-- RLS for teacher_profiles
CREATE POLICY "Owner can manage teacher_profiles" ON public.teacher_profiles
FOR ALL TO authenticated
USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()))
WITH CHECK (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));

CREATE POLICY "Public can view teacher_profiles" ON public.teacher_profiles
FOR SELECT TO anon, authenticated
USING (true);

-- Create storage bucket for profile photos and signatures
INSERT INTO storage.buckets (id, name, public) VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for profiles bucket
CREATE POLICY "Anyone can upload to profiles" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'profiles');

CREATE POLICY "Anyone can view profiles" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'profiles');

CREATE POLICY "Authenticated can update profiles" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'profiles');

CREATE POLICY "Authenticated can delete profiles" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'profiles');
