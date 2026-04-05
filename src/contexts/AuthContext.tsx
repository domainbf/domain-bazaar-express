import { createContext, useState, useContext, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '@/types/userProfile';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface AppUser {
  id: string;
  email: string;
  is_admin?: boolean;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}

export interface AppSession {
  access_token: string;
  refresh_token: string;
  user: AppUser;
}

interface AuthContextType {
  user: AppUser | null;
  session: AppSession | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<boolean>;
  logOut: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  isAdmin: boolean;
  checkAdminStatus: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  isAuthenticating?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<AppSession | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const mountedRef = useRef(true);

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) return null;
      return data as UserProfile;
    } catch {
      return null;
    }
  }, []);

  const checkIsAdmin = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      if (error) return false;
      return (data?.length ?? 0) > 0;
    } catch {
      return false;
    }
  }, []);

  const applySession = useCallback(async (supaSession: any) => {
    if (!supaSession?.user) {
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(false);
      return;
    }
    const u = supaSession.user;
    const adminStatus = await checkIsAdmin(u.id);
    const appUser: AppUser = {
      id: u.id,
      email: u.email ?? '',
      is_admin: adminStatus,
      user_metadata: u.user_metadata ?? {},
      app_metadata: u.app_metadata ?? {},
    };
    const appSession: AppSession = {
      access_token: supaSession.access_token,
      refresh_token: supaSession.refresh_token,
      user: appUser,
    };
    const prof = await fetchProfile(u.id);
    if (!mountedRef.current) return;
    setUser(appUser);
    setSession(appSession);
    setProfile(prof);
    setIsAdmin(adminStatus);
  }, [checkIsAdmin, fetchProfile]);

  // Listen to auth state changes
  useEffect(() => {
    mountedRef.current = true;

    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, supaSession) => {
        if (!mountedRef.current) return;
        await applySession(supaSession);
        if (mountedRef.current) setIsLoading(false);
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(async ({ data: { session: supaSession } }) => {
      if (!mountedRef.current) return;
      await applySession(supaSession);
      if (mountedRef.current) setIsLoading(false);
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const prof = await fetchProfile(user.id);
    if (prof) setProfile(prof);
  }, [user, fetchProfile]);

  const checkAdminStatus = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    const status = await checkIsAdmin(user.id);
    setIsAdmin(status);
    return status;
  }, [user, checkIsAdmin]);

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsAuthenticating(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      toast.success('登录成功');
      return true;
    } catch (error: unknown) {
      const msg = (error as Error).message || '登录失败';
      throw new Error(msg);
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ): Promise<boolean> => {
    try {
      setIsAuthenticating(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata ? { full_name: metadata.full_name } : undefined,
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw new Error(error.message);
      toast.success('注册成功，欢迎加入！');
      return true;
    } catch (error: unknown) {
      throw new Error((error as Error).message || '注册失败');
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const logOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(false);
      toast.success('已退出登录');
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const signOut = logOut;

  const updateProfile = useCallback(async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data as any)
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('个人资料更新成功');
      return true;
    } catch (error: unknown) {
      toast.error((error as Error).message || '更新个人资料失败');
      return false;
    }
  }, [user, refreshProfile]);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      setIsAuthenticating(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('如果该邮箱已注册，您将收到重置密码邮件');
      return true;
    } catch (error: unknown) {
      toast.error((error as Error).message || '发送重置密码邮件失败');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const contextValue: AuthContextType = {
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
    isAuthenticating,
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
