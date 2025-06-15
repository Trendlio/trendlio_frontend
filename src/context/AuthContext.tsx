import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthAPI } from '@/api/auth';
import { User } from '@/types/index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import NetInfo from "@react-native-community/netinfo";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const isTokenValid = await AuthAPI.checkToken();
      if (isTokenValid) {
        const currentUser = await AuthAPI.getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkNetworkConnection = async () => {
    if (Platform.OS !== 'web') {
      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        throw new Error('No internet connection available');
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      await checkNetworkConnection();
      
      const maxRetries = 3;
      let attempt = 0;
      
      while (attempt < maxRetries) {
        try {
          const user = await AuthAPI.login({ email, password });
          setUser(user);
          router.replace('/(protected)/(tabs)/Home');
          return;
        } catch (error: any) {
          attempt++;
          if (attempt === maxRetries) throw error;
          // Wait for 1 second before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error?.message?.includes('Network Error')) {
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      await checkNetworkConnection();
      
      const maxRetries = 3;
      let attempt = 0;
      
      while (attempt < maxRetries) {
        try {
          await AuthAPI.register({ username, email, password });
          router.replace('/verify-email');
          return;
        } catch (error: any) {
          attempt++;
          if (attempt === maxRetries) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error?.message?.includes('Network Error')) {
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await AuthAPI.logout();
      setUser(null);
      router.replace('/login');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}