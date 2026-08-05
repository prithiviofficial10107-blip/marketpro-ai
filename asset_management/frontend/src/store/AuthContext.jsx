import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// v1.1 - Added explicit error handling and session restore logic
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Use the api instance which has the baseURL set to http://localhost:5001/api
      const response = await api.get('/auth/me/');
      if (response.data && response.data.data) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error("Auth Session Restoration Failed:", error.response?.data || error.message);
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const auth = response.data.data;

      // Crucial: Set storage before state
      localStorage.setItem('token', auth.access_token);
      localStorage.setItem('refreshToken', auth.refresh_token);

      setUser(auth.user);
      return auth.user;
    } catch (err) {
      console.error("Login attempt failed:", err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const updateProfileState = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateProfileState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
