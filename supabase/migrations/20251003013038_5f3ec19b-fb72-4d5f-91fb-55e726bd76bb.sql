-- 修复 domain_verifications 表的外键约束
-- 错误: domain_id 应该引用 domain_listings 而不是其他表

-- 1. 删除现有的错误外键约束
ALTER TABLE public.domain_verifications 
DROP CONSTRAINT IF EXISTS domain_verifications_domain_id_fkey;

-- 2. 添加正确的外键约束，引用 domain_listings 表
ALTER TABLE public.domain_verifications 
ADD CONSTRAINT domain_verifications_domain_id_fkey 
FOREIGN KEY (domain_id) 
REFERENCES public.domain_listings(id) 
ON DELETE CASCADE;

-- 3. 清理可能存在的孤立验证记录（domain_id 在 domain_listings 中不存在的记录）
DELETE FROM public.domain_verifications
WHERE domain_id NOT IN (
  SELECT id FROM public.domain_listings
);

-- 4. 确保 user_id 字段正确（如果不存在则添加）
ALTER TABLE public.domain_verifications 
DROP CONSTRAINT IF EXISTS domain_verifications_user_id_fkey;

-- 不引用 auth.users，因为我们只需要存储 user_id
-- 5. 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_domain_verifications_user_id 
ON public.domain_verifications(user_id);

CREATE INDEX IF NOT EXISTS idx_domain_verifications_status 
ON public.domain_verifications(status);

-- 6. 添加约束确保必要字段不为空
ALTER TABLE public.domain_verifications 
ALTER COLUMN domain_id SET NOT NULL;

ALTER TABLE public.domain_verifications 
ALTER COLUMN verification_type SET NOT NULL;

ALTER TABLE public.domain_verifications 
ALTER COLUMN status SET NOT NULL;

-- 7. 添加注释说明
COMMENT ON CONSTRAINT domain_verifications_domain_id_fkey 
ON public.domain_verifications 
IS '引用 domain_listings 表的 id，当域名被删除时级联删除相关验证记录';

COMMENT ON TABLE public.domain_verifications 
IS '域名所有权验证记录表，存储用户对域名的验证请求和状态';
