-- Add currency field to domain_listings table
ALTER TABLE domain_listings ADD COLUMN currency TEXT DEFAULT 'USD';

-- Add index for better performance on currency queries
CREATE INDEX idx_domain_listings_currency ON domain_listings(currency);

-- Update existing records to set currency based on price range (just as an example)
UPDATE domain_listings SET currency = 'CNY' WHERE price < 10000;
UPDATE domain_listings SET currency = 'USD' WHERE price >= 10000;