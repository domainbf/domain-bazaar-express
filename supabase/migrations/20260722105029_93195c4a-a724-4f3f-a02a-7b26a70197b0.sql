
CREATE TABLE public.seller_kyc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  id_type text NOT NULL,
  id_number text NOT NULL,
  country text,
  phone text,
  payout_method text NOT NULL,
  payout_account text NOT NULL,
  payout_account_name text,
  bank_name text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  reviewer_id uuid,
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_kyc TO authenticated;
GRANT ALL ON public.seller_kyc TO service_role;

ALTER TABLE public.seller_kyc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own KYC" ON public.seller_kyc
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE TRIGGER update_seller_kyc_updated_at
  BEFORE UPDATE ON public.seller_kyc
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
