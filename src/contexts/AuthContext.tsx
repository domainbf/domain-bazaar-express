
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '@/types/userProfile';
import { toast } from 'sonner';
import { signInWithEmailPassword, signUpWithEmailPassword, signOut as authSignOut, resetUserPassword } from '@/utils/authUtils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, metadata?: { [key: string]: any }) => Promise<boolean>;
  logOut: () => Promise<void>;
  signOut: () => Promise<void>; 
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  isAdmin: boolean;
  checkAdminStatus: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  isAuthenticating?: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const setData = async (session: Session | null) => {
      if (!mounted) return;
      
      try {
        if (session?.user) {
          console.log('Setting user data:', session.user.email);
          setUser(session.user);
          setSession(session);
          
          // 安全地检查管理员状态
          const isAdminUser = Boolean(session.user.app_metadata?.is_admin);
          setIsAdmin(isAdminUser);
          console.log('Admin status:', isAdminUser);
          
          // 获取用户资料，使用优化的查询
          try {
            const profilePromise = supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
            );
            
            const { data: profileData, error } = await Promise.race([
              profilePromise,
              timeoutPromise
            ]) as any;
            
            if (!error && profileData && mounted) {
              setProfile(profileData);
              console.log('Profile loaded:', profileData.username || profileData.full_name);
            } else if (error && mounted) {
              console.error('Profile fetch error:', error);
              // 创建默认 profile 如果不存在
              if (error.code === 'PGRST116') {
                await createDefaultProfile(session.user.id, session.user.email);
              }
            }
          } catch (profileError) {
            console.error('Error fetching profile:', profileError);
            // 不阻塞认证流程
          }
        } else {
          console.log('No session, clearing user data');
          setUser(null);
          setSession(null);
          setProfile(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error in setData:', error);
      }
    };

    const createDefaultProfile = async (userId: string, email?: string) => {
      try {
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: email?.split('@')[0] || 'User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (error) {
          console.error('Error creating default profile:', error);
        } else {
          console.log('Default profile created successfully');
          // 重新获取 profile
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (newProfile && mounted) {
            setProfile(newProfile);
          }
        }
      } catch (error) {
        console.error('Error in createDefaultProfile:', error);
      }
    };

    // 设置认证状态监听器
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, !!session?.user);
        
        // 对于某些事件，延迟处理以避免竞态条件
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setTimeout(async () => {
            if (mounted) {
              setIsLoading(true);
              await setData(session);
              setIsLoading(false);
            }
          }, 100);
        } else {
          setIsLoading(true);
          await setData(session);
          setIsLoading(false);
        }
      }
    );

    // 检查现有会话
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          return;
        }
        
        if (mounted) {
          await setData(session);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (!error && data) {
        setProfile(data);
        console.log('Profile refreshed successfully');
      } else if (error) {
        console.error('Error refreshing profile:', error);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const checkAdminStatus = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // 重新获取用户会话以确保最新的元数据
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error checking session:', error);
        return false;
      }
      
      const currentIsAdmin = Boolean(session?.user?.app_metadata?.is_admin);
      setIsAdmin(currentIsAdmin);
      
      console.log('Admin status checked:', currentIsAdmin);
      return currentIsAdmin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsAuthenticating(true);
      console.log('Starting sign in process for:', email);
      
      // 清理现有认证状态
      try {
        await supabase.auth.signOut();
        // 清理本地存储
        localStorage.removeItem('supabase.auth.token');
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
      } catch {
        // 忽略清理错误
      }
      
      const result = await signInWithEmailPassword(email, password);
      
      if (result.success && result.data?.user) {
        console.log('Sign in successful, waiting for auth state update...');
        
        // 等待认证状态更新
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 检查管理员状态
        const isAdminUser = Boolean(result.data.user.app_metadata?.is_admin);
        setIsAdmin(isAdminUser);
        
        toast.success('登录成功');
        return true;
      } else {
        const errorMsg = result.error?.message || '登录失败';
        console.error('Sign in failed:', errorMsg);
        toast.error(errorMsg);
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || '登录失败');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signUp = async (email: string, password: string, metadata?: { [key: string]: any }) => {
    try {
      setIsAuthenticating(true);
      console.log('Starting sign up process for:', email);
      
      const result = await signUpWithEmailPassword(email, password, { 
        metadata,
        redirectTo: `${window.location.origin}/`
      });
      
      if (result.success) {
        toast.success('注册成功，请验证您的邮箱');
        return true;
      } else {
        const errorMsg = result.error?.message || '注册失败';
        console.error('Sign up failed:', errorMsg);
        toast.error(errorMsg);
        return false;
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || '注册失败');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logOut = async () => {
    try {
      console.log('Starting logout process...');
      
      // 立即清理本地状态
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(false);
      
      // 清理本地存储
      localStorage.removeItem('supabase.auth.token');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // 执行退出
      const result = await authSignOut();
      
      if (result.success) {
        toast.success('退出成功');
        // 强制页面刷新以清理所有状态
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      } else {
        console.error('Logout failed:', result.error);
        toast.error('退出失败，请重试');
        // 即使退出失败也清理本地状态并重定向
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || '退出失败');
      // 强制清理状态并重定向
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  };

  // 添加 signOut 作为 logOut 的别名
  const signOut = logOut;

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return false;
    
    try {
      console.log('Updating profile for user:', user.id);
      
      // 创建一个新对象，只包含有效的 profile 属性
      const profileData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      
      // 复制有效属性
      const validFields = [
        'full_name', 'username', 'bio', 'contact_email', 'contact_phone',
        'company_name', 'custom_url', 'avatar_url'
      ];
      
      validFields.forEach(field => {
        if (field in data && data[field as keyof UserProfile] !== undefined) {
          profileData[field] = data[field as keyof UserProfile];
        }
      });
      
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);
      
      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }
      
      // 更新本地资料状态
      setProfile((prev) => prev ? { ...prev, ...profileData } : null);
      
      toast.success('个人资料更新成功');
      console.log('Profile updated successfully');
      return true;
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || '更新个人资料失败');
      return false;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsAuthenticating(true);
      console.log('Requesting password reset for:', email);
      
      const result = await resetUserPassword(email);
      
      if (result.success) {
        toast.success('重置密码链接已发送到您的邮箱');
        return true;
      } else {
        // 修复第414行的错误 - 正确访问错误信息
        const errorMsg = result.error || '发送重置密码邮件失败';
        console.error('Password reset failed:', errorMsg);
        toast.error(errorMsg);
        return false;
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || '发送重置密码邮件失败');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const contextValue = {
    user,
    session,
    profile,
    isLoading,
    signIn,
    signUp,
    logOut,
    signOut,
    updateProfile,
    isAdmin,
    resetPassword,
    checkAdminStatus,
    refreshProfile,
    isAuthenticating
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
