
-- 首先删除现有的外键约束
ALTER TABLE public.domain_offers DROP CONSTRAINT IF EXISTS domain_offers_domain_id_fkey;
ALTER TABLE public.domain_offers DROP CONSTRAINT IF EXISTS fk_domain_listings;

-- 创建正确的外键约束，引用 domain_listings 表
ALTER TABLE public.domain_offers 
ADD CONSTRAINT domain_offers_domain_id_fkey 
FOREIGN KEY (domain_id) REFERENCES public.domain_listings(id) ON DELETE CASCADE;
