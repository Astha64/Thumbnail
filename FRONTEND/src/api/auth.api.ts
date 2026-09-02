import { apiClient } from './client';
import { UserSignup, UserLogin, UserResponse, TokenResponse } from '../types/api';

/**
 * Authentication API Service functions connecting to FastAPI backend
 */
export const authApi = {
  /**
   * Calls POST /auth/signup
   * Returns UserResponse { id, email } on success (HTTP 201)
   */
  signup: async (data: UserSignup): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>('/auth/signup', data);
    return response.data;
  },

  /**
   * Calls POST /auth/login
   * Returns TokenResponse { access_token, token_type } on success (HTTP 200)
   */
  login: async (data: UserLogin): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/login', data);
    return response.data;
  },
};
