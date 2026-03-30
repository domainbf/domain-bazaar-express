# NIC.BN Domain Marketplace (域见•你)

A comprehensive domain name trading marketplace built with React, Vite, TypeScript, and Supabase.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite SPA (pure frontend — no Express)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: TanStack Query (15min staleTime, all pages migrated) + React Context for auth
- **Backend**: Supabase (auth, database, realtime, edge functions)
- **Routing**: React Router v6 with lazy-loaded routes
- **i18n**: i18next with Chinese/English support
- **PWA**: vite-plugin-pwa with workbox service worker

## Performance Architecture

- `src/hooks/useDomainListings.ts` — React Query hook for marketplace data. Parallel fetch (listings + analytics simultaneously). Shared queryKey `['domains', 'available']` means Marketplace and Index share cache — instant re-visits.
- `src/hooks/useUserStats.ts` — React Query hook for user center stats. Three queries parallel (domains, transactions, reviews), analytics after domains resolve.
- `src/components/Navbar.tsx` — Prefetches marketplace data on `onMouseEnter` of nav link.
- All pages use `staleTime: 3min` so data is fresh but not refetched on every visit.

## Key Features

### Marketplace & Frontend
- Domain listing marketplace with search and filtering
- User authentication via Supabase Auth (email + Google/GitHub OAuth)
- Domain ownership verification via DNS TXT records
- Offer submission system with real-time notifications
- Domain value estimation with AI (Alibaba Bailian API)
- WHOIS lookup integration
- Domain monitoring and alerts
- `HowItWorksSection` — 4-step flow explainer on homepage
- `Footer` — rich footer with links, stats, copyright
- Domain auctions with real-time bidding

### Trading
- Full transaction lifecycle: offer → payment → escrow → transfer → confirm
- `/transaction/:id` page with step-by-step flow
- `MyTransactions` — user center transaction view with role/status filter
- Escrow service with Supabase-backed records
- Dispute filing and admin resolution center

### User Center
- `ProfileCompletion` — completion percentage widget shown until 100%
- `MyTransactions` — real transactions from DB (buyer/seller view)
- `NotificationsPanel` — 8 notification type filters (offer, transaction, message, escrow, dispute, auction, verification, system)
- `UserCenterStatsGrid` — member since date, seller rating, total sales
- `WalletPanel` — balance from `profiles.balance` DB column

### Marketplace UX Improvements
- TLD quick-filter chips (.com .net .cn .io .ai .app .org .co .me)
- Price range quick-chips (不限/5千以下/5千~2万/2万~10万/10万以上)
- Visible sort bar (最新上架/价格↑/价格↓/最多浏览)
- Result count display with verified-only toggle
- Featured/highlighted domains section at top of listing
- Clear empty states for no results / no data

### Seller Dashboard (Control Panel)
- Stats banner: 在售域名/待处理报价/总浏览量/已完成交易
- Pending offers alert bar with quick-action button
- Tabs with badge counts for pending offers

### Seller Profile Public Page (UserProfile)
- Professional banner with gradient background
- Avatar with verified badge overlay
- Trust stats: listings, total views, completed deals
- Tabs: 在售域名 / 用户评价
- Domain grid with category badges, price, verified indicator
- Domain search within seller's listings
- "联系卖家" button

### Navigation
- Desktop navbar: text links for 域名市场 and 出售域名
- Mobile menu: same links added

### Sell Your Domain Landing Page (/sell)
- Hero with CTA buttons, key stats (5% fee, 24h, 100% safe)
- 4-step process explainer
- 6-feature highlight grid
- 3-tier pricing comparison
- Seller testimonials
- Final CTA section

### Admin Panel (Sidebar Layout)
- Restructured to use left sidebar navigation instead of horizontal tabs
- Navigation grouped into: 数据概览, 域名管理, 交易管理, 用户管理, 内容管理, 系统设置
- `AdminTransactionManagement` — full transaction table with admin actions (confirm payment, release escrow, mark disputed, cancel)
- `AdminAuctionManagement` — auction list with bid history view, end/cancel actions
- `AdminReviewManagement` — review moderation (hide/show/delete)
- Badge indicators on sidebar items for pending counts
- Mobile: Sheet/drawer for sidebar on small screens
- Post-transaction 5-star review system

### Real-time
- In-app messaging (buyer ↔ seller) via Supabase Realtime
- Live domain auctions with auto-bid support
- Notification badges for unread messages

