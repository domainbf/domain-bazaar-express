
-- 修复 handle_new_offer 函数，直接使用 domain_listing_id
CREATE OR REPLACE FUNCTION public.handle_new_offer(
    p_domain_name text,
    p_offer_amount numeric,
    p_contact_email text,
    p_message text,
    p_buyer_id uuid,
    p_seller_id uuid,
    p_domain_listing_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 直接使用传入的 domain_listing_id，不再查找 domains 表
  -- 这样可以避免外键约束错误
  INSERT INTO public.domain_offers (domain_id, amount, contact_email, message, buyer_id, seller_id, status)
  VALUES (p_domain_listing_id, p_offer_amount, p_contact_email, p_message, p_buyer_id, p_seller_id, 'pending');

  -- 步骤 2: 为卖家和买家创建通知
  -- 给卖家的通知
  IF p_seller_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id, action_url)
    VALUES (
      p_seller_id,
      '💰 新的域名报价',
      '您的域名 ' || p_domain_name || ' 收到了 ¥' || p_offer_amount || ' 的新报价',
      'offer',
      p_domain_listing_id,
      '/user-center?tab=transactions'
    );
  END IF;

  -- 给买家的通知
  IF p_buyer_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id, action_url)
    VALUES (
      p_buyer_id,
      '✅ 报价提交成功',
      '您对域名 ' || p_domain_name || ' 的 ¥' || p_offer_amount || ' 报价已成功发送给卖家',
      'offer',
      p_domain_listing_id,
      '/user-center?tab=transactions'
    );
  END IF;

END;
$$;
