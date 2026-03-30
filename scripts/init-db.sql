-- Replit PostgreSQL schema init for 域见•你 domain marketplace
-- All tables use TEXT/REAL/INTEGER to match the LibSQL schema exactly

CREATE TABLE IF NOT EXISTS app_auth_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_verified INTEGER DEFAULT 1,
  reset_token TEXT,
  reset_token_expires TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  refresh_token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  user_agent TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TEXT,
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  company_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  custom_url TEXT,
  is_seller INTEGER,
  seller_verified INTEGER,
  seller_rating REAL,
  total_sales INTEGER DEFAULT 0,
  balance REAL DEFAULT 0,
  verification_status TEXT,
  verification_documents TEXT,
  payment_info TEXT,
  preferred_payment_methods TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS domains (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  category TEXT,
  description TEXT,
  status TEXT,
  owner_id TEXT,
  sale_type TEXT,
  buy_now_price REAL,
  minimum_offer REAL,
  minimum_price REAL,
  negotiable INTEGER,
  registrar TEXT,
  registration_date TEXT,
  expiry_date TEXT,
  is_featured INTEGER,
  featured_rank INTEGER,
  is_verified INTEGER,
  verification_status TEXT,
  views INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS domain_listings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  category TEXT,
  description TEXT,
  status TEXT DEFAULT 'available',
  owner_id TEXT,
  is_verified INTEGER DEFAULT 0,
  verification_status TEXT,
  highlight INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'CNY',
  created_at TEXT,
  updated_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_domain_listings_name ON domain_listings(name);

CREATE TABLE IF NOT EXISTS domain_analytics (
  id TEXT PRIMARY KEY,
  domain_id TEXT,
  views INTEGER DEFAULT 0,
  favorites INTEGER DEFAULT 0,
  offers INTEGER DEFAULT 0,
  last_updated TEXT
);

CREATE TABLE IF NOT EXISTS domain_offers (
  id TEXT PRIMARY KEY,
  domain_id TEXT,
  buyer_id TEXT,
  seller_id TEXT,
  amount REAL NOT NULL,
  message TEXT,
  contact_email TEXT,
  status TEXT DEFAULT 'pending',
  counter_amount REAL,
  counter_message TEXT,
  transaction_id TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS domain_auctions (
  id TEXT PRIMARY KEY,
  domain_id TEXT,
  starting_price REAL NOT NULL,
  current_price REAL NOT NULL,
  reserve_price REAL,
  bid_increment REAL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT,
  winner_id TEXT,
  total_bids INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS auction_bids (
  id TEXT PRIMARY KEY,
  auction_id TEXT,
  bidder_id TEXT,
  amount REAL NOT NULL,
  is_automatic INTEGER DEFAULT 0,
  auto_bid_max REAL,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL,
  buyer_id TEXT,
  seller_id TEXT,
  offer_id TEXT,
  amount REAL NOT NULL,
  commission_rate REAL DEFAULT 0.05,
  commission_amount REAL DEFAULT 0,
  seller_amount REAL DEFAULT 0,
  payment_method TEXT,
  payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'payment_pending',
  notes TEXT,
  buyer_confirmed_at TEXT,
  seller_confirmed_at TEXT,
  transfer_confirmed_buyer INTEGER DEFAULT 0,
  transfer_confirmed_seller INTEGER DEFAULT 0,
  completed_at TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS escrow_services (
  id TEXT PRIMARY KEY,
  transaction_id TEXT,
  buyer_id TEXT,
  seller_id TEXT,
  domain_id TEXT,
  amount REAL,
  status TEXT DEFAULT 'pending',
  funded_at TEXT,
  domain_transferred_at TEXT,
  buyer_approved_at TEXT,
  released_at TEXT,
  dispute_id TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT,
  title TEXT,
  message TEXT,
  is_read INTEGER DEFAULT 0,
  data TEXT,
  related_id TEXT,
  action_url TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT,
  receiver_id TEXT,
  domain_id TEXT,
  offer_id TEXT,
  transaction_id TEXT,
  content TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY,
  transaction_id TEXT,
  domain_id TEXT,
  initiator_id TEXT,
  respondent_id TEXT,
  reason TEXT NOT NULL,
  description TEXT,
  evidence_urls TEXT,
  status TEXT DEFAULT 'open',
  admin_notes TEXT,
  resolved_by TEXT,
  resolved_at TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_email TEXT NOT NULL,
  user_name TEXT,
  subject TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'normal',
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS ticket_replies (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  user_id TEXT,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_admin_reply INTEGER DEFAULT 0,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  section TEXT DEFAULT 'general',
  type TEXT DEFAULT 'text',
  is_multilingual INTEGER DEFAULT 0,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS smtp_settings (
  id TEXT PRIMARY KEY,
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS domain_verifications (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL,
  user_id TEXT,
  verification_type TEXT NOT NULL,
  verification_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  verification_data TEXT,
  verification_attempts INTEGER DEFAULT 0,
  expiry_date TEXT,
  last_checked TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS domain_price_history (
  id TEXT PRIMARY KEY,
  domain_id TEXT,
  price REAL NOT NULL,
  previous_price REAL,
  changed_by TEXT,
  change_reason TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS domain_history (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL,
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  price_change REAL,
  performed_by TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS domain_monitoring (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  domain_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  check_interval INTEGER DEFAULT 3600,
  last_checked TEXT,
  notifications_enabled INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS domain_monitoring_history (
  id TEXT PRIMARY KEY,
  monitoring_id TEXT NOT NULL,
  status_before TEXT,
  status_after TEXT,
  response_time INTEGER,
  error_message TEXT,
  checked_at TEXT
);

CREATE TABLE IF NOT EXISTS domain_sale_settings (
  id TEXT PRIMARY KEY,
  domain_id TEXT,
  escrow_service INTEGER DEFAULT 0,
  installment_available INTEGER DEFAULT 0,
  installment_terms TEXT,
  payment_methods TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS domain_shares (
  id TEXT PRIMARY KEY,
  domain_id TEXT,
  user_id TEXT,
  platform TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS domain_valuations (
  id TEXT PRIMARY KEY,
  domain_name TEXT NOT NULL,
  estimated_value REAL NOT NULL,
  category TEXT,
  factors TEXT,
  created_at TEXT,
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS domain_bulk_operations (
  id TEXT PRIMARY KEY,
  operation_type TEXT NOT NULL,
  domain_ids TEXT NOT NULL,
  details TEXT,
  performed_by TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS dns_records (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  subdomain TEXT NOT NULL,
  record_type TEXT NOT NULL,
  target TEXT NOT NULL,
  ttl INTEGER DEFAULT 3600,
  priority INTEGER,
  status TEXT DEFAULT 'active',
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT NOT NULL,
  provider_data TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  is_default INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  domain_id TEXT,
  gateway TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT,
  fee REAL,
  status TEXT,
  gateway_transaction_id TEXT,
  gateway_response TEXT,
  payment_url TEXT,
  buyer_note TEXT,
  metadata TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS site_content (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  section TEXT,
  type TEXT,
  content TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS translations (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL,
  language_code TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS user_activities (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  activity_type TEXT NOT NULL,
  resource_id TEXT,
  metadata TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS user_favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  domain_id TEXT,
  created_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_favorites_unique ON user_favorites(user_id, domain_id);

CREATE TABLE IF NOT EXISTS user_reviews (
  id TEXT PRIMARY KEY,
  reviewer_id TEXT,
  reviewed_user_id TEXT,
  transaction_id TEXT,
  rating REAL,
  comment TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS referral_rewards (
  id TEXT PRIMARY KEY,
  referrer_id TEXT,
  referred_user_id TEXT,
  transaction_id TEXT,
  reward_type TEXT,
  reward_amount REAL,
  status TEXT,
  paid_at TEXT,
  created_at TEXT
);

-- Default site settings
INSERT INTO site_settings (key, value, description, section) VALUES
  ('commission_rate', '0.05', '平台手续费率（默认5%）', 'payment'),
  ('min_commission', '10', '最低手续费（元）', 'payment'),
  ('commission_currency', 'CNY', '手续费币种', 'payment'),
  ('site_name', '域见•你', '站点名称', 'general'),
  ('site_url', 'https://nic.rw', '站点URL', 'general')
ON CONFLICT (key) DO NOTHING;