### Admin Panel
- Full CRUD for domains, users, offers, transactions
- Commission/fee configuration (platform percentage)
- Dispute management and resolution
- Escrow oversight view
- Payment gateway settings (Alipay, WeChat, Stripe, USDT, etc.)
- SEO configuration and content management

### Bulk Import
- CSV bulk domain import in User Center → Domains tab
- Drag-and-drop file selection or paste CSV text
- Live parsing with validation, error reporting, and progress tracking

### PWA
- Installable as a native app on Android/iOS/desktop
- Offline browsing support via workbox cache
- App manifest with shortcuts (marketplace, user center, auction)
- Smart install banner (deferred on mobile, iOS instructions shown)

## Routes

| Path | Component | Auth |
|------|-----------|------|
| `/` | Index | No |
| `/marketplace` | Marketplace | No |
| `/auction` | DomainAuction | No |
| `/auth` | AuthPage | No |
| `/user-center` | UserCenter | Yes |
| `/transaction/:id` | TransactionDetail | Yes |
| `/admin` | AdminPanel | Yes (admin only) |
| `/profile/:id` | Profile | No |
| `/domain/:name` | DomainDetail | No |

## Key Files

- `src/App.tsx` — routing and global layout
- `src/pages/TransactionDetail.tsx` — full transaction flow page
- `src/components/messages/MessageCenter.tsx` — real-time chat
- `src/components/disputes/DisputeCenter.tsx` — dispute filing & admin resolution
- `src/components/escrow/EscrowService.tsx` — escrow management
- `src/components/reviews/ReviewSystem.tsx` — post-transaction reviews
- `src/components/admin/CommissionSettings.tsx` — platform fee config
- `src/components/auction/DomainAuction.tsx` — live auction with realtime bids
- `src/components/auction/CreateAuctionDialog.tsx` — seller auction creation UI (in domain detail + domain table)
- `src/components/usercenter/BulkDomainImport.tsx` — CSV bulk import
- `src/components/pwa/PWAInstallBanner.tsx` — PWA install prompt
- `supabase/migrations/add_trading_features.sql` — DB migration (run in Supabase Dashboard)

## Database Tables (Supabase)

Existing: `domain_listings`, `profiles`, `offers`, `notifications`, `transactions`,
`escrow_services`, `user_reviews`, `payment_transactions`, `domain_auctions`,
`auction_bids`, `referral_rewards`, `site_settings`, `domain_monitoring`

Added by migration: `messages`, `disputes`

### CRITICAL: Two Domain Tables (Architectural Mismatch)

There are **two separate domain tables** with different FK relationships:

| Table | Purpose | Used by |
|-------|---------|---------|
| `domain_listings` | Main marketplace listings (12+ domains, full metadata, currency, etc.) | All marketplace UI, offers, filters, search |
| `domains` | Legacy/separate simple domain registry | `transactions.domain_id` FK, `disputes.domain_id` NOT used (nullable) |

**Key FK constraints:**
- `domain_offers.domain_id` → `domain_listings.id` ✓
- `transactions.domain_id` → `domains.id` (NOT domain_listings!)
- `disputes.domain_id` → `domain_listings.id` (nullable, we omit it)

**Code pattern when creating a transaction** (in ReceivedOffersTable & SentOffersTable):
1. Look up domain name from `domain_listings` via `offer.domain_listings.name`
2. Find or create a `domains` entry with that name (upsert-like: select → insert if not found)
3. Use `domains.id` as `domain_id` when inserting into `transactions`
4. Update `domain_listings` status to 'pending' using `domain_listings.id` separately

**TransactionDetail.tsx** reads domain name from `domains` table (not `domain_listings`).
**MyTransactions.tsx** joins `domains:domain_id` (not `domain_listings:domain_id`).

## Development

```bash
npm run dev      # Start dev server on port 5000
npm run build    # Build for production
```

## Important Notes

- The SQL migration in `supabase/migrations/add_trading_features.sql` must be run manually
  in Supabase Dashboard → SQL Editor before messages/disputes features work
- Social login (Google/GitHub) requires enabling OAuth providers in Supabase Dashboard → Auth → Providers
- Password reset emails require deploying the updated `auth-email-webhook` edge function in Supabase Dashboard
- Admin email settings tab has Resend API key config + real test email button (calls `send-email` edge function directly)
- `lovable-tagger` must remain installed — project is developed in Lovable
- All logic goes through Supabase client directly (no Express backend)
