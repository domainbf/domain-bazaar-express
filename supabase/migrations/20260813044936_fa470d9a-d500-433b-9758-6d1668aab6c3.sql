ALTER TABLE public.domain_offers
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_note text;

CREATE TABLE IF NOT EXISTS public.offer_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.domain_offers(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  actor_id uuid,
  actor_role text NOT NULL DEFAULT 'system',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.offer_status_events TO authenticated;
GRANT ALL ON public.offer_status_events TO service_role;

ALTER TABLE public.offer_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view offer timeline"
ON public.offer_status_events FOR SELECT TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.domain_offers o
    WHERE o.id = offer_status_events.offer_id
      AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
  )
);

CREATE INDEX IF NOT EXISTS idx_offer_status_events_offer ON public.offer_status_events(offer_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.tg_offer_status_timeline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.offer_status_events (offer_id, from_status, to_status, actor_id, actor_role, note)
    VALUES (NEW.id, NULL, COALESCE(NEW.status, 'pending'), NEW.buyer_id, 'buyer', '报价已提交');
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.offer_status_events (offer_id, from_status, to_status, actor_id, actor_role, note)
    VALUES (
      NEW.id, OLD.status, NEW.status,
      COALESCE(NEW.reviewed_by, auth.uid()),
      CASE
        WHEN NEW.reviewed_by IS NOT NULL AND NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by THEN 'admin'
        WHEN auth.uid() = NEW.buyer_id THEN 'buyer'
        WHEN auth.uid() = NEW.seller_id THEN 'seller'
        ELSE 'system'
      END,
      NEW.review_note
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_offer_status_timeline_ins ON public.domain_offers;
CREATE TRIGGER trg_offer_status_timeline_ins
AFTER INSERT ON public.domain_offers
FOR EACH ROW EXECUTE FUNCTION public.tg_offer_status_timeline();

DROP TRIGGER IF EXISTS trg_offer_status_timeline_upd ON public.domain_offers;
CREATE TRIGGER trg_offer_status_timeline_upd
AFTER UPDATE ON public.domain_offers
FOR EACH ROW EXECUTE FUNCTION public.tg_offer_status_timeline();

ALTER PUBLICATION supabase_realtime ADD TABLE public.offer_status_events;