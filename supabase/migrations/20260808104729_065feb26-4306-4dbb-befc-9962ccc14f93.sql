ALTER FUNCTION public.cleanup_expired_valuations() SET search_path = public;
ALTER FUNCTION public.get_user_notifications(uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_offer(text, numeric, text, text, uuid, uuid, uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.mark_all_notifications_as_read(uuid) SET search_path = public;
ALTER FUNCTION public.mark_notification_as_read(uuid) SET search_path = public;
ALTER FUNCTION public.update_ticket_on_reply() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;