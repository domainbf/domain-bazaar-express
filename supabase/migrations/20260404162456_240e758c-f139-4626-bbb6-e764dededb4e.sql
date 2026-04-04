-- Add unique constraint
ALTER TABLE public.admin_roles ADD CONSTRAINT admin_roles_user_id_role_unique UNIQUE (user_id, role);

-- Insert admin role
INSERT INTO public.admin_roles (user_id, role)
VALUES ('540e9131-08b6-4e82-aaa8-4aa894d0bda2', 'admin');