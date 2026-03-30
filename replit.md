# NIC.BN Domain Marketplace (域见•你)

A comprehensive domain name trading marketplace built with React, Vite, TypeScript, Hono, and PostgreSQL.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite SPA
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: TanStack Query + React Context for auth
- **Auth**: Custom JWT backend (Hono + Node.js, port 3001) with bcrypt password hashing, 15min access tokens + 30-day refresh tokens stored in localStorage
- **Database**: Replit PostgreSQL — all data stored in the Replit-managed PostgreSQL database (DATABASE_URL secret). Schema initialized via `scripts/init-db.sql`.
- **Email**: Resend API via SMTP credentials stored in `smtp_settings` table (host: smtp.resend.com, from: noreply@nic.rw)
- **Real-time**: Custom SSE endpoint at `/api/realtime/stream` with in-memory EventBus backed by Redis pub/sub. All components use `useRealtimeSubscription` hook.
- **Cache/Sessions**: Redis (REDIS_URL) for session storage, rate limiting, and caching
- **Routing**: React Router v6 with lazy-loaded routes
- **i18n**: i18next with Chinese/English support
- **PWA**: vite-plugin-pwa with workbox service worker

## Services & Ports
- **Vite dev server**: port 5000 (user-facing, proxies /api → 3001)
- **API Server**: port 3001 (`npm run server` → `tsx server/index.ts`)
  - `POST /api/auth/login|register|logout|refresh|me|profile|change-password|request-reset|reset-password`
  - `GET /api/realtime/stream` — SSE stream with ?token=&tables= params
  - `GET/POST /api/data/*` — generic data endpoints from Turso

## Vercel Deployment Notes (CRITICAL)

### POST Body Hang Fix (resolved 2026-03-30)
**Root cause**: `@hono/node-server`'s `getRequestListener` fails to read POST request body streams in Vercel's serverless Lambda environment — the 'end' event is never emitted, causing infinite hangs on all POST routes.

**Fix in `api/index.ts`**: Replaced `getRequestListener` entirely with a manual handler that:
1. Calls `readBody(req)` — checks `req.body` (pre-buffered) then falls back to stream events
2. Constructs a Web API `Request` object manually
3. Calls `app.fetch(webReq)` directly on the Hono app
4. Writes the response back to `res`

This drops login latency from 60s (timeout) → ~1.2s.

### Other Vercel fixes
- `server/db.ts`: Force `https://` protocol for Turso (WebSocket `libsql://` hangs on cold starts)
- `server/redis.ts`: `enableReadyCheck: false`, `connectTimeout: 3000`, `withRedisTimeout()` wrapper
- `api/index.ts`: Non-blocking `bgInit()` (fire-and-forget) — no more init blocking request handlers

## Key Files
- `api/index.ts` — Vercel serverless entry; manual body reader; non-blocking bgInit()
- `server/index.ts` — Local dev Hono API server entry
- `server/routes/auth.ts` — JWT auth routes
- `server/routes/realtime.ts` — SSE endpoint + publish endpoint
- `server/db.ts` — Replit PostgreSQL client (pg Pool with LibSQL-compatible API wrapper)
- `server/jwt.ts` — jose JWT sign/verify
- `server/eventBus.ts` — Node EventEmitter pub/sub bus
- `src/lib/apiClient.ts` — JWT-aware fetch wrapper with auto-refresh
- `src/lib/realtime.ts` — SSE client manager with reconnect
- `src/hooks/useRealtimeSubscription.ts` — React hook for SSE subscriptions
- `src/contexts/AuthContext.tsx` — Uses custom API (no Supabase Auth)

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

## Replit Environment Setup

- **Runtime**: Node 20, port 5000 (mapped to external port 80)
- **Workflow**: "Start application" runs `npm run dev` — no backend server, pure frontend
- **Environment Variables**: Stored as Replit shared env vars (not secrets — these are public Supabase anon keys)
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `VITE_SUPABASE_PROJECT_ID`
- **Deployment**: Static build via `npm run build` → `dist/` folder

## Dark Mode Rules (Critical — March 2026)

The theme has `--primary: 0 0% 94%` in dark mode (near-WHITE). This causes any `bg-primary` or `from-primary` to render as a white/light section on the dark page.

**NEVER use these directly:**
- `bg-primary`, `from-primary`, `via-primary`, `to-primary` for large areas
- `bg-white`, `bg-gray-50/100/200`, `text-gray-800/900` without `dark:` override
- `bg-blue-50/100`, `bg-green-50`, `bg-yellow-50` etc. without `dark:` override
- `text-blue-800`, `text-green-900` etc. (too dark for dark bg)

**ALWAYS use:**
- `bg-card`, `bg-muted`, `bg-background`, `border-border` for container backgrounds
- `text-foreground`, `text-muted-foreground` for text
- `bg-blue-500/10`, `bg-green-500/10` etc. for colored info panels
- For hero/CTA gradients: `bg-gradient-to-br from-foreground to-foreground/90 text-background dark:from-card dark:to-muted dark:text-foreground`
- Primary buttons: `bg-foreground text-background` (NOT `bg-primary`)

