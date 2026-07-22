
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS order_number text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent text,
  ADD COLUMN IF NOT EXISTS stripe_checkout_url text,
  ADD COLUMN IF NOT EXISTS progress_stage text NOT NULL DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS stage_history jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS receipt_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS receipt_summary jsonb;

CREATE INDEX IF NOT EXISTS idx_transactions_stripe_session ON public.transactions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_number ON public.transactions(order_number);

-- Backfill order_number for existing rows
UPDATE public.transactions
   SET order_number = 'ORD-' || to_char(created_at, 'YYYYMMDD') || '-' || substr(replace(id::text,'-',''),1,8)
 WHERE order_number IS NULL;

CREATE OR REPLACE FUNCTION public.notify_transaction_stage_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_domain_name text;
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.progress_stage IS DISTINCT FROM NEW.progress_stage) THEN
    SELECT name INTO v_domain_name FROM public.domains WHERE id = NEW.domain_id LIMIT 1;
    IF NEW.buyer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, related_id, action_url)
      VALUES (
        NEW.buyer_id,
        '订单进度更新',
        COALESCE(v_domain_name,'域名') || ' 订单进入阶段：' || NEW.progress_stage,
        'transaction',
        NEW.id,
        '/order/' || NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_transaction_stage_change ON public.transactions;
CREATE TRIGGER trg_notify_transaction_stage_change
AFTER UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.notify_transaction_stage_change();
