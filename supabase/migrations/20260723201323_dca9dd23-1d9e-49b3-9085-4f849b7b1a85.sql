
-- 1) disputes: 补齐应答/裁决字段
ALTER TABLE public.disputes
  ADD COLUMN IF NOT EXISTS seller_response text,
  ADD COLUMN IF NOT EXISTS seller_response_at timestamptz,
  ADD COLUMN IF NOT EXISTS seller_evidence_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS resolution text;

-- 被投诉方（respondent，通常为卖家）可 UPDATE 与自己相关的争议
DROP POLICY IF EXISTS "Respondent can update own disputes" ON public.disputes;
CREATE POLICY "Respondent can update own disputes"
  ON public.disputes FOR UPDATE
  TO authenticated
  USING (respondent_id = auth.uid())
  WITH CHECK (respondent_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage all disputes" ON public.disputes;
CREATE POLICY "Admins manage all disputes"
  ON public.disputes FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 2) realtime publication
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='messages') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='disputes') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.disputes';
  END IF;
END $$;

-- 3) 完成订单 + 卖家入账
CREATE OR REPLACE FUNCTION public.complete_order_and_credit_seller(_txn_id uuid, _actor uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _txn public.transactions%ROWTYPE;
BEGIN
  SELECT * INTO _txn FROM public.transactions WHERE id = _txn_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'transaction_not_found');
  END IF;

  IF _txn.progress_stage = 'completed' THEN
    RETURN jsonb_build_object('success', true, 'already', true);
  END IF;

  UPDATE public.transactions
     SET status = 'completed',
         progress_stage = 'completed',
         buyer_confirmed_at = COALESCE(buyer_confirmed_at, now()),
         completed_at = COALESCE(completed_at, now()),
         transfer_confirmed_buyer = true,
         stage_history = COALESCE(stage_history, '{}'::jsonb) || jsonb_build_object('completed', now()),
         updated_at = now()
   WHERE id = _txn_id;

  UPDATE public.domains SET owner_id = _txn.buyer_id, status = 'sold' WHERE id = _txn.domain_id;
  UPDATE public.domain_listings SET owner_id = _txn.buyer_id, status = 'sold' WHERE id = _txn.domain_id;

  IF _txn.seller_id IS NOT NULL AND _txn.seller_id <> _txn.buyer_id THEN
    INSERT INTO public.payment_transactions (user_id, amount, currency, gateway, status, metadata)
    VALUES (
      _txn.seller_id,
      COALESCE(_txn.seller_amount, _txn.amount),
      COALESCE(_txn.currency, 'CNY'),
      'internal',
      'completed',
      jsonb_build_object('type','payout_credit','order_id',_txn_id)
    );
  END IF;

  INSERT INTO public.order_operations_log (transaction_id, operation, operator_id, details)
  VALUES (_txn_id, 'order_completed', _actor, jsonb_build_object('seller_id', _txn.seller_id));

  -- 通知双方
  INSERT INTO public.notifications (user_id, title, message, type, related_id, action_url)
  VALUES (_txn.buyer_id, '✅ 订单已完成', '您已确认收到域名，订单已完成。', 'transaction', _txn_id, '/order/' || _txn_id)
  ON CONFLICT DO NOTHING;
  IF _txn.seller_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id, action_url)
    VALUES (_txn.seller_id, '💰 交易已完成', '买家已确认收到域名，款项已入账您的钱包。', 'transaction', _txn_id, '/order/' || _txn_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_order_and_credit_seller(uuid, uuid) TO authenticated, service_role;

-- 4) 卖家推送过户
CREATE OR REPLACE FUNCTION public.mark_order_transferred(_txn_id uuid, _actor uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _txn public.transactions%ROWTYPE;
BEGIN
  SELECT * INTO _txn FROM public.transactions WHERE id = _txn_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'transaction_not_found');
  END IF;
  IF _txn.seller_id IS NOT NULL AND _txn.seller_id <> _actor AND NOT public.is_admin(_actor) THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  UPDATE public.transactions
     SET progress_stage = 'transferred',
         seller_confirmed_at = COALESCE(seller_confirmed_at, now()),
         transfer_confirmed_seller = true,
         stage_history = COALESCE(stage_history, '{}'::jsonb) || jsonb_build_object('transferred', now()),
         updated_at = now()
   WHERE id = _txn_id;

  INSERT INTO public.order_operations_log (transaction_id, operation, operator_id, details)
  VALUES (_txn_id, 'seller_marked_transferred', _actor, '{}'::jsonb);

  INSERT INTO public.notifications (user_id, title, message, type, related_id, action_url)
  VALUES (_txn.buyer_id, '📦 卖家已推送过户', '请检查您的账户并确认收到域名。', 'transaction', _txn_id, '/order/' || _txn_id);

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_order_transferred(uuid, uuid) TO authenticated, service_role;
