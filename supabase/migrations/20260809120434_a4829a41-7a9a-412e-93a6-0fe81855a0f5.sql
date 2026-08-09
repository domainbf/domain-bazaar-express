DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'site_settings','site_content','pages','domain_listings','domains',
    'domain_offers','transactions','notifications','user_favorites',
    'seller_kyc','support_tickets','ticket_replies','payment_gateway_settings',
    'email_templates','domain_auctions','auction_bids','payment_transactions','profiles'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;