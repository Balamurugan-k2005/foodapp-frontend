import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance, { setAccessToken } from '../api/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile if we have an active access token
  const fetchProfile = async () => {
    try {
      const response = await axiosInstance.get('/api/users/profile');
      if (response.data && response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      logout();
    }
  };

  // Attempt session recovery on boot
  useEffect(() => {
    const initializeAuth = async () => {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (storedRefreshToken) {
        try {
          const response = await axiosInstance.post('/api/auth/refresh-token', {
            refreshToken: storedRefreshToken,
          });
          if (response.data && response.data.success) {
            const { accessToken, refreshToken, role, email, userId } = response.data.data;
            setAccessToken(accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            setUser({ id: userId, email, role });
            // Fetch complete profile details asynchronously
            axiosInstance.get('/api/users/profile')
              .then(res => {
                if (res.data && res.data.success) {
                  setUser(res.data.data);
                }
              })
              .catch(err => console.error(err));
          }
        } catch (error) {
          console.warn('Session recovery failed:', error);
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen to token expiration events from Axios interceptor
    const handleAuthExpired = () => {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('refreshToken');
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/api/auth/login', { email, password });
      if (response.data && response.data.success) {
        const { accessToken, refreshToken, role, email: userEmail, userId } = response.data.data;
        setAccessToken(accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser({ id: userId, email: userEmail, role });
        
        // Load full profile details (like name, phone, address list)
        const profileResponse = await axiosInstance.get('/api/users/profile');
        if (profileResponse.data && profileResponse.data.success) {
          setUser(profileResponse.data.data);
        }
        return response.data.data;
      }
      throw new Error(response.data?.message || 'Login failed');
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const register = async (name, email, password, phone, role = 'CUSTOMER') => {
    try {
      const response = await axiosInstance.post('/api/auth/register', {
        name,
        email,
        password,
        phone,
        role,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/api/auth/logout');
    } catch (e) {
      console.warn('Logout request error:', e);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('refreshToken');
    }
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
