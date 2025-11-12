-- 创建原子操作函数：增加域名浏览量
CREATE OR REPLACE FUNCTION public.increment_domain_views(p_domain_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 使用 INSERT ... ON CONFLICT 进行原子操作
  INSERT INTO public.domain_analytics (domain_id, views, favorites, offers, last_updated)
  VALUES (p_domain_id, 1, 0, 0, now())
  ON CONFLICT (domain_id)
  DO UPDATE SET
    views = domain_analytics.views + 1,
    last_updated = now();
END;
$$;