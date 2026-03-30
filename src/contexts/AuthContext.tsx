import { createContext, useState, useContext, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '@/types/userProfile';
import { toast } from 'sonner';
import { apiPost, apiGet, apiPatch, saveTokens, clearTokens, loadTokens, getAccessToken, getRefreshToken } from '@/lib/apiClient';
import { realtimeClient } from '@/lib/realtime';

// Minimal User & Session types that match Supabase's interface
// so existing components require zero changes
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

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AppUser;
  profile: UserProfile | null;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<AppSession | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const mountedRef = useRef(true);

  const applyAuthResponse = useCallback((res: AuthResponse) => {
    saveTokens(res.accessToken, res.refreshToken);
    const appUser: AppUser = { ...res.user, user_metadata: {}, app_metadata: {} };
    const appSession: AppSession = {
      access_token: res.accessToken,
      refresh_token: res.refreshToken,
      user: appUser,
    };
    setUser(appUser);
    setSession(appSession);
    setProfile(res.profile);
    setIsAdmin(res.user.is_admin || false);
    realtimeClient.resume();
  }, []);

  const clearAuth = useCallback(() => {
    clearTokens();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    realtimeClient.stop();
  }, []);

  // Restore session from stored tokens on mount
  useEffect(() => {
    mountedRef.current = true;
    loadTokens();
    const at = getAccessToken();
    if (!at) {
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const data = await apiGet<{ user: AppUser; profile: UserProfile }>('/auth/me');
        if (!mountedRef.current) return;
        const rt = getRefreshToken() || '';
        applyAuthResponse({
          accessToken: at,
          refreshToken: rt,
          user: data.user,
          profile: data.profile,
        });
      } catch {
        clearAuth();
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    })();

    return () => { mountedRef.current = false; };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiGet<{ user: AppUser; profile: UserProfile }>('/auth/me');
      setProfile(data.profile);
    } catch {
      console.error('Failed to refresh profile');
    }
  }, [user]);

  const checkAdminStatus = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    const adminStatus = user.is_admin || false;
    setIsAdmin(adminStatus);
    return adminStatus;
  }, [user]);

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsAuthenticating(true);
      const res = await apiPost<AuthResponse>('/auth/login', { email, password });
      applyAuthResponse(res);
      toast.success('登录成功');
      return true;
    } catch (error: unknown) {
      const msg = (error as Error).message || '登录失败';
      throw new Error(msg);
    } finally {
      setIsAuthenticating(false);
    }
  }, [applyAuthResponse]);

  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ): Promise<boolean> => {
    try {
      setIsAuthenticating(true);
      const res = await apiPost<AuthResponse>('/auth/register', {
        email,
        password,
        full_name: metadata?.full_name as string | undefined,
      });
      applyAuthResponse(res);
      toast.success('注册成功，欢迎加入！');
      return true;
    } catch (error: unknown) {
      throw new Error((error as Error).message || '注册失败');
    } finally {
      setIsAuthenticating(false);
    }
  }, [applyAuthResponse]);

  const logOut = useCallback(async () => {
    try {
      const rt = getRefreshToken();
      await apiPost('/auth/logout', { refreshToken: rt }).catch(() => {});
    } finally {
      clearAuth();
      toast.success('已退出登录');
      navigate('/', { replace: true });
    }
  }, [clearAuth, navigate]);

  const signOut = logOut;

  const updateProfile = useCallback(async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await apiPatch<{ profile: UserProfile }>('/auth/profile', data);
      setProfile(res.profile);
      toast.success('个人资料更新成功');
      return true;
    } catch (error: unknown) {
      toast.error((error as Error).message || '更新个人资料失败');
      return false;
    }
  }, [user]);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      setIsAuthenticating(true);
      await apiPost('/auth/request-reset', { email });
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
