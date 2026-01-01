import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  name: string;
  family_id: number | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  updateToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      console.log('[Auth] Token loaded from localStorage');
    } else {
      console.log('[Auth] No token found in localStorage');
    }
    
    setLoading(false);
  }, []);

  // Axios request interceptor - always log Authorization header
  useEffect(() => {
    const reqId = axios.interceptors.request.use((config) => {
      const authHeader = config.headers?.['Authorization'] || config.headers?.common?.['Authorization'] || axios.defaults.headers.common['Authorization'];
      console.log('[HTTP] →', config.method?.toUpperCase(), config.url, authHeader ? '✓ Auth' : '✗ No Auth');
      return config;
    });
    
    const resId = axios.interceptors.response.use(
      (res) => {
        return res;
      },
      (error) => {
        if (error.response?.status === 401) {
          console.warn('[HTTP] 401 Unauthorized - Token may be invalid or expired');
          // Clear token and user, redirect will happen via PrivateRoute
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
          // Don't redirect here - let PrivateRoute handle it
        }
        return Promise.reject(error);
      }
    );
    
    return () => {
      axios.interceptors.request.eject(reqId);
      axios.interceptors.response.eject(resId);
    };
  }, []); // Note: setUser and setToken are stable, but we include them in the dependency array conceptually

  const login = async (email: string, password: string) => {
    const response = await axios.post('/api/auth/login', { email, password });
    const { user, token } = response.data;
    
    setUser(user);
    setToken(token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await axios.post('/api/auth/register', { email, password, name });
    const { user, token } = response.data;
    
    setUser(user);
    setToken(token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const updateToken = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, updateToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

