ALTER TABLE public.domain_listings ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_domain_listings_sort_order ON public.domain_listings (sort_order DESC, created_at DESC);

CREATE OR REPLACE FUNCTION public.notify_favorites_on_domain_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _fav RECORD;
  _title text;
  _msg text;
BEGIN
  IF (NEW.price IS DISTINCT FROM OLD.price) THEN
    _title := '💹 关注域名价格变动';
    _msg := NEW.name || ' 的价格由 ' || COALESCE(OLD.price::text, '-') || ' 变更为 ' || NEW.price::text || ' ' || COALESCE(NEW.currency, 'CNY');
  ELSIF (NEW.status IS DISTINCT FROM OLD.status) THEN
    _title := '🔔 关注域名状态更新';
    _msg := NEW.name || ' 的状态由 ' || COALESCE(OLD.status, '-') || ' 变更为 ' || COALESCE(NEW.status, '-');
  ELSE
    RETURN NEW;
  END IF;

  FOR _fav IN SELECT DISTINCT user_id FROM public.user_favorites WHERE domain_id = NEW.id AND user_id IS NOT NULL LOOP
    INSERT INTO public.notifications (user_id, title, message, type, related_id, action_url)
    VALUES (_fav.user_id, _title, _msg, 'system', NEW.id, '/domain/' || NEW.name);
  END LOOP;

  IF (NEW.price IS DISTINCT FROM OLD.price) THEN
    INSERT INTO public.domain_price_history (domain_id, price, previous_price, change_reason, changed_by)
    VALUES (NEW.id, NEW.price, OLD.price, 'listing_update', auth.uid());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_favorites_on_domain_change ON public.domain_listings;
CREATE TRIGGER trg_notify_favorites_on_domain_change
AFTER UPDATE ON public.domain_listings
FOR EACH ROW EXECUTE FUNCTION public.notify_favorites_on_domain_change();