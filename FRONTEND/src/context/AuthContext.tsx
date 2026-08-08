import React, { createContext, useContext, useState, useEffect } from 'react';
import { tokenStorage } from '../lib/token';
import { authApi } from '../api/auth.api';
import { UserSignup, UserLogin, UserResponse } from '../types/api';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: UserLogin) => Promise<void>;
  signup: (data: UserSignup) => Promise<UserResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronize state with localStorage on app mount
  useEffect(() => {
    const storedToken = tokenStorage.get();
    if (storedToken) {
      setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (data: UserLogin) => {
    const response = await authApi.login(data);
    tokenStorage.set(response.access_token);
    setToken(response.access_token);
  };

  const signup = async (data: UserSignup): Promise<UserResponse> => {
    return await authApi.signup(data);
  };

  const logout = () => {
    tokenStorage.clear();
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        signup,
        logout,
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
