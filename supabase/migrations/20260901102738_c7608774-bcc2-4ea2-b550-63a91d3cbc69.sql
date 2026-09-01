
ALTER VIEW public.public_reputation SET (security_invoker = on);

REVOKE ALL ON FUNCTION public.recalc_user_reputation(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_user_reviews_reputation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_transactions_sales_count() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recalc_user_reputation(uuid) TO service_role;
