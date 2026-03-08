
-- Add buyer_note column to payment_transactions
ALTER TABLE public.payment_transactions ADD COLUMN IF NOT EXISTS buyer_note text;

-- Insert USDT crypto gateway
INSERT INTO public.payment_gateway_settings (gateway_name, display_name, is_enabled, config, fee_rate, min_amount, max_amount, supported_currencies)
VALUES (
  'usdt_trc20',
  'USDT (TRC-20)',
  false,
  '{"wallet_address": "", "network": "TRC-20", "confirmation_required": 6}'::jsonb,
  0.01,
  10,
  999999999,
  ARRAY['USDT']
)
ON CONFLICT DO NOTHING;
