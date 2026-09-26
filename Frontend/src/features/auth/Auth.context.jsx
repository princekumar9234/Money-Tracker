import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from './services/auth.service';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('moneytrace_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('moneytrace_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state by verifying token with backend
  const verifySession = useCallback(async () => {
    const savedToken = localStorage.getItem('moneytrace_token');
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const res = await authService.getMe();
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('moneytrace_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.warn('[Auth Context] Session validation failed:', err.message);
      // If unauthorized, clear state
      if (err.status === 401) {
        localStorage.removeItem('moneytrace_token');
        localStorage.removeItem('moneytrace_user');
        setUser(null);
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    const { user: userData, token: userToken } = res.data;

    setUser(userData);
    setToken(userToken);
    localStorage.setItem('moneytrace_token', userToken);
    localStorage.setItem('moneytrace_user', JSON.stringify(userData));

    return res.data;
  };

  const register = async (formData) => {
    const res = await authService.register(formData);
    return res.data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // Continue client cleanup even if request fails
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('moneytrace_token');
      localStorage.removeItem('moneytrace_user');
    }
  };

  const logoutAll = async () => {
    try {
      await authService.logoutAll();
    } catch (e) {
      // continue
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('moneytrace_token');
      localStorage.removeItem('moneytrace_user');
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authService.getMe();
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('moneytrace_user', JSON.stringify(res.data.user));
      }
      return res.data?.user;
    } catch (e) {
      return null;
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isEmailVerified: !!user?.isEmailVerified,
    login,
    register,
    logout,
    logoutAll,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
