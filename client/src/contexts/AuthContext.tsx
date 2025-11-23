import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { checkAuth, logout as apiLogout } from '../utils/api';

interface User {
  email: string;
  name: string;
  domain: string;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
  login: (provider?: 'google' | 'github' | 'gitlab') => void;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<void> => {
    // Bypass authentication in E2E test environment
    if (import.meta.env.VITE_E2E_TEST === 'true') {
      setUser({
        email: 'test@example.com',
        name: 'Test User',
        domain: 'example.com'
      });
      setAuthenticated(true);
      setLoading(false);
      return;
    }

    try {
      const response = await checkAuth();
      if (response.data.authenticated) {
        setUser(response.data.user);
        setAuthenticated(true);
      } else {
        setUser(null);
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = (provider: 'google' | 'github' | 'gitlab' = 'google'): void => {
    // Redirect to OAuth provider (proxied to backend by Vite in dev)
    window.location.href = `/auth/${provider}`;
  };

  const logout = async (): Promise<void> => {
    try {
      await apiLogout();
      setUser(null);
      setAuthenticated(false);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    authenticated,
    login,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
