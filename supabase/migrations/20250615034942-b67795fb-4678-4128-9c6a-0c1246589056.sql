
-- 检查现有的外键约束并只添加缺失的
-- 首先删除可能存在的约束，然后重新创建（如果不存在会被忽略）

-- 尝试添加 domain_verifications 外键（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'domain_verifications_domain_id_fkey'
    ) THEN
        ALTER TABLE public.domain_verifications 
        ADD CONSTRAINT domain_verifications_domain_id_fkey 
        FOREIGN KEY (domain_id) REFERENCES public.domain_listings(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 尝试添加 domain_price_history 外键（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'domain_price_history_domain_id_fkey'
    ) THEN
        ALTER TABLE public.domain_price_history 
        ADD CONSTRAINT domain_price_history_domain_id_fkey 
        FOREIGN KEY (domain_id) REFERENCES public.domain_listings(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 尝试添加 user_favorites 外键（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_favorites_domain_id_fkey'
    ) THEN
        ALTER TABLE public.user_favorites 
        ADD CONSTRAINT user_favorites_domain_id_fkey 
        FOREIGN KEY (domain_id) REFERENCES public.domain_listings(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 尝试添加 domain_sale_settings 外键（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'domain_sale_settings_domain_id_fkey'
    ) THEN
        ALTER TABLE public.domain_sale_settings 
        ADD CONSTRAINT domain_sale_settings_domain_id_fkey 
        FOREIGN KEY (domain_id) REFERENCES public.domain_listings(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 尝试添加 domain_shares 外键（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'domain_shares_domain_id_fkey'
    ) THEN
        ALTER TABLE public.domain_shares 
        ADD CONSTRAINT domain_shares_domain_id_fkey 
        FOREIGN KEY (domain_id) REFERENCES public.domain_listings(id) ON DELETE CASCADE;
    END IF;
END $$;
