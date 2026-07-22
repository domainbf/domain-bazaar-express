
-- KYC document images
ALTER TABLE public.seller_kyc
  ADD COLUMN IF NOT EXISTS id_front_url text,
  ADD COLUMN IF NOT EXISTS id_back_url text,
  ADD COLUMN IF NOT EXISTS id_selfie_url text;

-- Reviews: helpful / reported counters
ALTER TABLE public.user_reviews
  ADD COLUMN IF NOT EXISTS helpful_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reported boolean NOT NULL DEFAULT false;

-- Fix trigger dispatcher: include Authorization header (anon key) so verify_jwt=true is satisfied
CREATE OR REPLACE FUNCTION public.call_notify_status_change(_type text, _new jsonb, _old jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _url text := 'https://trqxaizkwuizuhlfmdup.supabase.co/functions/v1/notify-status-change';
  _anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycXhhaXprd3VpenVobGZtZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2ODk1NzcsImV4cCI6MjA1MDI2NTU3N30.uv3FElLBTsCNr3Vg4PooW7h1o2ZlivAFGawFH-Zqxns';
BEGIN
  PERFORM extensions.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon,
      'apikey', _anon
    ),
    body := jsonb_build_object('type', _type, 'record', _new, 'old_record', _old)
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'notify-status-change dispatch failed: %', SQLERRM;
END;
$$;
