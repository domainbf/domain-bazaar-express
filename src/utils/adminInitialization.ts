
import { supabase } from '@/integrations/supabase/client';

export const initializeAdminUser = async () => {
  try {
    // 简化管理员初始化，避免阻塞应用启动
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user?.email === '9208522@qq.com') {
      console.info('Admin user already logged in');
      return { message: "Admin user ready" };
    }
    
    // 如果没有登录的管理员用户，尝试确保管理员账号已创建（静默执行，不阻塞）
    try {
      await supabase.functions.invoke('admin-provisioning', {
        body: { 
          action: 'create_admin', 
          email: '9208522@qq.com',
          password: 'lijiawei'
        }
      });
      console.info('Admin provisioning invoked for 9208522@qq.com');
    } catch (e) {
      console.warn('Admin provisioning failed (non-critical):', e);
    }
    return { message: "Initialization attempted" };
    
  } catch (error) {
    // 静默处理错误，不影响应用启动
    console.warn('Admin initialization failed (non-critical):', error);
    return { message: "Failed but continuing" };
  }
};
