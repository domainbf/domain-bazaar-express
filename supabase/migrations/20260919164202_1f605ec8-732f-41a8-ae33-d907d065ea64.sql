ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS buyer_verified boolean NOT NULL DEFAULT false;
ALTER TABLE public.featured_requests ADD COLUMN IF NOT EXISTS auto_approved boolean NOT NULL DEFAULT false;

-- KYC 审核结果同步到 profiles 认证标记
CREATE OR REPLACE FUNCTION public.tg_kyc_sync_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _type text := COALESCE(NEW.kyc_type, 'seller');
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF _type = 'buyer' THEN
      UPDATE public.profiles
         SET buyer_verified = (NEW.status = 'approved'), updated_at = now()
       WHERE id = NEW.user_id;
    ELSE
      UPDATE public.profiles
         SET seller_verified = (NEW.status = 'approved'),
             is_seller = CASE WHEN NEW.status = 'approved' THEN true ELSE is_seller END,
             updated_at = now()
       WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kyc_sync_verified ON public.seller_kyc;
CREATE TRIGGER kyc_sync_verified
AFTER UPDATE ON public.seller_kyc
FOR EACH ROW EXECUTE FUNCTION public.tg_kyc_sync_verified();

-- 精选申请自动审核（BEFORE INSERT）
CREATE OR REPLACE FUNCTION public.tg_featured_request_autoreview()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _kyc_ok boolean := false;
  _domain_ok boolean := false;
BEGIN
  IF NEW.status IS DISTINCT FROM 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.seller_kyc k
     WHERE k.user_id = NEW.requester_id
       AND COALESCE(k.kyc_type, 'seller') = 'seller'
       AND k.status = 'approved'
  ) INTO _kyc_ok;

  SELECT EXISTS(
    SELECT 1 FROM public.domain_listings d
     WHERE d.id = NEW.domain_id
       AND (d.is_verified = true OR d.verification_status = 'verified')
  ) INTO _domain_ok;

  IF _kyc_ok AND _domain_ok THEN
    NEW.status := 'approved';
    NEW.auto_approved := true;
    NEW.reviewed_at := now();
    NEW.review_note := COALESCE(NEW.review_note, '自动审核通过：卖家已实名且域名归属已验证');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS featured_requests_autoreview ON public.featured_requests;
CREATE TRIGGER featured_requests_autoreview
BEFORE INSERT ON public.featured_requests
FOR EACH ROW EXECUTE FUNCTION public.tg_featured_request_autoreview();

-- 插入后通知：自动通过 → 直接上精选并通知申请人；否则通知管理员
CREATE OR REPLACE FUNCTION public.tg_featured_request_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    UPDATE public.domain_listings SET highlight = true WHERE id = NEW.domain_id;

    INSERT INTO public.notifications (user_id, title, message, type, related_id, action_url)
    VALUES (NEW.requester_id, '精选申请已自动通过',
            NEW.domain_name || ' 已通过自动审核，现已展示在精选域名位。',
            'featured_request', NEW.id, '/marketplace');

    INSERT INTO public.notifications (user_id, title, message, type, related_id, action_url)
    SELECT DISTINCT ar.user_id,
           '精选域名已自动上架',
           NEW.domain_name || ' 满足自动审核条件，已进入精选位，如不合适可在后台撤下。',
           'featured_request', NEW.id, '/admin?tab=featured-requests'
    FROM public.admin_roles ar;
  ELSE
    INSERT INTO public.notifications (user_id, title, message, type, related_id, action_url)
    SELECT DISTINCT ar.user_id,
           '新的精选域名申请',
           NEW.domain_name || ' 申请进入精选位，等待人工审核。',
           'featured_request', NEW.id, '/admin?tab=featured-requests'
    FROM public.admin_roles ar;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.tg_kyc_sync_verified() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_featured_request_autoreview() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_featured_request_created() FROM PUBLIC, anon, authenticated;