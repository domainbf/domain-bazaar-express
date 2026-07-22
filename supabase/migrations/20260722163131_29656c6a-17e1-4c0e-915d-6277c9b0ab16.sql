
-- Ensure pg_net is available for async HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Helper: call the notify-status-change edge function asynchronously
CREATE OR REPLACE FUNCTION public.call_notify_status_change(_type text, _new jsonb, _old jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _url text := 'https://trqxaizkwuizuhlfmdup.supabase.co/functions/v1/notify-status-change';
  _anon text;
BEGIN
  -- Use anon key just to satisfy any Authorization requirement; edge fn uses service role internally.
  _anon := current_setting('app.settings.supabase_anon_key', true);

  PERFORM extensions.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('type', _type, 'record', _new, 'old_record', _old)
  );
EXCEPTION WHEN OTHERS THEN
  -- Never block the underlying transaction on notification failure
  RAISE NOTICE 'notify-status-change dispatch failed: %', SQLERRM;
END;
$$;

-- Trigger function for domain_offers
CREATE OR REPLACE FUNCTION public.tg_domain_offers_status_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    PERFORM public.call_notify_status_change('offer', to_jsonb(NEW), to_jsonb(OLD));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS domain_offers_status_notify ON public.domain_offers;
CREATE TRIGGER domain_offers_status_notify
AFTER UPDATE ON public.domain_offers
FOR EACH ROW
EXECUTE FUNCTION public.tg_domain_offers_status_notify();

-- Trigger function for seller_kyc
CREATE OR REPLACE FUNCTION public.tg_seller_kyc_status_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    PERFORM public.call_notify_status_change('kyc', to_jsonb(NEW), to_jsonb(OLD));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seller_kyc_status_notify ON public.seller_kyc;
CREATE TRIGGER seller_kyc_status_notify
AFTER UPDATE ON public.seller_kyc
FOR EACH ROW
EXECUTE FUNCTION public.tg_seller_kyc_status_notify();
