-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number BIGINT GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ticket replies table
CREATE TABLE IF NOT EXISTS ticket_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_admin_reply BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;

-- Users see their own tickets
DROP POLICY IF EXISTS "users_select_own_tickets" ON support_tickets;
CREATE POLICY "users_select_own_tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create tickets
DROP POLICY IF EXISTS "users_insert_tickets" ON support_tickets;
CREATE POLICY "users_insert_tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admin sees all tickets
DROP POLICY IF EXISTS "admin_all_tickets" ON support_tickets;
CREATE POLICY "admin_all_tickets" ON support_tickets
  FOR ALL USING (auth.jwt()->>'email' = '9208522@qq.com');

-- Users see replies on their own tickets
DROP POLICY IF EXISTS "users_select_replies" ON ticket_replies;
CREATE POLICY "users_select_replies" ON ticket_replies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    ) OR auth.jwt()->>'email' = '9208522@qq.com'
  );

-- Authenticated users insert replies
DROP POLICY IF EXISTS "users_insert_replies" ON ticket_replies;
CREATE POLICY "users_insert_replies" ON ticket_replies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admin updates ticket status
DROP POLICY IF EXISTS "admin_update_tickets" ON support_tickets;
CREATE POLICY "admin_update_tickets" ON support_tickets
  FOR UPDATE USING (auth.jwt()->>'email' = '9208522@qq.com');

-- Auto-update updated_at when reply is added
CREATE OR REPLACE FUNCTION update_ticket_on_reply()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE support_tickets SET updated_at = NOW() WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_ticket_reply ON ticket_replies;
CREATE TRIGGER trg_ticket_reply
  AFTER INSERT ON ticket_replies
  FOR EACH ROW EXECUTE FUNCTION update_ticket_on_reply();
