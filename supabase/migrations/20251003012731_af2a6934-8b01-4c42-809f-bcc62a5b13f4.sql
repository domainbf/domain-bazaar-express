-- =====================================================
-- 域名管理权限加强迁移
-- 确保只有域名所有者才能进行编辑、验证、删除等操作
-- =====================================================

-- 1. 更新 domain_listings 表的 RLS 策略
-- 删除旧的策略
DROP POLICY IF EXISTS "Users can update their own domain listings" ON public.domain_listings;
DROP POLICY IF EXISTS "Users can delete their own domain listings" ON public.domain_listings;
DROP POLICY IF EXISTS "Users can insert their own domain listings" ON public.domain_listings;

-- 创建更严格的策略
-- 只有域名所有者可以插入（确保 owner_id 匹配）
CREATE POLICY "Users can insert their own domains only"
ON public.domain_listings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = owner_id
);

-- 只有域名所有者可以更新自己的域名
CREATE POLICY "Users can update only their own domains"
ON public.domain_listings
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- 只有域名所有者可以删除自己的域名
CREATE POLICY "Users can delete only their own domains"
ON public.domain_listings
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- 2. 确保 domain_verifications 表的策略正确
-- 删除旧策略并重新创建
DROP POLICY IF EXISTS "domain_verifications_insert_policy" ON public.domain_verifications;
DROP POLICY IF EXISTS "domain_verifications_update_policy" ON public.domain_verifications;
DROP POLICY IF EXISTS "domain_verifications_delete_policy" ON public.domain_verifications;
DROP POLICY IF EXISTS "domain_verifications_select_policy" ON public.domain_verifications;

-- 只能为自己拥有的域名创建验证记录
CREATE POLICY "Users can create verifications for their own domains"
ON public.domain_verifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.domain_listings
    WHERE domain_listings.id = domain_verifications.domain_id
    AND domain_listings.owner_id = auth.uid()
  )
);

-- 只能查看自己域名的验证记录
CREATE POLICY "Users can view their own domain verifications"
ON public.domain_verifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.domain_listings
    WHERE domain_listings.id = domain_verifications.domain_id
    AND domain_listings.owner_id = auth.uid()
  )
);

-- 只能更新自己域名的验证记录
CREATE POLICY "Users can update their own domain verifications"
ON public.domain_verifications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.domain_listings
    WHERE domain_listings.id = domain_verifications.domain_id
    AND domain_listings.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.domain_listings
    WHERE domain_listings.id = domain_verifications.domain_id
    AND domain_listings.owner_id = auth.uid()
  )
);

-- 只能删除自己域名的验证记录
CREATE POLICY "Users can delete their own domain verifications"
ON public.domain_verifications
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.domain_listings
    WHERE domain_listings.id = domain_verifications.domain_id
    AND domain_listings.owner_id = auth.uid()
  )
);

-- 3. 添加管理员策略（管理员可以查看所有验证请求）
CREATE POLICY "Admins can view all verifications"
ON public.domain_verifications
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'email'::text) = '9208522@qq.com'::text
);

CREATE POLICY "Admins can update all verifications"
ON public.domain_verifications
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'email'::text) = '9208522@qq.com'::text
)
WITH CHECK (
  (auth.jwt() ->> 'email'::text) = '9208522@qq.com'::text
);

-- 4. 确保 domain_offers 的策略正确
-- 用户只能为别人的域名创建报价，不能为自己的域名报价
DROP POLICY IF EXISTS "Users can insert their own offers" ON public.domain_offers;

CREATE POLICY "Users can create offers for others domains"
ON public.domain_offers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = buyer_id
  AND EXISTS (
    SELECT 1 FROM public.domain_listings
    WHERE domain_listings.id = domain_offers.domain_id
    AND domain_listings.owner_id != auth.uid()  -- 不能为自己的域名报价
  )
);

-- 5. 添加域名状态变更的审计功能
-- 创建一个函数来记录域名状态变更
CREATE OR REPLACE FUNCTION public.log_domain_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 只在状态改变时记录
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.domain_history (
      domain_id,
      action,
      previous_status,
      new_status,
      performed_by
    ) VALUES (
      NEW.id,
      'status_change',
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  
  -- 记录价格变更
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO public.domain_history (
      domain_id,
      action,
      price_change,
      performed_by
    ) VALUES (
      NEW.id,
      'price_change',
      NEW.price - OLD.price,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 创建触发器
DROP TRIGGER IF EXISTS domain_status_change_trigger ON public.domain_listings;
CREATE TRIGGER domain_status_change_trigger
  AFTER UPDATE ON public.domain_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_domain_status_change();

-- 6. 添加域名所有权转移功能的安全检查
-- 创建一个函数来安全地转移域名所有权
CREATE OR REPLACE FUNCTION public.transfer_domain_ownership(
  _domain_id UUID,
  _new_owner_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_owner_id UUID;
BEGIN
  -- 获取当前所有者
  SELECT owner_id INTO _current_owner_id
  FROM public.domain_listings
  WHERE id = _domain_id;
  
  -- 检查调用者是否是当前所有者
  IF _current_owner_id != auth.uid() THEN
    RAISE EXCEPTION '您不是该域名的所有者';
  END IF;
  
  -- 转移所有权
  UPDATE public.domain_listings
  SET owner_id = _new_owner_id,
      status = 'sold'
  WHERE id = _domain_id;
  
  -- 记录转移历史
  INSERT INTO public.domain_history (
    domain_id,
    action,
    previous_status,
    new_status,
    performed_by
  ) VALUES (
    _domain_id,
    'ownership_transfer',
    'available',
    'sold',
    auth.uid()
  );
  
  RETURN TRUE;
END;
$$;

-- 7. 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_domain_listings_owner_id ON public.domain_listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_domain_listings_status ON public.domain_listings(status);
CREATE INDEX IF NOT EXISTS idx_domain_verifications_domain_id ON public.domain_verifications(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_offers_buyer_id ON public.domain_offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_domain_offers_seller_id ON public.domain_offers(seller_id);

-- 8. 添加约束确保数据完整性
-- 确保域名名称唯一
ALTER TABLE public.domain_listings 
DROP CONSTRAINT IF EXISTS unique_domain_name;

ALTER TABLE public.domain_listings 
ADD CONSTRAINT unique_domain_name UNIQUE (name);

-- 确保价格为正数
ALTER TABLE public.domain_listings
DROP CONSTRAINT IF EXISTS positive_price;

ALTER TABLE public.domain_listings
ADD CONSTRAINT positive_price CHECK (price >= 0);

-- 9. 创建一个视图来显示用户的域名统计
CREATE OR REPLACE VIEW public.user_domain_stats AS
SELECT 
  dl.owner_id,
  COUNT(*) as total_domains,
  COUNT(*) FILTER (WHERE dl.status = 'available') as available_domains,
  COUNT(*) FILTER (WHERE dl.status = 'sold') as sold_domains,
  COUNT(*) FILTER (WHERE dl.is_verified = true) as verified_domains,
  SUM(dl.price) as total_value,
  AVG(da.views) as avg_views
FROM public.domain_listings dl
LEFT JOIN public.domain_analytics da ON dl.id = da.domain_id
GROUP BY dl.owner_id;

-- 授予权限
GRANT SELECT ON public.user_domain_stats TO authenticated;

COMMENT ON VIEW public.user_domain_stats IS '用户域名统计视图，显示每个用户的域名概览数据';
