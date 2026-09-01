
-- 1. KYC 区分买家/卖家
ALTER TABLE public.seller_kyc ADD COLUMN IF NOT EXISTS kyc_type text NOT NULL DEFAULT 'seller';
ALTER TABLE public.seller_kyc DROP CONSTRAINT IF EXISTS seller_kyc_user_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS seller_kyc_user_type_key ON public.seller_kyc (user_id, kyc_type);
CREATE INDEX IF NOT EXISTS seller_kyc_status_idx ON public.seller_kyc (status, created_at DESC);

-- 2. 信誉字段
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seller_review_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS buyer_rating numeric NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS buyer_review_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ALTER COLUMN seller_rating SET DEFAULT 0;

-- 3. 信誉聚合函数与触发器
CREATE OR REPLACE FUNCTION public.recalc_user_reputation(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _seller_avg numeric := 0;
  _seller_cnt integer := 0;
  _buyer_avg numeric := 0;
  _buyer_cnt integer := 0;
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;

  SELECT COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0), COUNT(*)
    INTO _seller_avg, _seller_cnt
  FROM public.user_reviews r
  JOIN public.transactions t ON t.id = r.transaction_id
  WHERE r.reviewed_user_id = _user_id
    AND COALESCE(r.status, 'published') <> 'hidden'
    AND t.seller_id = _user_id;

  SELECT COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0), COUNT(*)
    INTO _buyer_avg, _buyer_cnt
  FROM public.user_reviews r
  JOIN public.transactions t ON t.id = r.transaction_id
  WHERE r.reviewed_user_id = _user_id
    AND COALESCE(r.status, 'published') <> 'hidden'
    AND t.buyer_id = _user_id;

  UPDATE public.profiles
     SET seller_rating = _seller_avg,
         seller_review_count = _seller_cnt,
         buyer_rating = _buyer_avg,
         buyer_review_count = _buyer_cnt,
         updated_at = now()
   WHERE id = _user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_user_reviews_reputation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_user_reputation(OLD.reviewed_user_id);
    RETURN OLD;
  END IF;
  PERFORM public.recalc_user_reputation(NEW.reviewed_user_id);
  IF TG_OP = 'UPDATE' AND OLD.reviewed_user_id IS DISTINCT FROM NEW.reviewed_user_id THEN
    PERFORM public.recalc_user_reputation(OLD.reviewed_user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_reviews_reputation ON public.user_reviews;
CREATE TRIGGER trg_user_reviews_reputation
AFTER INSERT OR UPDATE OR DELETE ON public.user_reviews
FOR EACH ROW EXECUTE FUNCTION public.tg_user_reviews_reputation();

-- 4. 成交数统计（卖家已完成订单）
CREATE OR REPLACE FUNCTION public.tg_transactions_sales_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) AND NEW.seller_id IS NOT NULL THEN
    UPDATE public.profiles p
       SET total_sales = (
         SELECT COUNT(*) FROM public.transactions t
          WHERE t.seller_id = NEW.seller_id AND t.status = 'completed'
       )
     WHERE p.id = NEW.seller_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_transactions_sales_count ON public.transactions;
CREATE TRIGGER trg_transactions_sales_count
AFTER INSERT OR UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.tg_transactions_sales_count();

-- 5. 回填历史数据
DO $$
DECLARE _uid uuid;
BEGIN
  FOR _uid IN SELECT DISTINCT reviewed_user_id FROM public.user_reviews WHERE reviewed_user_id IS NOT NULL LOOP
    PERFORM public.recalc_user_reputation(_uid);
  END LOOP;
END $$;

UPDATE public.profiles p
   SET total_sales = sub.cnt
  FROM (SELECT seller_id, COUNT(*) cnt FROM public.transactions WHERE status = 'completed' AND seller_id IS NOT NULL GROUP BY seller_id) sub
 WHERE p.id = sub.seller_id;

-- 6. 公开信誉视图（仅暴露信誉相关字段）
CREATE OR REPLACE VIEW public.public_reputation AS
SELECT id AS user_id, username, full_name, avatar_url,
       seller_rating, seller_review_count, buyer_rating, buyer_review_count,
       total_sales, seller_verified, verification_status
FROM public.profiles;

GRANT SELECT ON public.public_reputation TO anon, authenticated;
GRANT ALL ON public.public_reputation TO service_role;
