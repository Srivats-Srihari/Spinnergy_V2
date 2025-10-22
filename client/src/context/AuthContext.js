// client/src/context/AuthContext.js
import React, { createContext, useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  useEffect(() => {
    if (token && !user) {
      // fetch profile
      (async () => {
        try {
          const data = await apiFetch('/auth/profile', { token, method: 'GET' });
          setUser(data);
        } catch (err) {
          console.warn('Profile fetch failed:', err.message);
          // optional: clear token if invalid
          // localStorage.removeItem('token'); setToken(null);
        }
      })();
    }
  }, [token]);

  function login(userData, jwtToken) {
    localStorage.setItem('token', jwtToken);
    setToken(jwtToken);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
