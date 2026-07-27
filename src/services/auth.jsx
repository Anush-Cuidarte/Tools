import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!api.token) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.me();
      setUser(data.user);
      setProfile(data.profile);
      try {
        const info = await api.userInfo();
        setUserInfo(info);
      } catch {
        setUserInfo(null);
      }
    } catch {
      api.clearToken();
      setUser(null);
      setProfile(null);
      setUserInfo(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUser();

    const handler = () => {
      setUser(null);
      setProfile(null);
      setUserInfo(null);
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [loadUser]);

  const login = async (credentials) => {
    const data = await api.login(credentials);
    api.setToken(data.token);
    setUser(data.user);
    setProfile(data.profile);
    const info = await api.userInfo();
    setUserInfo(info);
    return data;
  };

  const register = async (data) => {
    const result = await api.register(data);
    api.setToken(result.token);
    setUser(result.user);
    setProfile(result.profile);
    const info = await api.userInfo();
    setUserInfo(info);
    return result;
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
    setProfile(null);
    setUserInfo(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, userInfo, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export default AuthContext;
