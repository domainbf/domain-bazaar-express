-- Enable RLS where policies exist but RLS was disabled
ALTER TABLE public.domain_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Enable required extensions for scheduling HTTP keepalive pings
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Ensure a clean schedule (unschedule existing job if present)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-keepalive') THEN
    PERFORM cron.unschedule((SELECT jobid FROM cron.job WHERE jobname = 'weekly-keepalive' LIMIT 1));
  END IF;
END $$;

-- Schedule weekly keepalive ping every Friday 03:00 UTC
SELECT
  cron.schedule(
    'weekly-keepalive',
    '0 3 * * 5',
    $$
    SELECT net.http_post(
      url := 'https://trqxaizkwuizuhlfmdup.supabase.co/functions/v1/keepalive',
      headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycXhhaXprd3VpenVobGZtZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2ODk1NzcsImV4cCI6MjA1MDI2NTU3N30.uv3FElLBTsCNr3Vg4PooW7h1o2ZlivAFGawFH-Zqxns"}'::jsonb,
      body := '{"ping":"weekly"}'::jsonb
    );
    $$
  );