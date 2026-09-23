import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const userData = await authAPI.getMe();
          setUser(userData);
        } catch (err) {
          console.error("Auth init failed:", err);
          localStorage.removeItem('auth_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (username, password) => {
    setError(null);
    try {
      const data = await authAPI.login(username, password);
      localStorage.setItem('auth_token', data.access_token);
      
      const userData = await authAPI.getMe();
      setUser(userData);
      return true;
    } catch (err) {
      setError(err.message || "Login failed");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, isAuthenticated: !!user, isAdmin: user?.role === 'ADMIN' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
