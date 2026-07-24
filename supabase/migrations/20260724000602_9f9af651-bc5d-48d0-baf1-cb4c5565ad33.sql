CREATE OR REPLACE FUNCTION public.log_domain_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _has_domain boolean;
BEGIN
  -- Guard: domain_history.domain_id FKs to public.domains(id).
  -- The trigger is attached to domain_listings, whose ids don't always exist in domains,
  -- so we only log when a matching domains row exists to avoid FK violations.
  SELECT EXISTS(SELECT 1 FROM public.domains WHERE id = NEW.id) INTO _has_domain;
  IF NOT _has_domain THEN
    RETURN NEW;
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.domain_history (
      domain_id, action, previous_status, new_status, performed_by
    ) VALUES (
      NEW.id, 'status_change', OLD.status, NEW.status, auth.uid()
    );
  END IF;

  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO public.domain_history (
      domain_id, action, price_change, performed_by
    ) VALUES (
      NEW.id, 'price_change', NEW.price - OLD.price, auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$function$;