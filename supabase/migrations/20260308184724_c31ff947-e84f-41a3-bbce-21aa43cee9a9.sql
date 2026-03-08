
-- ============================================================
-- ADMIN FULL ACCESS POLICIES
-- Ensure admin has highest privileges across all key tables
-- ============================================================

-- 1. domain_offers: Admin can update and delete all offers
CREATE POLICY "Admins can update all domain offers"
ON public.domain_offers FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete all domain offers"
ON public.domain_offers FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- 2. domain_listings: Admin can insert domain listings
CREATE POLICY "Admins can insert domain listings"
ON public.domain_listings FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- 3. notifications: Admin can view and manage all notifications
CREATE POLICY "Admins can view all notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete all notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- 4. admin_roles: Admin can update and delete roles
CREATE POLICY "Admins can update admin roles"
ON public.admin_roles FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete admin roles"
ON public.admin_roles FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- 5. profiles: Admin can delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- 6. domain_analytics: Admin can delete analytics
CREATE POLICY "Admins can delete domain analytics"
ON public.domain_analytics FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- 7. user_favorites: Admin can view all favorites
CREATE POLICY "Admins can view all user favorites"
ON public.user_favorites FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 8. domain_verifications: Admin can delete verifications
CREATE POLICY "Admins can delete verifications"
ON public.domain_verifications FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- 9. domain_verifications: Admin can insert verifications
CREATE POLICY "Admins can insert verifications"
ON public.domain_verifications FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- 10. user_activities: Admin can delete activities
CREATE POLICY "Admins can delete activities"
ON public.user_activities FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- 11. domain_price_history: Admin can insert price history
CREATE POLICY "Admins can insert domain price history"
ON public.domain_price_history FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- 12. domain_price_history: Admin can update/delete price history
CREATE POLICY "Admins can update domain price history"
ON public.domain_price_history FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete domain price history"
ON public.domain_price_history FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));
