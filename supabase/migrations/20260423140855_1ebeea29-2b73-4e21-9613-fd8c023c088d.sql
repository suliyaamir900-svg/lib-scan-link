CREATE TABLE public.platform_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_name TEXT NOT NULL,
  reviewer_role TEXT DEFAULT '',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anonymous visitors) can read approved reviews
CREATE POLICY "Public can view approved reviews"
ON public.platform_reviews FOR SELECT
TO anon, authenticated
USING (is_approved = true);

-- Anyone can submit a review (will go in as approved=true; could be flipped to moderation later)
CREATE POLICY "Anyone can submit a review"
ON public.platform_reviews FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE INDEX idx_platform_reviews_created ON public.platform_reviews (created_at DESC);