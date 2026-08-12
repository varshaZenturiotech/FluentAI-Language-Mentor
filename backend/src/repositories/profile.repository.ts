import { UpdateProfileDto } from '../dto/update-profile.dto';
import { prisma } from '../database/prisma';

/**
 * Shape of the combined profile data returned to callers.
 * Merges relevant User fields with the Profile record.
 * Sensitive fields (password, tokens) are never selected.
 */
export interface ProfileWithUser {
  id: string;
  name: string;
  email: string;
  nativeLanguage: string;
  learningLanguage: string;
  level: string;
  bio: string | null;
  country: string | null;
  timezone: string | null;
  dailyGoalMinutes: number;
  currentStreak: number;
  totalXP: number;
}

/**
 * Profile Repository
 *
 * Responsibility: Prisma data access ONLY.
 * No business logic. No error formatting. No HTTP concerns.
 */
export class ProfileRepository {
  private readonly prisma = prisma;

  /**
   * Retrieves a user's profile joined with their base user data.
   * Returns null if the profile record does not exist.
   */
  async findProfileByUserId(userId: string): Promise<ProfileWithUser | null> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            nativeLanguage: true,
            learningLanguage: true,
            level: true,
          },
        },
      },
    });

    if (!profile) return null;

    return {
      id: profile.user.id,
      name: profile.user.name,
      email: profile.user.email,
      nativeLanguage: profile.user.nativeLanguage,
      learningLanguage: profile.user.learningLanguage,
      level: profile.user.level,
      bio: profile.bio,
      country: profile.country,
      timezone: profile.timezone,
      dailyGoalMinutes: profile.dailyGoalMinutes,
      currentStreak: profile.currentStreak,
      totalXP: profile.totalXP,
    };
  }

  /**
   * Applies a partial update to both the User and Profile tables.
   * Fields that belong to the User model (name, nativeLanguage, learningLanguage)
   * are updated via the nested `user` relation on Profile.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<ProfileWithUser> {
    // Separate fields by their Prisma model ownership
    const { name, nativeLanguage, learningLanguage, ...profileFields } = dto;

    const userUpdate =
      name !== undefined || nativeLanguage !== undefined || learningLanguage !== undefined
        ? { name, nativeLanguage, learningLanguage }
        : undefined;

    const updated = await this.prisma.profile.update({
      where: { userId },
      data: {
        ...(profileFields.bio !== undefined && { bio: profileFields.bio }),
        ...(profileFields.country !== undefined && { country: profileFields.country }),
        ...(profileFields.timezone !== undefined && { timezone: profileFields.timezone }),
        ...(profileFields.dailyGoalMinutes !== undefined && {
          dailyGoalMinutes: profileFields.dailyGoalMinutes,
        }),
        ...(userUpdate && {
          user: {
            update: {
              ...(userUpdate.name !== undefined && { name: userUpdate.name }),
              ...(userUpdate.nativeLanguage !== undefined && {
                nativeLanguage: userUpdate.nativeLanguage,
              }),
              ...(userUpdate.learningLanguage !== undefined && {
                learningLanguage: userUpdate.learningLanguage,
              }),
            },
          },
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            nativeLanguage: true,
            learningLanguage: true,
            level: true,
          },
        },
      },
    });

    return {
      id: updated.user.id,
      name: updated.user.name,
      email: updated.user.email,
      nativeLanguage: updated.user.nativeLanguage,
      learningLanguage: updated.user.learningLanguage,
      level: updated.user.level,
      bio: updated.bio,
      country: updated.country,
      timezone: updated.timezone,
      dailyGoalMinutes: updated.dailyGoalMinutes,
      currentStreak: updated.currentStreak,
      totalXP: updated.totalXP,
    };
  }

  /**
   * Permanently deletes a user account and all associated data within a single
   * Prisma transaction to guarantee atomicity. Order of deletion matters to
   * satisfy foreign-key constraints before removing the User record itself.
   *
   * Deletion order:
   *  1. Profile
   *  2. RefreshTokens
   *  3. EmailVerificationTokens
   *  4. PasswordResetTokens
   *  5. User (parent record, deleted last)
   *
   * Note: Cascade deletes are configured on all child relations in the Prisma
   * schema (onDelete: Cascade), so deleting the User alone would also work,
   * but explicit deletion is retained here for auditability and clarity.
   */
  async deleteAccount(userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.profile.deleteMany({ where: { userId } });
      await tx.refreshToken.deleteMany({ where: { userId } });
      await tx.emailVerificationToken.deleteMany({ where: { userId } });
      await tx.passwordResetToken.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });
  }
}
