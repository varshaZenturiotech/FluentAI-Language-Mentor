export interface UserPayload {
  id: string;
  email: string;
  name: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  nativeLanguage: string;
  learningLanguage: string;
  level: string;
  isEmailVerified: boolean;
}
