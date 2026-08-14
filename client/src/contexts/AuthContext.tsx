import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, getSession } from '@client/src/api/auth';
import { axiosForBackend } from '@/lib/lark-shim/http';
import type { SessionResponse } from '@shared/auth';

const TOKEN_KEY = 'auth_token';

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]!));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000 - 30000;
  } catch {
    return true;
  }
}

axiosForBackend.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['X-Auth-Token'] = token;
    }
  } catch {
    // silent
  }
  return config;
});

interface AuthUser {
  userId: string;
  username: string;
  displayName: string;
  region: string;
  roles: string[];
  avatar?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token && isTokenExpired(token)) {
        localStorage.removeItem(TOKEN_KEY);
      }
      const freshToken = localStorage.getItem(TOKEN_KEY);
      if (freshToken) {
        try {
          const session: SessionResponse = await getSession(freshToken);
          setUser({
            userId: session.userId,
            username: session.username,
            displayName: session.displayName,
            region: session.region,
            roles: session.roles,
          });
          setIsLoading(false);
          return;
        } catch {
          localStorage.removeItem(TOKEN_KEY);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await apiLogin({ username, password });
      localStorage.setItem(TOKEN_KEY, result.token);
      setUser({
        userId: result.user.userId,
        username: result.user.username,
        displayName: result.user.displayName,
        region: result.user.region,
        roles: result.user.roles,
      });
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const hasRole = useCallback(
    (role: string) => {
      return user?.roles?.includes(role) ?? false;
    },
    [user],
  );

  const hasAnyRole = useCallback(
    (roles: string[]) => {
      return roles.some((role) => user?.roles?.includes(role));
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
        hasAnyRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAppAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAppAuth must be used within AuthProvider');
  }
  return context;
}
