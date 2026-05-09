-- 1. 扩展 domain_offers 表
ALTER TABLE public.domain_offers
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS duplicate_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_duplicate_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_domain_offers_idempotency_key
  ON public.domain_offers(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_domain_offers_created_at
  ON public.domain_offers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_domain_offers_status
  ON public.domain_offers(status);

-- 2. 审计日志表
CREATE TABLE IF NOT EXISTS public.offer_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID,
  domain_id UUID,
  buyer_id UUID,
  seller_id UUID,
  event_type TEXT NOT NULL,
  idempotency_key TEXT,
  email_status TEXT,
  email_error TEXT,
  rollback_reason TEXT,
  duplicate_of UUID,
  amount NUMERIC,
  currency TEXT,
  contact_email TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oal_offer_id ON public.offer_audit_logs(offer_id);
CREATE INDEX IF NOT EXISTS idx_oal_domain_id ON public.offer_audit_logs(domain_id);
CREATE INDEX IF NOT EXISTS idx_oal_event_type ON public.offer_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_oal_created_at ON public.offer_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oal_idempotency_key ON public.offer_audit_logs(idempotency_key);

ALTER TABLE public.offer_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all offer audit logs"
  ON public.offer_audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert offer audit logs"
  ON public.offer_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update offer audit logs"
  ON public.offer_audit_logs FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete offer audit logs"
  ON public.offer_audit_logs FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));