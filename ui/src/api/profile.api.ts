import apiClient from './axios';
import { UserProfile } from '../types/user';

export const profileApi = {
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get('/profile');
    return response.data.data;
  },

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await apiClient.put('/profile', data);
    return response.data.data;
  },

  async deleteAccount(): Promise<void> {
    await apiClient.delete('/profile');
  },
};
