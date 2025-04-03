
import { supabase } from '@/integrations/supabase/client';

export const initializeAdminUser = async () => {
  try {
    // Check if admin user with email 9208522@qq.com exists
    const response = await supabase.functions.invoke('admin-provisioning', {
      body: {
        action: 'create_admin',
        email: '9208522@qq.com'
      }
    });

    if (response.error) {
      console.error('Error initializing admin user:', response.error);
      return;
    }

    if (response.data.oneTimePassword) {
      console.info('Admin user created with one-time password. Check email for login instructions.');
    } else if (response.data.message === "Admin user already exists") {
      console.info('Admin user already exists.');
    } else {
      console.info('Admin user initialization completed:', response.data.message);
    }
    
    return response.data;
  } catch (error) {
    console.error('Failed to initialize admin user:', error);
  }
};
