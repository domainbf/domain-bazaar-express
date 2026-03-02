
-- Add DELETE policy for site_settings so admins can delete settings
CREATE POLICY "Only admin can delete site settings"
ON public.site_settings
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Add DELETE policy for site_content so admins can delete content  
CREATE POLICY "Only admins can delete site content"
ON public.site_content
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Add INSERT policy for site_content using is_admin
CREATE POLICY "Admins can insert site content"
ON public.site_content
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- Add UPDATE policy for site_content using is_admin
CREATE POLICY "Admins can update site content"
ON public.site_content
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

-- Add DELETE policy for pages using is_admin
CREATE POLICY "Admins can delete pages"
ON public.pages
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Add INSERT policy for pages using is_admin
CREATE POLICY "Admins can insert pages"
ON public.pages
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- Add UPDATE policy for pages using is_admin
CREATE POLICY "Admins can update pages"
ON public.pages
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

-- Add INSERT/UPDATE/DELETE for site_settings using is_admin
CREATE POLICY "Admins can insert site settings"
ON public.site_settings
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update site settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));
