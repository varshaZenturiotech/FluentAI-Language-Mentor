import { prisma } from '../database/prisma';
import { LearningProfileDto } from '../dto/learning-profile.dto';

export interface LearningProfileWithRelations {
  id: string;
  userId: string;
  ageGroup: string | null;
  occupation: string | null;
  englishLevel: string;
  nativeLanguage: string;
  dailyGoal: number;
  onboardingCompleted: boolean;
  goals: string[];
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class LearningProfileRepository {
  private readonly prisma = prisma;

  async findProfileByUserId(userId: string): Promise<LearningProfileWithRelations | null> {
    const profile = await this.prisma.learningProfile.findUnique({
      where: { userId },
      include: {
        goals: true,
        interests: true,
      },
    });

    if (!profile) return null;

    return {
      id: profile.id,
      userId: profile.userId,
      ageGroup: profile.ageGroup,
      occupation: profile.occupation,
      englishLevel: profile.englishLevel,
      nativeLanguage: profile.nativeLanguage,
      dailyGoal: profile.dailyLearningGoal,
      onboardingCompleted: profile.onboardingCompleted,
      goals: profile.goals.map((g) => g.goal),
      interests: profile.interests.map((i) => i.interest),
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async upsertProfile(userId: string, dto: LearningProfileDto): Promise<LearningProfileWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      // Clean up existing goals and interests for user
      await tx.learningGoal.deleteMany({ where: { userId } });
      await tx.learningInterest.deleteMany({ where: { userId } });

      const profile = await tx.learningProfile.upsert({
        where: { userId },
        create: {
          userId,
          ageGroup: dto.ageGroup,
          occupation: dto.occupation,
          englishLevel: dto.englishLevel,
          nativeLanguage: dto.nativeLanguage,
          dailyLearningGoal: dto.dailyGoal,
          onboardingCompleted: true,
          goals: {
            create: dto.goals.map((g) => ({ goal: g })),
          },
          interests: {
            create: dto.interests.map((i) => ({ interest: i })),
          },
        },
        update: {
          ageGroup: dto.ageGroup,
          occupation: dto.occupation,
          englishLevel: dto.englishLevel,
          nativeLanguage: dto.nativeLanguage,
          dailyLearningGoal: dto.dailyGoal,
          onboardingCompleted: true,
          goals: {
            create: dto.goals.map((g) => ({ goal: g })),
          },
          interests: {
            create: dto.interests.map((i) => ({ interest: i })),
          },
        },
        include: {
          goals: true,
          interests: true,
        },
      });

      return {
        id: profile.id,
        userId: profile.userId,
        ageGroup: profile.ageGroup,
        occupation: profile.occupation,
        englishLevel: profile.englishLevel,
        nativeLanguage: profile.nativeLanguage,
        dailyGoal: profile.dailyLearningGoal,
        onboardingCompleted: profile.onboardingCompleted,
        goals: profile.goals.map((g) => g.goal),
        interests: profile.interests.map((i) => i.interest),
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      };
    }, {
      maxWait: 10000,
      timeout: 20000,
    });
  }
}