**ProtectedRoute** (`src/components/auth/ProtectedRoute.tsx`): Uses `<Navigate>` (NOT `useEffect`+navigate). This eliminates the "验证权限" spinner and toast.error on every protected page visit. Do not revert to the useEffect pattern.

## Important Notes

- The SQL migration in `supabase/migrations/add_trading_features.sql` must be run manually
  in Supabase Dashboard → SQL Editor before messages/disputes features work
- Social login (Google/GitHub) requires enabling OAuth providers in Supabase Dashboard → Auth → Providers
- Admin email settings tab has Resend API key config + real test email button (calls `send-email` edge function directly)
- All logic goes through Supabase client directly (no Express backend)
- Supabase Edge Functions remain deployed on the Supabase project (`trqxaizkwuizuhlfmdup`) — they are NOT run locally

## Supabase Configuration (Current State — March 2026)

All of the following have been applied directly to the Supabase project via Management API:

### Database site_settings (verified correct)
| key | value |
|-----|-------|
| `site_domain` | `https://nic.rw` |
| `site_name` | `域见•你` |
| `logo_text` | `NIC.RW` |
| `contact_email` | `domain@nic.rw` |
| `smtp_from_email` | `noreply@nic.rw` |
| `smtp_from_name` | `域见•你` |
| `resend_api_key` | (set — Resend API key for send-email function) |

### Auth configuration (applied via Management API)
- `site_url`: `https://nic.rw`
- `uri_allow_list`: includes `https://nic.rw` and `https://nic.rw/**`
- Email hook: `auth-email-webhook` edge function (verify_jwt: false)

### Edge Functions (all ACTIVE)
- `auth-email-webhook` (v50) — custom email sender; uses Resend via send-email function
  - Sends recovery/signup/magiclink emails with beautiful HTML templates
  - Uses `/auth/v1/verify?token_hash&type=recovery&redirect_to=` URL format
  - Returns 200 immediately; email sent in EdgeRuntime.waitUntil background task
- `send-email` (v124) — SMTP/Resend email dispatcher
- `send-offer` (latest) — **Bug fixed**: domain lookup uses `.in("status", ["available", "active"])` not `.eq("status", "available")`. Both buyer + seller offer notification emails sent here with modern inline-style HTML templates.
- All other functions (payment, WHOIS, DNS, AI evaluation, etc.) at their current versions

### Deploying edge functions
Preferred: Use the Supabase CLI with access token — supports multi-file bundles:
```bash
SUPABASE_ACCESS_TOKEN=<token> npx supabase functions deploy <slug> --project-ref trqxaizkwuizuhlfmdup
```
For single-file functions, the Management API PATCH approach also works:
```javascript
PATCH https://api.supabase.com/v1/projects/trqxaizkwuizuhlfmdup/functions/{slug}
Authorization: Bearer ${SUPABASE_MANAGEMENT_TOKEN}
Body: { name, body: sourceCodeString, verify_jwt: false }
```
The `SUPABASE_MANAGEMENT_TOKEN` is stored as a Replit shared env var.

## Email Template System (March 2026)

All email templates have been upgraded to use modern inline-style HTML (no CSS classes, compatible with all email clients).

### Frontend Email Utility (`src/lib/emailTemplate.ts`)
Shared builder used by admin and support components:
- `buildEmail(config)` — wraps content in branded header/footer with logo, site name, gradient bar
- `infoTable(rows)` — key-value details table with alternating rows
- `quoteBlock(content)` — indented italic quote display block
- `amountBlock(amount, label)` — large bold price display
- `alertBanner(text, type)` — warning/info/success alert box
- Uses `useSiteSettings` hook for dynamic site_name, contact_email, site_domain

### Edge Function Templates (`supabase/functions/send-offer/templates/`)
- `userOfferTemplate.ts` — buyer confirmation email (offer submitted, escrow promo, security warning)
- `ownerOfferTemplate.ts` — seller notification email (new offer received, action tips, escrow promo)
Both use full inline styles, preheader text, table-based layout for Gmail/Outlook compatibility.

## Currency Converter (March 2026)

`src/components/domain/CurrencyConverter.tsx` — embedded below the price on every domain detail page.
- Uses **Frankfurter API** (`api.frankfurter.app`) — free, no API key needed
- Supports: CNY, USD, EUR, GBP, JPY, HKD, SGD, AUD, CAD, KRW, TWD, THB
- Respects the domain's own currency field (`domain_listings.currency`)
- Default target: if domain is CNY → show USD; if USD → show CNY
- Refresh button + "updated on {date}" attribution
- Added to `DomainDetailPage.tsx` below the one-click-buy price display

### Components with Email Integration
- `AdminTransactionManagement.tsx` — emails on ALL status transitions (in_escrow, domain_transferred, completed, cancelled, refunded) — both buyer and seller notified
- `AdminTickets.tsx` — admin-to-user ticket reply emails
- `SupportTickets.tsx` — ticket status emails (new ticket admin notify, user confirmation, admin reply)
- `ReceivedOffersTable.tsx` — offer accept/reject/counter emails from seller dashboard
