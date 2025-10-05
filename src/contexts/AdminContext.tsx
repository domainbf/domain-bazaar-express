import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  checkAdminStatus: () => Promise<boolean>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminStatus = async (): Promise<boolean> => {
    if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
      return false;
    }

    try {
      // 使用安全的 is_admin 函数检查管理员状态
      const { data, error } = await supabase.rpc('is_admin', {
        user_id: user.id
      });

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        return false;
      }

      setIsAdmin(data || false);
      return data || false;
    } catch (error) {
      console.error('Error in checkAdminStatus:', error);
      setIsAdmin(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  return (
    <AdminContext.Provider value={{ isAdmin, isLoading, checkAdminStatus }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
