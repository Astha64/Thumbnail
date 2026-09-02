import { apiClient } from './client';
import { UserResponse } from '../types/api';

export const meApi = {
  getMe: async (): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>('/api/me');
    return response.data;
  },
};
