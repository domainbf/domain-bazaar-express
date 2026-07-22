
CREATE TABLE IF NOT EXISTS public.order_operations_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL,
  operator_id uuid,
  operator_email text,
  operation text NOT NULL,
  from_stage text,
  to_stage text,
  status text NOT NULL DEFAULT 'success',
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_operations_log TO authenticated;
GRANT ALL ON public.order_operations_log TO service_role;
ALTER TABLE public.order_operations_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read order ops" ON public.order_operations_log
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins insert order ops" ON public.order_operations_log
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_order_ops_txn ON public.order_operations_log(transaction_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.receipt_delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL,
  attempt integer NOT NULL DEFAULT 1,
  status text NOT NULL,
  error text,
  recipient text,
  duration_ms integer,
  triggered_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.receipt_delivery_log TO authenticated;
GRANT ALL ON public.receipt_delivery_log TO service_role;
ALTER TABLE public.receipt_delivery_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or admin read receipt log" ON public.receipt_delivery_log
  FOR SELECT TO authenticated USING (
    public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND t.buyer_id = auth.uid())
  );
CREATE INDEX IF NOT EXISTS idx_receipt_log_txn ON public.receipt_delivery_log(transaction_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_notify_transaction_stage ON public.transactions;
CREATE TRIGGER trg_notify_transaction_stage
AFTER UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.notify_transaction_stage_change();
