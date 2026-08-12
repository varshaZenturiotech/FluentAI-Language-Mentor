import apiClient, { setAccessToken } from './axios';
import { User, LoginCredentials, RegisterPayload } from '../types/auth';

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken?: string;
  };
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<User> {
    const response = await apiClient.post('/auth/register', payload);
    return response.data.data.user || response.data.data;
  },

  async login(credentials: LoginCredentials): Promise<{ user: User; accessToken: string }> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    const { user, accessToken } = response.data.data;
    setAccessToken(accessToken);
    return { user, accessToken };
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  async refresh(): Promise<string> {
    const response = await apiClient.post('/auth/refresh');
    const { accessToken } = response.data.data;
    setAccessToken(accessToken);
    return accessToken;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get('/auth/me');
    return response.data.data.user || response.data.data;
  },
};
