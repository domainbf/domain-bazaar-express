ALTER TABLE public.user_reviews ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();
ALTER TABLE public.user_reviews ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';

DROP POLICY IF EXISTS "Reviewers can update their own review" ON public.user_reviews;
CREATE POLICY "Reviewers can update their own review"
ON public.user_reviews
FOR UPDATE
TO authenticated
USING (reviewer_id = auth.uid())
WITH CHECK (reviewer_id = auth.uid());

DROP TRIGGER IF EXISTS set_user_reviews_updated_at ON public.user_reviews;
CREATE TRIGGER set_user_reviews_updated_at
BEFORE UPDATE ON public.user_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();