
import { supabase } from '@/integrations/supabase/client';

export const initializeAdminUser = async () => {
  try {
    // 简化管理员初始化，避免阻塞应用启动
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user?.email === '9208522@qq.com') {
      console.info('Admin user already logged in');
      return { message: "Admin user ready" };
    }
    
    // 如果没有登录的管理员用户，跳过初始化
    // 这样不会因为edge function错误而影响应用启动
    console.info('No admin user logged in, skipping initialization');
    return { message: "Initialization skipped" };
    
  } catch (error) {
    // 静默处理错误，不影响应用启动
    console.warn('Admin initialization failed (non-critical):', error);
    return { message: "Failed but continuing" };
  }
};
