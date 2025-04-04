
import { supabase } from '@/integrations/supabase/client';

export const initializeAdminUser = async () => {
  try {
    // First try to promote through RPC function
    try {
      const { data, error } = await supabase.rpc('promote_user_to_admin', {
        user_email: '9208522@qq.com'
      });
      
      if (!error) {
        console.info('Admin promotion completed successfully.');
        return { success: true, message: "Admin user promoted successfully" };
      }
    } catch (rpcError) {
      console.log('RPC method not available or failed, falling back to edge function');
    }

    // Fall back to edge function
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

    if (response.data?.oneTimePassword) {
      console.info('Admin user created with one-time password. Check email for login instructions.');
    } else if (response.data?.message === "Admin user already exists") {
      console.info('Admin user already exists.');
    } else {
      console.info('Admin user initialization completed:', response.data?.message);
    }
    
    return response.data;
  } catch (error) {
    console.error('Failed to initialize admin user:', error);
  }
};
