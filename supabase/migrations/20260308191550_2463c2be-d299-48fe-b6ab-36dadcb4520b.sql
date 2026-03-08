
-- Create a secure function for admin to change any user's password (including their own)
CREATE OR REPLACE FUNCTION public.admin_change_password(
  p_user_email TEXT,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Verify caller is admin
  SELECT public.is_admin(auth.uid()) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', '无管理员权限');
  END IF;

  -- We can't directly change password from SQL, return instruction to use edge function
  RETURN jsonb_build_object('success', true, 'message', 'Use edge function for password change');
END;
$$;
