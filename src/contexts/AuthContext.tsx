import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  email: string;
  role: string;
  location?: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile) {
            const userData = {
              email: profile.email,
              role: profile.role,
              location: profile.location,
              fullName: profile.full_name
            };
            setUser(userData);

            const loginData = {
              user: userData,
              timestamp: Date.now(),
              expiresIn: 30 * 24 * 60 * 60 * 1000
            };
            localStorage.setItem('staffManagementLogin', JSON.stringify(loginData));
          }
        } else {
          setUser(null);
          localStorage.removeItem('staffManagementLogin');
        }
      })();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const savedLogin = localStorage.getItem('staffManagementLogin');

      if (savedLogin) {
        const loginData = JSON.parse(savedLogin);
        const isExpired = Date.now() - loginData.timestamp > loginData.expiresIn;

        if (!isExpired) {
          setUser(loginData.user);
          setLoading(false);
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          const userData = {
            email: profile.email,
            role: profile.role,
            location: profile.location,
            fullName: profile.full_name
          };
          setUser(userData);

          const loginData = {
            user: userData,
            timestamp: Date.now(),
            expiresIn: 30 * 24 * 60 * 60 * 1000
          };
          localStorage.setItem('staffManagementLogin', JSON.stringify(loginData));
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('staffManagementLogin');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
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
