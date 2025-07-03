
-- 首先检查 domain_analytics 表是否有正确的外键关系
-- 删除现有的外键约束（如果存在）
ALTER TABLE public.domain_analytics DROP CONSTRAINT IF EXISTS domain_analytics_domain_id_fkey;

-- 重新创建正确的外键约束，引用 domain_listings 表而不是 domains 表
ALTER TABLE public.domain_analytics 
ADD CONSTRAINT domain_analytics_domain_id_fkey 
FOREIGN KEY (domain_id) REFERENCES public.domain_listings(id) ON DELETE CASCADE;

-- 确保索引存在以提高查询性能
CREATE INDEX IF NOT EXISTS idx_domain_analytics_domain_id ON public.domain_analytics(domain_id);
