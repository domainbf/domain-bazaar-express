-- 添加RLS策略：用户可以查看自己的所有域名（不管状态如何）
CREATE POLICY "Users can view their own domain listings"
ON public.domain_listings
FOR SELECT
USING (owner_id = auth.uid());

-- 这个策略允许用户查看自己的所有域名，无论状态是available、pending、sold还是reserved