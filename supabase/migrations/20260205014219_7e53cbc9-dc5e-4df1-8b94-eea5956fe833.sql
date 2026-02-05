-- Fix infinite recursion in admin_roles policies
-- The issue is that admin_roles SELECT policy queries admin_roles itself

-- Drop the problematic policies on admin_roles
DROP POLICY IF EXISTS "Only admins can view admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Only admins can insert admin roles" ON public.admin_roles;

-- Create new policies using the security definer function is_admin()
-- This function bypasses RLS and prevents infinite recursion

-- Policy for viewing admin roles - use is_admin function
CREATE POLICY "Admins can view admin roles"
ON public.admin_roles
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Policy for inserting admin roles - use is_admin function  
CREATE POLICY "Admins can insert admin roles"
ON public.admin_roles
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Also fix domain_listings policies that reference admin_roles directly
DROP POLICY IF EXISTS "Admins can view all domain listings" ON public.domain_listings;
DROP POLICY IF EXISTS "Admins can update all domain listings" ON public.domain_listings;
DROP POLICY IF EXISTS "Admins can delete all domain listings" ON public.domain_listings;

-- Recreate using is_admin function to avoid recursion
CREATE POLICY "Admins can view all domain listings"
ON public.domain_listings
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all domain listings"
ON public.domain_listings
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete all domain listings"
ON public.domain_listings
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Fix domain_offers policies
DROP POLICY IF EXISTS "Admins can view all domain offers" ON public.domain_offers;

CREATE POLICY "Admins can view all domain offers"
ON public.domain_offers
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Fix profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.is_admin(auth.uid()));