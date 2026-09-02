import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tokenStorage } from '../lib/token';
import { authApi } from '../api/auth.api';
import { UserSignup, UserLogin, UserResponse } from '../types/api';

interface AuthContextType {
  token: string | null;
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: UserLogin) => Promise<void>;
  signup: (data: UserSignup) => Promise<UserResponse>;
  logout: () => void;
  setUser: (user: UserResponse | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUserState] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronize state with localStorage on app mount
  useEffect(() => {
    const storedToken = tokenStorage.get();
    if (storedToken) {
      setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (data: UserLogin) => {
    const response = await authApi.login(data);
    tokenStorage.set(response.access_token);
    setToken(response.access_token);
  }, []);

  const signup = useCallback(async (data: UserSignup): Promise<UserResponse> => {
    return await authApi.signup(data);
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    setUserState(null);
  }, []);

  const setUser = useCallback((u: UserResponse | null) => {
    setUserState(u);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        isLoading,
        login,
        signup,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
