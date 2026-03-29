-- =====================================================
-- 域名交易平台功能扩展迁移
-- 请在 Supabase Dashboard > SQL Editor 中执行此文件
-- =====================================================

-- 1. 站内消息表
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES public.domain_listings(id) ON DELETE SET NULL,
  offer_id UUID REFERENCES public.domain_offers(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 消息表索引
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, receiver_id, domain_id);

-- 消息表 RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can mark messages as read" ON public.messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- 2. 纠纷申诉表
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES public.domain_listings(id) ON DELETE SET NULL,
  initiator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  respondent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  evidence_urls TEXT[],
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved_buyer', 'resolved_seller', 'resolved_split', 'closed')),
  admin_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 纠纷表 RLS
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their disputes" ON public.disputes
  FOR SELECT USING (auth.uid() = initiator_id OR auth.uid() = respondent_id);
CREATE POLICY "Admins can read all disputes" ON public.disputes
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can create disputes" ON public.disputes
  FOR INSERT WITH CHECK (auth.uid() = initiator_id);
CREATE POLICY "Admins can update disputes" ON public.disputes
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- 3a. 给 domain_offers 表增加 transaction_id 字段（报价接受后关联交易）
ALTER TABLE public.domain_offers
  ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL;

-- 3. 补充 transactions 表缺少的字段
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES public.domain_offers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,4) DEFAULT 0.05,
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seller_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transfer_confirmed_seller BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS transfer_confirmed_buyer BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS seller_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS buyer_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. 平台佣金设置（写入 site_settings）
INSERT INTO public.site_settings (key, value, description)
VALUES ('commission_rate', '0.05', '平台手续费率（默认5%）')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value, description)
VALUES ('min_commission', '10', '最低手续费（元）')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value, description)
VALUES ('commission_currency', 'CNY', '手续费币种')
ON CONFLICT (key) DO NOTHING;

-- 5. 拍卖竞价表增加自动竞价上限
ALTER TABLE public.auction_bids
  ADD COLUMN IF NOT EXISTS auto_bid_max NUMERIC(12,2);

-- 6. 更新 escrow_services 增加更多状态字段
ALTER TABLE public.escrow_services
  ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS domain_id UUID REFERENCES public.domain_listings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS domain_transferred_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS buyer_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispute_id UUID REFERENCES public.disputes(id) ON DELETE SET NULL;

-- 7. 通知新增类型 (确保通知表有 type 字段)
-- 通知类型: message, transaction_update, escrow_funded, domain_transferred, dispute_opened, dispute_resolved, review_received, auction_outbid, auction_won

-- 8. 实时功能：为关键表启用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.disputes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.domain_auctions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
