-- Fix domain_analytics table constraints and RLS policies

-- Add unique constraint for domain_id to support upsert operations
ALTER TABLE public.domain_analytics 
ADD CONSTRAINT domain_analytics_domain_id_unique UNIQUE (domain_id);

-- Update RLS policies to allow public access for viewing analytics
DROP POLICY IF EXISTS "Users can view their own domain analytics" ON public.domain_analytics;
DROP POLICY IF EXISTS "Users can insert their own domain analytics" ON public.domain_analytics;
DROP POLICY IF EXISTS "Users can update their own domain analytics" ON public.domain_analytics;

-- Create more permissive policies for domain analytics
CREATE POLICY "Anyone can view domain analytics" 
ON public.domain_analytics 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert domain analytics" 
ON public.domain_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update domain analytics" 
ON public.domain_analytics 
FOR UPDATE 
USING (true);