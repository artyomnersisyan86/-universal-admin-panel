import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient, setAuthToken, getAuthToken } from '@shared/lib/apiClient';
import type { User } from '@shared/types';
import { AuthContext, type AuthContextValue } from './AuthContext';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }
    apiClient
      .get<User>('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => setAuthToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiClient.post<{ token: string; user: User }>('/auth/login', {
      email,
      password,
    });
    setAuthToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    window.location.assign('/login');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
