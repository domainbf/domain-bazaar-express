
ALTER TABLE public.order_operations_log
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS order_operations_log_idem_key_uniq
  ON public.order_operations_log (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS order_operations_log_txn_created_idx
  ON public.order_operations_log (transaction_id, created_at DESC);
