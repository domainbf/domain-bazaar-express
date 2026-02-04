-- Add policy for sellers to update offers for their domains
-- This allows sellers to accept/reject offers on their domains

-- First drop the existing update policy if it exists
DROP POLICY IF EXISTS "Sellers can update offers for their domains" ON public.domain_offers;

-- Create a new policy that allows sellers to update offers where they are the seller
CREATE POLICY "Sellers can update offers for their domains"
ON public.domain_offers
FOR UPDATE
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

-- Also add an admin policy to allow admins to view all domain listings
DROP POLICY IF EXISTS "Admins can view all domain listings" ON public.domain_listings;

CREATE POLICY "Admins can view all domain listings"
ON public.domain_listings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = auth.uid()
  )
);

-- Add admin policy to update domain listings
DROP POLICY IF EXISTS "Admins can update all domain listings" ON public.domain_listings;

CREATE POLICY "Admins can update all domain listings"
ON public.domain_listings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = auth.uid()
  )
);

-- Add admin policy to delete domain listings
DROP POLICY IF EXISTS "Admins can delete all domain listings" ON public.domain_listings;

CREATE POLICY "Admins can delete all domain listings"
ON public.domain_listings
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = auth.uid()
  )
);

-- Add admin policy to view all profiles (to see user emails in admin panel)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = auth.uid()
  )
);

-- Also add public visibility for profiles (needed for domain owner info)
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;

CREATE POLICY "Public profiles are viewable"
ON public.profiles
FOR SELECT
USING (true);

-- Add admin policy to update all profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = auth.uid()
  )
);

-- Add admin policy for all domain offers 
DROP POLICY IF EXISTS "Admins can view all domain offers" ON public.domain_offers;

CREATE POLICY "Admins can view all domain offers"
ON public.domain_offers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = auth.uid()
  )
);

-- Ensure notifications can be inserted by system
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);