
-- Allow admins to view all user activities for audit log
CREATE POLICY "Admins can view all activities"
ON public.user_activities
FOR SELECT
USING (public.is_admin(auth.uid()));
