CREATE TABLE public.email_delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient text NOT NULL,
  email_type text NOT NULL DEFAULT 'system',
  subject text NOT NULL,
  dedupe_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  error text,
  duration_ms integer,
  related_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.email_delivery_log TO authenticated;
GRANT ALL ON public.email_delivery_log TO service_role;

ALTER TABLE public.email_delivery_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email logs"
ON public.email_delivery_log FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE UNIQUE INDEX email_delivery_log_dedupe_idx ON public.email_delivery_log (dedupe_key);
CREATE INDEX email_delivery_log_user_created_idx ON public.email_delivery_log (user_id, created_at DESC);

CREATE TRIGGER update_email_delivery_log_updated_at
BEFORE UPDATE ON public.email_delivery_log
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();