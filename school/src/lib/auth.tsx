import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, TOKEN_KEY } from './api';

export type User = {
  id: string;
  username: string;
  email: string;
  role: 'school_admin';
};

const USER_KEY = 'hakikaride_school_user';

type LoginResponse = { token: string; id: string; username: string; email: string; role: 'school_admin' };

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (username: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (resetToken: string, newPassword: string) => Promise<void>;
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

  const persist = useCallback((token: string, nextUser: User) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<LoginResponse>('/auth/login', { email, password }, { auth: false });
      const nextUser: User = { id: res.id, username: res.username, email: res.email, role: res.role };
      persist(res.token, nextUser);
      return nextUser;
    },
    [persist],
  );

  const signup = useCallback(
    async (username: string, email: string, password: string) => {
      await api.post('/auth/signup', { username, email, password, role: 'school_admin' }, { auth: false });
      return login(email, password);
    },
    [login],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword });
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await api.post('/auth/forgot-password', { email }, { auth: false });
  }, []);

  const resetPassword = useCallback(async (resetToken: string, newPassword: string) => {
    await api.post('/auth/reset-password', { token: resetToken, new_password: newPassword }, { auth: false });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, changePassword, forgotPassword, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
