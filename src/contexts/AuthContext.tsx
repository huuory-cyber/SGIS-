import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getCurrentUser } from '../lib/supabase';
import { AuthState, UserProfile } from '../types';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ user: User; profile: UserProfile }>;
  signUp: (email: string, password: string, fullName: string, role: 'provider' | 'agent') => Promise<any>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Check for existing session on mount
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        setAuthState({
          user: profile,
          isAuthenticated: profile?.is_active ?? false,
          isLoading: false,
        });
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const result = await getCurrentUser();
      if (result && result.profile) {
        setAuthState({
          user: result.profile,
          isAuthenticated: result.profile.is_active,
          isLoading: false,
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (!profile) throw new Error('Profile not found');
      if (!profile.is_active) throw new Error('Account is not active. Please wait for admin approval.');

      setAuthState({
        user: profile,
        isAuthenticated: true,
        isLoading: false,
      });

      return { user: data.user, profile };
    }

    throw new Error('Sign in failed');
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'provider' | 'agent') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          role,
          is_active: false, // Requires admin approval
        });

      if (profileError) throw profileError;
    }

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const refreshUser = async () => {
    await checkUser();
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
