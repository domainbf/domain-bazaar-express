# NIC.BN Domain Marketplace (域见•你)

A comprehensive domain name trading marketplace built with React, Vite, TypeScript, and Supabase.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite SPA (pure frontend — no Express)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: TanStack Query for server state, React Context for auth
- **Backend**: Supabase (auth, database, realtime, edge functions)
- **Routing**: React Router v6 with lazy-loaded routes
- **i18n**: i18next with Chinese/English support
- **PWA**: vite-plugin-pwa with workbox service worker

## Key Features

### Marketplace
- Domain listing marketplace with search and filtering
- User authentication via Supabase Auth (email + Google/GitHub OAuth)
- Domain ownership verification via DNS TXT records
- Offer submission system with real-time notifications
- Domain value estimation with AI (Alibaba Bailian API)
- WHOIS lookup integration
- Domain monitoring and alerts

### Trading
- Full transaction lifecycle: offer → payment → escrow → transfer → confirm
- `/transaction/:id` page with step-by-step flow
- Escrow service with Supabase-backed records
- Dispute filing and admin resolution center
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
