CREATE TABLE public.featured_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES public.domain_listings(id) ON DELETE CASCADE,
  domain_name text NOT NULL,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  reviewer_id uuid REFERENCES auth.users(id),
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX featured_requests_pending_unique
  ON public.featured_requests (domain_id)
  WHERE status = 'pending';
CREATE INDEX featured_requests_status_idx ON public.featured_requests (status, created_at DESC);
CREATE INDEX featured_requests_requester_idx ON public.featured_requests (requester_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.featured_requests TO authenticated;
GRANT ALL ON public.featured_requests TO service_role;

ALTER TABLE public.featured_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own featured requests"
  ON public.featured_requests FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Owners create featured requests for own domains"
  ON public.featured_requests FOR INSERT TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.domain_listings dl
      WHERE dl.id = domain_id AND dl.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins review featured requests"
  ON public.featured_requests FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Owners withdraw pending featured requests"
  ON public.featured_requests FOR DELETE TO authenticated
  USING (requester_id = auth.uid() AND status = 'pending');

CREATE TRIGGER featured_requests_updated_at
  BEFORE UPDATE ON public.featured_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notify all admins when a new request arrives
CREATE OR REPLACE FUNCTION public.tg_featured_request_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, related_id, action_url)
  SELECT DISTINCT ar.user_id,
         '新的精选域名申请',
         NEW.domain_name || ' 申请进入精选位，等待审核。',
         'featured_request',
         NEW.id,
         '/admin?tab=featured-requests'
  FROM public.admin_roles ar;
  RETURN NEW;
END;
$$;

CREATE TRIGGER featured_requests_created_notify
  AFTER INSERT ON public.featured_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_featured_request_created();

-- On review: notify requester, and flag the listing when approved
CREATE OR REPLACE FUNCTION public.tg_featured_request_reviewed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.reviewed_at IS NULL THEN
      NEW.reviewed_at := now();
    END IF;

    IF NEW.status = 'approved' THEN
      UPDATE public.domain_listings SET highlight = true WHERE id = NEW.domain_id;
      INSERT INTO public.notifications (user_id, title, message, type, related_id, action_url)
      VALUES (NEW.requester_id, '精选申请已通过',
              NEW.domain_name || ' 已通过审核，现已展示在精选域名位。',
              'featured_request', NEW.id, '/marketplace');
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, title, message, type, related_id, action_url)
      VALUES (NEW.requester_id, '精选申请未通过',
              NEW.domain_name || ' 的精选申请未通过。' || COALESCE('原因：' || NEW.review_note, ''),
              'featured_request', NEW.id, '/user-center?tab=domains');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER featured_requests_reviewed_notify
  BEFORE UPDATE ON public.featured_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_featured_request_reviewed();

ALTER TABLE public.featured_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.featured_requests;