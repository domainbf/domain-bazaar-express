# NIC.BN Domain Marketplace

A domain name marketplace platform (域见·你) built with React, Vite, TypeScript, and Supabase.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite SPA
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: TanStack Query for server state, React Context for auth
- **Backend**: Supabase (auth, database, edge functions)
- **Routing**: React Router v6 with lazy-loaded routes
- **i18n**: i18next with Chinese/English support

## Key Features

- Domain listing marketplace with search and filtering
- User authentication via Supabase Auth
- Domain ownership verification via DNS TXT records
- Offer submission system with email notifications
- Domain value estimation with AI (Alibaba Bailian API)
- WHOIS lookup integration
- Domain monitoring and alerts
- Admin panel with full CRUD management
- Payment gateway support (Alipay, WeChat Pay, PayPal, Stripe, USDT, bank transfer)

## Development

```bash
npm run dev      # Start dev server on port 5000
npm run build    # Build for production
npm run preview  # Preview production build
```

## Configuration

- The app connects to Supabase via `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` env vars
- Falls back to hardcoded values if env vars are not set (Supabase anon key is a public client key)
- Supabase project ID: `trqxaizkwuizuhlfmdup`

## Deployment

- Configured as a **static** deployment (pure SPA with no server)
- Build command: `npm run build`
- Output directory: `dist`

## Supabase Edge Functions

Located in `supabase/functions/`. These run on Supabase's infrastructure (not Replit):
- `send-email` — unified email via SMTP or Resend
- `send-offer` / `send-offer-notification` — offer email notifications
- `check-domain-verification` / `resend-verification` — DNS verification
- `domain-enhanced-evaluation` — AI domain valuation
- `whois-query` — WHOIS lookup proxy
- `process-payment` / `payment-callback` — payment gateway routing
- `domain-monitoring-check` — scheduled domain status checks
- `keepalive` — database keepalive ping
- `admin-provisioning` / `admin-password` — admin account management
- `auth-email-webhook` — custom auth email templates
