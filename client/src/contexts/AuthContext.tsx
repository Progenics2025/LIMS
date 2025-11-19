import { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const response = await apiRequest('POST', '/api/auth/login', { email, password });
    const data = await response.json();
    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const hasRole = (roles: string | string[]) => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Periodically refresh the stored user's latest status from server to detect admin lock
  useEffect(() => {
    let mounted = true;
    let intervalId: any = null;

    const refresh = async () => {
      if (!mounted) return;
      const stored = localStorage.getItem('user');
      if (!stored) return;
      try {
        const parsed = JSON.parse(stored) as User;
        // Fetch fresh user data from server
        const res = await fetch(`/api/users/${parsed.id}`, { credentials: 'include' });
        if (res.status === 200) {
          const data = await res.json();
          if (!data.isActive) {
            // Admin has locked the user - force logout
            setUser(null);
            localStorage.removeItem('user');
          } else {
            // Update local copy if changed
            setUser((u) => (u && u.id === data.id ? { ...u, ...data } : u));
            localStorage.setItem('user', JSON.stringify(data));
          }
        } else if (res.status === 404) {
          // server no longer has user - logout
          setUser(null);
          localStorage.removeItem('user');
        }
      } catch (err) {
        // Ignore network errors silently; we'll try again later
      }
    };

    // Start interval only if there's a stored user
    if (localStorage.getItem('user')) {
      // immediate check and then every 30 seconds
      refresh();
      intervalId = setInterval(refresh, 30_000);
    }

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
