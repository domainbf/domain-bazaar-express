-- 给管理员用户设置管理员权限
UPDATE auth.users 
SET raw_app_meta_data = '{"is_admin": true}'::jsonb
WHERE email = '9208522@qq.com';