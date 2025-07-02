
-- 优化域名分析表，添加索引提高查询效率
CREATE INDEX IF NOT EXISTS idx_domain_analytics_domain_id ON domain_analytics(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_analytics_last_updated ON domain_analytics(last_updated);

-- 优化域名列表表的索引
CREATE INDEX IF NOT EXISTS idx_domain_listings_status ON domain_listings(status);
CREATE INDEX IF NOT EXISTS idx_domain_listings_category ON domain_listings(category);
CREATE INDEX IF NOT EXISTS idx_domain_listings_owner_id ON domain_listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_domain_listings_created_at ON domain_listings(created_at);
CREATE INDEX IF NOT EXISTS idx_domain_listings_price ON domain_listings(price);

-- 优化通知表的索引
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- 创建域名监控表
CREATE TABLE IF NOT EXISTS domain_monitoring (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  domain_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'monitoring',
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT now(),
  check_interval INTEGER DEFAULT 3600, -- 检查间隔（秒）
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 为域名监控表添加索引
CREATE INDEX IF NOT EXISTS idx_domain_monitoring_user_id ON domain_monitoring(user_id);
CREATE INDEX IF NOT EXISTS idx_domain_monitoring_domain_name ON domain_monitoring(domain_name);
CREATE INDEX IF NOT EXISTS idx_domain_monitoring_last_checked ON domain_monitoring(last_checked);

-- 创建域名监控历史记录表
CREATE TABLE IF NOT EXISTS domain_monitoring_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  monitoring_id UUID NOT NULL REFERENCES domain_monitoring(id) ON DELETE CASCADE,
  status_before TEXT,
  status_after TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  response_time INTEGER, -- 响应时间（毫秒）
  error_message TEXT
);

-- 为监控历史表添加索引
CREATE INDEX IF NOT EXISTS idx_domain_monitoring_history_monitoring_id ON domain_monitoring_history(monitoring_id);
CREATE INDEX IF NOT EXISTS idx_domain_monitoring_history_checked_at ON domain_monitoring_history(checked_at);

-- 创建域名估值缓存表
CREATE TABLE IF NOT EXISTS domain_valuations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_name TEXT NOT NULL,
  estimated_value NUMERIC NOT NULL,
  factors JSONB,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours')
);

-- 为估值缓存表添加索引
CREATE INDEX IF NOT EXISTS idx_domain_valuations_domain_name ON domain_valuations(domain_name);
CREATE INDEX IF NOT EXISTS idx_domain_valuations_expires_at ON domain_valuations(expires_at);

-- 为域名监控表添加RLS策略
ALTER TABLE domain_monitoring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own domain monitoring" 
  ON domain_monitoring 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 为域名监控历史表添加RLS策略
ALTER TABLE domain_monitoring_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own monitoring history" 
  ON domain_monitoring_history 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM domain_monitoring dm 
    WHERE dm.id = domain_monitoring_history.monitoring_id 
    AND dm.user_id = auth.uid()
  ));

-- 为域名估值表添加RLS策略
ALTER TABLE domain_valuations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view domain valuations" 
  ON domain_valuations 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert domain valuations" 
  ON domain_valuations 
  FOR INSERT 
  WITH CHECK (true);

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为域名监控表添加更新时间触发器
DROP TRIGGER IF EXISTS update_domain_monitoring_updated_at ON domain_monitoring;
CREATE TRIGGER update_domain_monitoring_updated_at
    BEFORE UPDATE ON domain_monitoring
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 清理过期的域名估值缓存
CREATE OR REPLACE FUNCTION cleanup_expired_valuations()
RETURNS void AS $$
BEGIN
    DELETE FROM domain_valuations WHERE expires_at < now();
END;
$$ language 'plpgsql';
