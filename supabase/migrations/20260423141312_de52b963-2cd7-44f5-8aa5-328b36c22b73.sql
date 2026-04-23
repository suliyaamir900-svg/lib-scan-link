-- Harden platform_reviews against abuse: validation + rate limiting + sane defaults

-- 1) Tighten column constraints
ALTER TABLE public.platform_reviews
  ALTER COLUMN reviewer_name SET NOT NULL,
  ALTER COLUMN message SET NOT NULL,
  ALTER COLUMN rating SET NOT NULL;

-- 2) Add validation constraints (length + rating range)
DO $$ BEGIN
  ALTER TABLE public.platform_reviews
    ADD CONSTRAINT platform_reviews_rating_range CHECK (rating BETWEEN 1 AND 5);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.platform_reviews
    ADD CONSTRAINT platform_reviews_name_len CHECK (char_length(reviewer_name) BETWEEN 2 AND 80);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.platform_reviews
    ADD CONSTRAINT platform_reviews_role_len CHECK (reviewer_role IS NULL OR char_length(reviewer_role) <= 80);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.platform_reviews
    ADD CONSTRAINT platform_reviews_message_len CHECK (char_length(message) BETWEEN 10 AND 400);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Add an IP/fingerprint column for rate limiting (nullable; set client-side)
ALTER TABLE public.platform_reviews
  ADD COLUMN IF NOT EXISTS submitter_fingerprint text;

CREATE INDEX IF NOT EXISTS idx_platform_reviews_fp_created
  ON public.platform_reviews (submitter_fingerprint, created_at DESC);

-- 4) Anti-spam trigger: block >1 submission per fingerprint per 24h,
--    block exact duplicate message text within 7 days,
--    sanitize whitespace, force is_approved default true (admin can later moderate)
CREATE OR REPLACE FUNCTION public.platform_reviews_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Trim whitespace
  NEW.reviewer_name := btrim(NEW.reviewer_name);
  NEW.message := btrim(NEW.message);
  IF NEW.reviewer_role IS NOT NULL THEN
    NEW.reviewer_role := btrim(NEW.reviewer_role);
  END IF;

  -- Reject obvious link spam
  IF NEW.message ~* '(https?://|www\.|<script|</script|javascript:)' THEN
    RAISE EXCEPTION 'Links and scripts are not allowed in reviews';
  END IF;

  -- Rate limit: max 1 review per fingerprint per 24 hours
  IF NEW.submitter_fingerprint IS NOT NULL AND char_length(NEW.submitter_fingerprint) > 0 THEN
    IF EXISTS (
      SELECT 1 FROM public.platform_reviews
      WHERE submitter_fingerprint = NEW.submitter_fingerprint
        AND created_at > now() - interval '24 hours'
    ) THEN
      RAISE EXCEPTION 'You have already submitted a review recently. Please try again later.';
    END IF;
  END IF;

  -- Block exact duplicate messages within the last 7 days (any submitter)
  IF EXISTS (
    SELECT 1 FROM public.platform_reviews
    WHERE lower(message) = lower(NEW.message)
      AND created_at > now() - interval '7 days'
  ) THEN
    RAISE EXCEPTION 'A very similar review was submitted recently.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_platform_reviews_guard ON public.platform_reviews;
CREATE TRIGGER trg_platform_reviews_guard
BEFORE INSERT ON public.platform_reviews
FOR EACH ROW EXECUTE FUNCTION public.platform_reviews_guard();
