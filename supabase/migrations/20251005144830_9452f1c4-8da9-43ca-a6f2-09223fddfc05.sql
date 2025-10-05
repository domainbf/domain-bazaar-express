-- 1. 启用 pg_cron 扩展（用于定时任务）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. 设置定时任务，每5分钟调用一次 keepalive 函数防止数据库休眠
-- 这将确保数据库保持活跃状态
SELECT cron.schedule(
  'keepalive-database',
  '*/5 * * * *',  -- 每5分钟执行一次
  $$
  SELECT net.http_post(
    url:='https://trqxaizkwuizuhlfmdup.supabase.co/functions/v1/keepalive',
    headers:='{"Content-Type": "application/json"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

-- 3. 创建 admin_roles 表来存储管理员角色（安全最佳实践）
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- 启用 RLS
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- 管理员角色表的 RLS 策略
CREATE POLICY "Only admins can view admin roles"
ON public.admin_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = auth.uid()
  )
);

CREATE POLICY "Only admins can insert admin roles"
ON public.admin_roles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = auth.uid()
  )
);

-- 4. 创建安全的检查管理员函数
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_roles
    WHERE user_id = $1
  );
$$;

-- 5. 为初始管理员账号插入角色（9208522@qq.com）
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- 获取管理员用户ID
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = '9208522@qq.com'
  LIMIT 1;
  
  -- 如果用户存在，插入管理员角色
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.admin_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- 6. 添加域名批量操作日志表
CREATE TABLE IF NOT EXISTS public.domain_bulk_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type text NOT NULL,
  domain_ids uuid[] NOT NULL,
  performed_by uuid REFERENCES auth.users(id),
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.domain_bulk_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view bulk operations"
ON public.domain_bulk_operations FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create bulk operations"
ON public.domain_bulk_operations FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));