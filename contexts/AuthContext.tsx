import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userType: 'customer' | 'restaurant' | 'delivery') => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  userType: 'customer' | 'restaurant' | 'delivery' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<'customer' | 'restaurant' | 'delivery' | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mountedRef.current) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Get user type from metadata, default to 'customer' if not set
        const userTypeFromMetadata = session.user.user_metadata?.user_type;
        const validUserTypes = ['customer', 'restaurant', 'delivery'];
        const finalUserType = validUserTypes.includes(userTypeFromMetadata) 
          ? userTypeFromMetadata 
          : 'customer';
        setUserType(finalUserType);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Get user type from metadata, default to 'customer' if not set
          const userTypeFromMetadata = session.user.user_metadata?.user_type;
          const validUserTypes = ['customer', 'restaurant', 'delivery'];
          const finalUserType = validUserTypes.includes(userTypeFromMetadata) 
            ? userTypeFromMetadata 
            : 'customer';
          setUserType(finalUserType);
        } else {
          setUserType(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userType: 'customer' | 'restaurant' | 'delivery') => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: userType,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      userType,
    }}>
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