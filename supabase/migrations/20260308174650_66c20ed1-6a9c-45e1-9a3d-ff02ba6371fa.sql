
-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule domain monitoring check every hour
SELECT cron.schedule(
  'domain-monitoring-hourly',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://trqxaizkwuizuhlfmdup.supabase.co/functions/v1/domain-monitoring-check',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycXhhaXprd3VpenVobGZtZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2ODk1NzcsImV4cCI6MjA1MDI2NTU3N30.uv3FElLBTsCNr3Vg4PooW7h1o2ZlivAFGawFH-Zqxns"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
