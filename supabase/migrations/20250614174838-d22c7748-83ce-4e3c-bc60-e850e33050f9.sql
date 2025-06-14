
-- 为常用查询列添加索引以优化性能
CREATE INDEX IF NOT EXISTS idx_domains_name ON public.domains(name);
CREATE INDEX IF NOT EXISTS idx_domain_listings_owner_id ON public.domain_listings(owner_id);

-- 创建一个新的数据库函数，将多个数据库操作合并到一个事务中
-- 这可以确保数据的一致性
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
DECLARE
  v_domain_id uuid;
BEGIN
  -- 步骤 1: 从 'domains' 表中查找正确的域名ID
  SELECT id INTO v_domain_id FROM public.domains WHERE name = p_domain_name LIMIT 1;

  IF v_domain_id IS NULL THEN
    RAISE EXCEPTION '在domains表中未找到域名: %', p_domain_name;
  END IF;

  -- 步骤 2: 将报价插入 'domain_offers' 表
  INSERT INTO public.domain_offers (domain_id, amount, contact_email, message, buyer_id, seller_id, status)
  VALUES (v_domain_id, p_offer_amount, p_contact_email, p_message, p_buyer_id, p_seller_id, 'pending');

  -- 步骤 3: 为卖家和买家创建通知
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
