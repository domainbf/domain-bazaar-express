REVOKE EXECUTE ON FUNCTION public.complete_order_and_credit_seller(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_order_transferred(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_change_password(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.call_notify_status_change(text, jsonb, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.transfer_domain_ownership(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_domain_views(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_offer(text, numeric, text, text, uuid, uuid, uuid) FROM anon;