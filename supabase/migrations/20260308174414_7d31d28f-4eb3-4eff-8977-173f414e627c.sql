
-- Payment gateway settings table (admin-configurable)
CREATE TABLE public.payment_gateway_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  is_enabled boolean DEFAULT false,
  config jsonb DEFAULT '{}'::jsonb,
  fee_rate numeric DEFAULT 0,
  min_amount numeric DEFAULT 0,
  max_amount numeric DEFAULT 999999999,
  supported_currencies text[] DEFAULT ARRAY['CNY'],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.payment_gateway_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage payment settings
CREATE POLICY "Admins can manage payment gateway settings"
ON public.payment_gateway_settings FOR ALL
USING (public.is_admin(auth.uid()));

-- Allow edge functions with service role to read
CREATE POLICY "Service role can read payment settings"
ON public.payment_gateway_settings FOR SELECT
TO service_role
USING (true);

-- Payment transactions log
CREATE TABLE public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  domain_id uuid,
  gateway text NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'CNY',
  fee numeric DEFAULT 0,
  status text DEFAULT 'pending',
  gateway_transaction_id text,
  gateway_response jsonb,
  payment_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment transactions"
ON public.payment_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create payment transactions"
ON public.payment_transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payment transactions"
ON public.payment_transactions FOR ALL
USING (public.is_admin(auth.uid()));

-- Insert default gateway configurations
INSERT INTO public.payment_gateway_settings (gateway_name, display_name, is_enabled, fee_rate, config) VALUES
('alipay', '支付宝', false, 0.006, '{"app_id": "", "private_key": "", "public_key": "", "sandbox": true}'::jsonb),
('wechat_pay', '微信支付', false, 0.006, '{"app_id": "", "mch_id": "", "api_key": "", "sandbox": true}'::jsonb),
('paypal', 'PayPal', false, 0.029, '{"client_id": "", "client_secret": "", "sandbox": true}'::jsonb),
('stripe', 'Stripe', false, 0.029, '{"publishable_key": "", "secret_key": "", "webhook_secret": ""}'::jsonb),
('bank_transfer', '银行转账', false, 0, '{"bank_name": "", "account_name": "", "account_number": "", "swift_code": ""}'::jsonb);

-- Trigger for updated_at
CREATE TRIGGER update_payment_gateway_settings_updated_at
  BEFORE UPDATE ON public.payment_gateway_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
