ALTER TABLE public.saved_searches
  ADD COLUMN IF NOT EXISTS last_run_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_run_status text,
  ADD COLUMN IF NOT EXISTS last_run_error text,
  ADD COLUMN IF NOT EXISTS last_match_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS alert_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS run_interval_hours integer NOT NULL DEFAULT 24;

CREATE TABLE IF NOT EXISTS public.saved_search_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id uuid NOT NULL REFERENCES public.saved_searches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'success',
  match_count integer NOT NULL DEFAULT 0,
  is_test boolean NOT NULL DEFAULT false,
  error text,
  sample jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_search_runs TO authenticated;
GRANT ALL ON public.saved_search_runs TO service_role;

ALTER TABLE public.saved_search_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved search runs"
ON public.saved_search_runs FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_saved_search_runs_search ON public.saved_search_runs (saved_search_id, created_at DESC);