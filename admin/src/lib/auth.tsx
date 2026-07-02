import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, ApiError, TOKEN_KEY } from './api';

export type User = {
  id: string;
  username: string;
  email: string;
  role: string;
};

const USER_KEY = 'hakikaride_admin_user';

type LoginResponse = { token: string; id: string; username: string; email: string; role: string };

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<LoginResponse>('/auth/login', { email, password }, { auth: false });
      if (res.role !== 'admin') {
        throw new ApiError('This account does not have admin access.', 403);
      }
      const nextUser: User = { id: res.id, username: res.username, email: res.email, role: res.role };
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
      return nextUser;
    },
    [],
  );

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
