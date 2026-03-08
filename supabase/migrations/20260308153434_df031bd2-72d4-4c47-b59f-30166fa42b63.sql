
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'library_admin');

-- Libraries table
CREATE TABLE public.libraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  college_name TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  qr_code_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student entries table
CREATE TABLE public.student_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID REFERENCES public.libraries(id) ON DELETE CASCADE NOT NULL,
  student_name TEXT NOT NULL,
  department TEXT NOT NULL,
  year TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  id_card_number TEXT,
  signature_path TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_time TIME NOT NULL DEFAULT CURRENT_TIME,
  device_info TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.libraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Libraries RLS: owners can manage their own library
CREATE POLICY "Users can view own library" ON public.libraries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own library" ON public.libraries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own library" ON public.libraries FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Student entries RLS: library owners can view their entries, anyone can insert (public form)
CREATE POLICY "Library owners can view entries" ON public.student_entries FOR SELECT TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));
CREATE POLICY "Anyone can insert entries" ON public.student_entries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Library owners can delete entries" ON public.student_entries FOR DELETE TO authenticated
  USING (library_id IN (SELECT id FROM public.libraries WHERE user_id = auth.uid()));

-- User roles RLS
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- Trigger: auto-create library on signup (using auth metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.libraries (user_id, name, college_name, admin_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'library_name', 'My Library'),
    COALESCE(NEW.raw_user_meta_data->>'college_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'admin_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'library_admin');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for student_entries
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_entries;
