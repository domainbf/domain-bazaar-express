
CREATE TABLE IF NOT EXISTS public.domain_logo_generation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID,
  domain_name TEXT NOT NULL,
  status TEXT NOT NULL,
  provider TEXT,
  logo_url TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  fallback_used BOOLEAN NOT NULL DEFAULT false,
  cache_hit BOOLEAN NOT NULL DEFAULT false,
  triggered_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dllogs_domain ON public.domain_logo_generation_logs(domain_id);
CREATE INDEX IF NOT EXISTS idx_dllogs_created ON public.domain_logo_generation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dllogs_status ON public.domain_logo_generation_logs(status);

GRANT SELECT ON public.domain_logo_generation_logs TO authenticated;
GRANT ALL ON public.domain_logo_generation_logs TO service_role;

ALTER TABLE public.domain_logo_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view logo generation logs"
ON public.domain_logo_generation_logs FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));
