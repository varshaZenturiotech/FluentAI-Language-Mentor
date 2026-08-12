export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  nativeLanguage: string;
  learningLanguage: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  joinedDate: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
  nativeLanguage: string;
  learningLanguage: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}
