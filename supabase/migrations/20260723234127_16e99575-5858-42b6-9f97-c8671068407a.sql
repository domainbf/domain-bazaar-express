
-- 1) Store anon key in vault instead of hardcoding
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'internal_anon_key') THEN
    PERFORM vault.create_secret(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycXhhaXprd3VpenVobGZtZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2ODk1NzcsImV4cCI6MjA1MDI2NTU3N30.uv3FElLBTsCNr3Vg4PooW7h1o2ZlivAFGawFH-Zqxns',
      'internal_anon_key'
    );
  END IF;
END $$;

-- Rewrite call_notify_status_change to read from vault
CREATE OR REPLACE FUNCTION public.call_notify_status_change(_type text, _new jsonb, _old jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public','extensions'
AS $function$
DECLARE
  _url text := 'https://trqxaizkwuizuhlfmdup.supabase.co/functions/v1/notify-status-change';
  _anon text;
BEGIN
  SELECT decrypted_secret INTO _anon FROM vault.decrypted_secrets WHERE name = 'internal_anon_key' LIMIT 1;
  IF _anon IS NULL THEN
    RAISE NOTICE 'internal_anon_key not configured in vault';
    RETURN;
  END IF;
  PERFORM extensions.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || _anon,
      'apikey', _anon
    ),
    body := jsonb_build_object('type', _type, 'record', _new, 'old_record', _old)
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'notify-status-change dispatch failed: %', SQLERRM;
END;
$function$;

-- 2) Harden escrow_services: restrict writes to service_role only
DROP POLICY IF EXISTS "Service role manages escrow" ON public.escrow_services;
CREATE POLICY "Service role manages escrow"
ON public.escrow_services FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- 3) Harden domain_view_events: no client access; only SECURITY DEFINER RPC writes
DROP POLICY IF EXISTS "Deny all client access" ON public.domain_view_events;
CREATE POLICY "Deny all client access"
ON public.domain_view_events FOR ALL
TO authenticated, anon
USING (false) WITH CHECK (false);
