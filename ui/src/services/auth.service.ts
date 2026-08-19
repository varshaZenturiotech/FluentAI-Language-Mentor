import { User, LoginCredentials, RegisterPayload } from '../types/auth';
import { delay } from './apiClient';

const MOCK_USER: User = {
  id: 'user_12345',
  name: 'Rahul',
  email: 'rahul@fluentai.app',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  nativeLanguage: 'Malayalam',
  learningLanguage: 'English',
  level: 'Intermediate',
  joinedDate: 'August 2026',
};

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    await delay(800);
    if (!credentials.email) {
      throw new Error('Email is required');
    }
    return {
      user: { ...MOCK_USER, email: credentials.email },
      token: 'jwt_mock_token_fluent_ai_987654321',
    };
  },

  async register(payload: RegisterPayload): Promise<{ user: User; token: string }> {
    await delay(1000);
    
    let matchedLevel: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner';
    if (payload.level) {
      const lvl = payload.level.toLowerCase();
      if (lvl === 'beginner') matchedLevel = 'Beginner';
      else if (lvl === 'intermediate') matchedLevel = 'Intermediate';
      else if (lvl === 'advanced') matchedLevel = 'Advanced';
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: payload.name,
      email: payload.email,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(payload.name)}`,
      nativeLanguage: payload.nativeLanguage || 'Malayalam',
      learningLanguage: payload.learningLanguage || 'English',
      level: matchedLevel,
      joinedDate: 'Just now',
    };
    return {
      user: newUser,
      token: 'jwt_mock_token_new_user',
    };
  },

  async logout(): Promise<void> {
    await delay(300);
  },

  async getCurrentUser(): Promise<User> {
    await delay(400);
    return MOCK_USER;
  },
};
