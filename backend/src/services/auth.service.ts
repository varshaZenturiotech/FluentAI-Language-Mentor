import { IAuthService } from '../interfaces/auth.interface';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { CurrentUser, TokenPair } from '../types/auth.types';
import { AuthRepository } from '../repositories/auth.repository';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateVerificationToken, generateRandomToken } from '../utils/token';
import { generateAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { HttpStatusCodes } from '../constants/httpStatusCodes';

export interface RegisteredUserData {
  id: string;
  name: string;
  email: string;
  nativeLanguage: string;
  learningLanguage: string;
}

export class AuthService implements IAuthService {
  private authRepository: AuthRepository;

  constructor(authRepository: AuthRepository = new AuthRepository()) {
    this.authRepository = authRepository;
  }

  async register(dto: RegisterDto): Promise<RegisteredUserData> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const name = dto.name.trim();
    const nativeLanguage = dto.nativeLanguage.trim();
    const learningLanguage = dto.learningLanguage.trim();

    // Check if user already exists
    const existingUser = await this.authRepository.findUserByEmail(normalizedEmail);
    if (existingUser) {
      throw new ApiError(HttpStatusCodes.CONFLICT, 'Email already registered.');
    }

    // Hash password with bcrypt (12 rounds)
    const passwordHash = await hashPassword(dto.password);

    // Generate 64-byte random verification token and SHA-256 hash it
    const { hashedToken } = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry

    // Execute atomic creation of User, Profile, and EmailVerificationToken
    const { user } = await this.authRepository.createRegistrationData(
      {
        name,
        email: normalizedEmail,
        passwordHash,
        nativeLanguage,
        learningLanguage,
      },
      {
        hashedToken,
        expiresAt,
      }
    );

    // Return safely filtered user data (never expose password or tokens)
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      nativeLanguage: user.nativeLanguage,
      learningLanguage: user.learningLanguage,
    };
  }

  async login(dto: LoginDto): Promise<{ user: CurrentUser; tokens: TokenPair }> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    // Find user
    const user = await this.authRepository.findUserByEmail(normalizedEmail);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    // Verify password
    const isPasswordValid = await comparePassword(dto.password, user.password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRandomToken(64);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiry

    // Save refresh token
    await this.authRepository.createRefreshToken({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    const currentUser: CurrentUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      nativeLanguage: user.nativeLanguage,
      learningLanguage: user.learningLanguage,
      level: user.level,
      isEmailVerified: user.isEmailVerified,
    };

    return {
      user: currentUser,
      tokens: { accessToken, refreshToken },
    };
  }

  async logout(_userId: string, refreshToken: string): Promise<void> {
    await this.authRepository.deleteRefreshToken(refreshToken);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const tokenRecord = await this.authRepository.findRefreshToken(refreshToken);
    if (!tokenRecord) {
      throw ApiError.unauthorized('Invalid refresh token.');
    }

    if (new Date(tokenRecord.expiresAt) < new Date()) {
      await this.authRepository.deleteRefreshToken(refreshToken);
      throw ApiError.unauthorized('Expired refresh token.');
    }

    const user = await this.authRepository.findUserById(tokenRecord.userId);
    if (!user) {
      throw ApiError.unauthorized('User not found.');
    }

    // Rotate refresh token
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const newRefreshToken = generateRandomToken(64);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiry

    await this.authRepository.deleteRefreshToken(refreshToken);
    await this.authRepository.createRefreshToken({
      token: newRefreshToken,
      userId: user.id,
      expiresAt,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async getCurrentUser(userId: string): Promise<CurrentUser> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new ApiError(HttpStatusCodes.NOT_FOUND, 'User not found.');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      nativeLanguage: user.nativeLanguage,
      learningLanguage: user.learningLanguage,
      level: user.level,
      isEmailVerified: user.isEmailVerified,
    };
  }
}
