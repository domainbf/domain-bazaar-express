
-- 1) notification_prefs on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL DEFAULT jsonb_build_object(
    'email_offer', true,
    'email_transaction', true,
    'email_message', false,
    'email_dispute', true,
    'email_system', false,
    'site_offer', true,
    'site_transaction', true,
    'site_message', true,
    'site_dispute', true,
    'site_system', true
  );

-- 2) saved_searches table
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query TEXT DEFAULT '',
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  notify_new BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_searches TO authenticated;
GRANT ALL ON public.saved_searches TO service_role;

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_saved_searches_select" ON public.saved_searches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_saved_searches_insert" ON public.saved_searches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_saved_searches_update" ON public.saved_searches FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_saved_searches_delete" ON public.saved_searches FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_saved_searches_updated
  BEFORE UPDATE ON public.saved_searches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) domain_view_events for throttling
CREATE TABLE IF NOT EXISTS public.domain_view_events (
  id BIGSERIAL PRIMARY KEY,
  domain_id UUID NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dve_lookup ON public.domain_view_events (domain_id, ip_hash, created_at DESC);

GRANT ALL ON public.domain_view_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.domain_view_events_id_seq TO service_role;
ALTER TABLE public.domain_view_events ENABLE ROW LEVEL SECURITY;
-- 无用户策略：仅 SECURITY DEFINER 函数可写

-- 4) throttled increment
CREATE OR REPLACE FUNCTION public.increment_domain_views_throttled(p_domain_id uuid, p_ip_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _recent boolean;
BEGIN
  IF p_domain_id IS NULL OR p_ip_hash IS NULL OR length(p_ip_hash) < 4 THEN
    RETURN false;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.domain_view_events
    WHERE domain_id = p_domain_id
      AND ip_hash = p_ip_hash
      AND created_at > now() - interval '30 minutes'
  ) INTO _recent;

  IF _recent THEN
    RETURN false;
  END IF;

  INSERT INTO public.domain_view_events (domain_id, ip_hash) VALUES (p_domain_id, p_ip_hash);

  INSERT INTO public.domain_analytics (domain_id, views, favorites, offers, last_updated)
  VALUES (p_domain_id, 1, 0, 0, now())
  ON CONFLICT (domain_id)
  DO UPDATE SET
    views = domain_analytics.views + 1,
    last_updated = now();

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_domain_views_throttled(uuid, text) TO anon, authenticated;
