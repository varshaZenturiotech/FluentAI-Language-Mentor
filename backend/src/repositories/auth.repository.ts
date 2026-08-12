import { IAuthRepository } from '../interfaces/auth.interface';
import { prisma } from '../database/prisma';
import { User, Profile, EmailVerificationToken } from '@prisma/client';

export { User, Profile, EmailVerificationToken };

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  nativeLanguage: string;
  learningLanguage: string;
}

export interface CreateVerificationTokenData {
  hashedToken: string;
  expiresAt: Date;
}

export class AuthRepository implements IAuthRepository {
  private readonly prisma = prisma;

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async createUser(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.passwordHash,
        nativeLanguage: data.nativeLanguage,
        learningLanguage: data.learningLanguage,
      },
    });
  }

  async createProfile(userId: string): Promise<Profile> {
    return this.prisma.profile.create({
      data: {
        userId,
        dailyGoalMinutes: 15,
        currentStreak: 0,
        totalXP: 0,
      },
    });
  }

  async createEmailVerificationToken(
    userId: string,
    data: CreateVerificationTokenData
  ): Promise<EmailVerificationToken> {
    return this.prisma.emailVerificationToken.create({
      data: {
        userId,
        token: data.hashedToken,
        expiresAt: data.expiresAt,
      },
    });
  }

  /**
   * Executes creation of User, Profile, and EmailVerificationToken atomically in a Prisma transaction.
   */
  async createRegistrationData(
    userData: CreateUserData,
    tokenData: CreateVerificationTokenData
  ): Promise<{ user: User; profile: Profile; verificationToken: EmailVerificationToken }> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: userData.passwordHash,
          nativeLanguage: userData.nativeLanguage,
          learningLanguage: userData.learningLanguage,
        },
      });

      const profile = await tx.profile.create({
        data: {
          userId: user.id,
          dailyGoalMinutes: 15,
          currentStreak: 0,
          totalXP: 0,
        },
      });

      const verificationToken = await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          token: tokenData.hashedToken,
          expiresAt: tokenData.expiresAt,
        },
      });

      return { user, profile, verificationToken };
    });
  }

  async createRefreshToken(data: { token: string; userId: string; expiresAt: Date }): Promise<any> {
    return this.prisma.refreshToken.create({
      data: {
        token: data.token,
        userId: data.userId,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findRefreshToken(token: string): Promise<any> {
    return this.prisma.refreshToken.findUnique({
      where: { token },
    });
  }

  async deleteRefreshToken(token: string): Promise<any> {
    try {
      return await this.prisma.refreshToken.delete({
        where: { token },
      });
    } catch (e) {
      // If already deleted/revoked, return null or handle gracefully
      return null;
    }
  }
}
