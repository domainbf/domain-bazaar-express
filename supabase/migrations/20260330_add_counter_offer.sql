-- Add counter-offer fields to domain_offers
ALTER TABLE domain_offers 
  ADD COLUMN IF NOT EXISTS counter_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS counter_message TEXT,
  ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES transactions(id);
