import { Request } from 'express';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { TokenPair, CurrentUser } from '../types/auth.types';

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export interface RegisteredUserData {
  id: string;
  name: string;
  email: string;
  nativeLanguage: string;
  learningLanguage: string;
}

export interface IAuthService {
  register(dto: RegisterDto): Promise<RegisteredUserData>;
  login(dto: LoginDto): Promise<{ user: CurrentUser; tokens: TokenPair }>;
  logout(userId: string, refreshToken: string): Promise<void>;
  refresh(refreshToken: string): Promise<TokenPair>;
  getCurrentUser(userId: string): Promise<CurrentUser>;
}

export interface IAuthRepository {
  findUserByEmail(email: string): Promise<unknown>;
  findUserById(id: string): Promise<unknown>;
  createUser(data: unknown): Promise<unknown>;
  createRefreshToken(data: unknown): Promise<unknown>;
  findRefreshToken(token: string): Promise<unknown>;
  deleteRefreshToken(token: string): Promise<unknown>;
}
