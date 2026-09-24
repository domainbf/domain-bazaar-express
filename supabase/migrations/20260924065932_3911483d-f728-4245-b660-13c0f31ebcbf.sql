-- Prevent duplicate orders per offer
CREATE UNIQUE INDEX IF NOT EXISTS transactions_offer_id_unique
  ON public.transactions (offer_id) WHERE offer_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.accept_domain_offer(_offer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer       public.domain_offers;
  v_listing     public.domain_listings;
  v_domain_id   uuid;
  v_txn         public.transactions;
  v_rate        numeric := 0.05;
  v_commission  numeric;
BEGIN
  SELECT * INTO v_offer FROM public.domain_offers WHERE id = _offer_id;
  IF v_offer.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'offer_not_found');
  END IF;

  IF NOT (auth.uid() = v_offer.seller_id OR public.is_admin(auth.uid())) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  -- already linked to an order → idempotent return
  SELECT * INTO v_txn FROM public.transactions WHERE offer_id = _offer_id LIMIT 1;
  IF v_txn.id IS NOT NULL THEN
    UPDATE public.domain_offers
       SET status = 'accepted', transaction_id = v_txn.id, updated_at = now()
     WHERE id = _offer_id AND (status <> 'accepted' OR transaction_id IS DISTINCT FROM v_txn.id);
    RETURN jsonb_build_object('ok', true, 'transaction_id', v_txn.id, 'reused', true);
  END IF;

  SELECT * INTO v_listing FROM public.domain_listings WHERE id = v_offer.domain_id;
  IF v_listing.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'listing_not_found');
  END IF;

  -- resolve (or create) the canonical domains row, since transactions.domain_id -> domains.id
  SELECT id INTO v_domain_id FROM public.domains WHERE lower(name) = lower(v_listing.name) LIMIT 1;
  IF v_domain_id IS NULL THEN
    INSERT INTO public.domains (name, price, description, category, status, owner_id)
    VALUES (v_listing.name, v_listing.price, v_listing.description,
            COALESCE(v_listing.category, 'standard'), 'reserved', v_listing.owner_id)
    RETURNING id INTO v_domain_id;
  END IF;

  v_commission := round(COALESCE(v_offer.amount, 0) * v_rate, 2);

  INSERT INTO public.transactions (
    domain_id, buyer_id, seller_id, offer_id, amount, currency,
    status, payment_method, progress_stage,
    commission_rate, commission_amount, seller_amount, order_number, stage_history
  ) VALUES (
    v_domain_id, v_offer.buyer_id, COALESCE(v_offer.seller_id, v_listing.owner_id), _offer_id,
    v_offer.amount, COALESCE(v_offer.currency, v_listing.currency, 'USD'),
    'payment_pending', 'pending', 'submitted',
    v_rate, v_commission, COALESCE(v_offer.amount, 0) - v_commission,
    'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 8),
    jsonb_build_array(jsonb_build_object('stage', 'submitted', 'at', now(), 'note', '卖家已接受报价，等待买家付款'))
  )
  RETURNING * INTO v_txn;

  UPDATE public.domain_offers
     SET status = 'accepted', transaction_id = v_txn.id, updated_at = now()
   WHERE id = _offer_id;

  RETURN jsonb_build_object('ok', true, 'transaction_id', v_txn.id,
                            'order_number', v_txn.order_number, 'reused', false);
END;
$$;

REVOKE ALL ON FUNCTION public.accept_domain_offer(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_domain_offer(uuid) TO authenticated;