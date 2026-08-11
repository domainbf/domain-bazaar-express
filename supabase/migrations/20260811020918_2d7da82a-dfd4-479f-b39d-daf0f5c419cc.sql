CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_domain_listings_owner_created ON public.domain_listings (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_domain_listings_status_created ON public.domain_listings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_domain_listings_price ON public.domain_listings (price);
CREATE INDEX IF NOT EXISTS idx_domain_listings_category ON public.domain_listings (category);
CREATE INDEX IF NOT EXISTS idx_domain_listings_name_trgm ON public.domain_listings USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_domains_status_created ON public.domains (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_domains_name_trgm ON public.domains USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_domain_offers_buyer_created ON public.domain_offers (buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_domain_offers_seller_created ON public.domain_offers (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_domain_offers_status ON public.domain_offers (status);