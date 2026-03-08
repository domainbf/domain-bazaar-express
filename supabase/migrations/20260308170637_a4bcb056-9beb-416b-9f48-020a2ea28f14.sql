
-- Fix all RLS policies that use hardcoded email, replace with is_admin() function

-- ===== domain_history =====
DROP POLICY IF EXISTS "Enable insert for admin" ON public.domain_history;
DROP POLICY IF EXISTS "Enable read for admin" ON public.domain_history;

CREATE POLICY "Admins can insert domain history"
ON public.domain_history FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can read domain history"
ON public.domain_history FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- ===== domain_verifications (admin policies only) =====
DROP POLICY IF EXISTS "Admins can update all verifications" ON public.domain_verifications;
DROP POLICY IF EXISTS "Admins can view all verifications" ON public.domain_verifications;

CREATE POLICY "Admins can update all verifications"
ON public.domain_verifications FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all verifications"
ON public.domain_verifications FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- ===== domains =====
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.domains;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.domains;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.domains;

CREATE POLICY "Admins can delete domains"
ON public.domains FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert domains"
ON public.domains FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update domains"
ON public.domains FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- ===== languages =====
DROP POLICY IF EXISTS "Only admin can modify languages" ON public.languages;

CREATE POLICY "Admins can modify languages"
ON public.languages FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- ===== pages (remove hardcoded, keep is_admin ones) =====
DROP POLICY IF EXISTS "Only admin can modify pages" ON public.pages;

CREATE POLICY "Admins can manage pages"
ON public.pages FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- ===== site_content =====
DROP POLICY IF EXISTS "Only admins can modify site content" ON public.site_content;

CREATE POLICY "Admins can manage site content"
ON public.site_content FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- ===== site_settings =====
DROP POLICY IF EXISTS "Only admin can modify site settings" ON public.site_settings;

CREATE POLICY "Admins can manage site settings"
ON public.site_settings FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- ===== smtp_settings =====
DROP POLICY IF EXISTS "Only admin can modify SMTP settings" ON public.smtp_settings;
DROP POLICY IF EXISTS "Only admin can view SMTP settings" ON public.smtp_settings;

CREATE POLICY "Admins can manage SMTP settings"
ON public.smtp_settings FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view SMTP settings"
ON public.smtp_settings FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- ===== transactions =====
DROP POLICY IF EXISTS "Admin can manage all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admin can view all transactions" ON public.transactions;

CREATE POLICY "Admins can manage all transactions"
ON public.transactions FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all transactions"
ON public.transactions FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- ===== translations =====
DROP POLICY IF EXISTS "Only admin can modify translations" ON public.translations;

CREATE POLICY "Admins can modify translations"
ON public.translations FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
