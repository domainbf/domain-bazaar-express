
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/userProfile';
import { toast } from 'sonner';
import { signInUser, signUpUser, signOutUser, resetUserPassword, verifyAdminRole } from '@/utils/authUtils';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticating: boolean;  // New state for tracking authentication attempts
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, userData?: any) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  checkAdminStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      setProfile(data);
      
      // Check admin status
      checkAdminStatus();
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load user profile');
    }
  };
  
  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return false;
    }
    
    const adminStatus = await verifyAdminRole();
    setIsAdmin(adminStatus);
    return adminStatus;
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          await refreshProfile();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        toast.error('Authentication error');
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await refreshProfile();
        } else {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const signIn = async (email: string, password: string) => {
    setIsAuthenticating(true);
    try {
      const result = await signInUser(email, password);
      if (result && user) {
        await checkAdminStatus();
      }
      return result;
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  const signUp = async (email: string, password: string, userData?: any) => {
    setIsAuthenticating(true);
    try {
      const result = await signUpUser(email, password, userData);
      return result;
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  const signOut = async () => {
    try {
      await signOutUser();
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };
  
  const resetPassword = async (email: string) => {
    setIsAuthenticating(true);
    try {
      return await resetUserPassword(email);
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        profile, 
        isAdmin, 
        isLoading,
        isAuthenticating, 
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshProfile,
        checkAdminStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
