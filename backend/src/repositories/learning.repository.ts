import { LanguageLevel } from '@prisma/client';
import { CreateVocabularyDto, UpdateVocabularyDto } from '../dto/vocabulary.dto';
import { CreateGrammarDto } from '../dto/grammar.dto';
import { CreateProgressDto } from '../dto/progress.dto';
import { prisma } from '../database/prisma';

// ==========================================
// RESULT TYPES
// ==========================================

export interface VocabularyResult {
  id: string;
  word: string;
  meaning: string;
  example: string | null;
  language: string;
  difficulty: LanguageLevel;
  mastered: boolean;
  reviewCount: number;
  lastReviewedAt: Date | null;
  nextReviewAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GrammarMistakeResult {
  id: string;
  sentence: string;
  correctSentence: string;
  explanation: string | null;
  grammarRule: string | null;
  mistakeType: string | null;
  createdAt: Date;
}

export interface LessonResult {
  id: string;
  title: string;
  description: string | null;
  level: LanguageLevel;
  language: string;
  estimatedMinutes: number;
  xpReward: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgressResult {
  id: string;
  lessonId: string;
  completed: boolean;
  score: number;
  xpEarned: number;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lesson: {
    id: string;
    title: string;
    level: LanguageLevel;
    language: string;
    xpReward: number;
  };
}

export interface VocabularyQuery {
  search?: string;
  sort?: 'newest' | 'oldest' | 'mastered' | 'needs_review';
  page?: number;
  limit?: number;
}

export interface LessonQuery {
  level?: LanguageLevel;
  language?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Learning Repository
 *
 * Responsibility: Prisma data access ONLY.
 * No business logic. No error formatting. No HTTP concerns.
 */
export class LearningRepository {
  private readonly prisma = prisma;

  // ==========================================
  // VOCABULARY
  // ==========================================

  async createVocabulary(userId: string, dto: CreateVocabularyDto): Promise<VocabularyResult> {
    return this.prisma.vocabulary.create({
      data: {
        userId,
        word: dto.word,
        meaning: dto.meaning,
        example: dto.example,
        language: dto.language,
        difficulty: dto.difficulty ?? 'BEGINNER',
      },
      select: this.vocabularySelect(),
    });
  }

  async findVocabularyByUser(
    userId: string,
    query: VocabularyQuery
  ): Promise<PaginatedResult<VocabularyResult>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = { userId };
    if (query.search) {
      where.OR = [
        { word: { contains: query.search, mode: 'insensitive' } },
        { meaning: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    let orderBy: Record<string, string>;
    switch (query.sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'mastered':
        orderBy = { mastered: 'desc' };
        break;
      case 'needs_review':
        orderBy = { nextReviewAt: 'asc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [data, total] = await Promise.all([
      this.prisma.vocabulary.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: this.vocabularySelect(),
      }),
      this.prisma.vocabulary.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findVocabularyById(id: string): Promise<(VocabularyResult & { userId: string }) | null> {
    return this.prisma.vocabulary.findUnique({
      where: { id },
      select: { ...this.vocabularySelect(), userId: true },
    });
  }

  async updateVocabulary(id: string, dto: UpdateVocabularyDto): Promise<VocabularyResult> {
    return this.prisma.vocabulary.update({
      where: { id },
      data: {
        ...(dto.word !== undefined && { word: dto.word }),
        ...(dto.meaning !== undefined && { meaning: dto.meaning }),
        ...(dto.example !== undefined && { example: dto.example }),
        ...(dto.language !== undefined && { language: dto.language }),
        ...(dto.difficulty !== undefined && { difficulty: dto.difficulty }),
        ...(dto.mastered !== undefined && { mastered: dto.mastered }),
        ...(dto.reviewCount !== undefined && { reviewCount: dto.reviewCount }),
        ...(dto.lastReviewedAt !== undefined && {
          lastReviewedAt: new Date(dto.lastReviewedAt),
        }),
        ...(dto.nextReviewAt !== undefined && {
          nextReviewAt: new Date(dto.nextReviewAt),
        }),
      },
      select: this.vocabularySelect(),
    });
  }

  async deleteVocabulary(id: string): Promise<void> {
    await this.prisma.vocabulary.delete({ where: { id } });
  }

  async countVocabularyByUser(userId: string): Promise<number> {
    return this.prisma.vocabulary.count({ where: { userId } });
  }

  async countMasteredVocabularyByUser(userId: string): Promise<number> {
    return this.prisma.vocabulary.count({ where: { userId, mastered: true } });
  }

  // ==========================================
  // GRAMMAR
  // ==========================================

  async createGrammarMistake(userId: string, dto: CreateGrammarDto): Promise<GrammarMistakeResult> {
    return this.prisma.grammarMistake.create({
      data: {
        userId,
        sentence: dto.sentence,
        correctSentence: dto.correctSentence,
        explanation: dto.explanation,
        grammarRule: dto.grammarRule,
        mistakeType: dto.mistakeType,
      },
      select: this.grammarSelect(),
    });
  }

  async findGrammarMistakesByUser(userId: string): Promise<GrammarMistakeResult[]> {
    return this.prisma.grammarMistake.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: this.grammarSelect(),
    });
  }

  async countGrammarMistakesByUser(userId: string): Promise<number> {
    return this.prisma.grammarMistake.count({ where: { userId } });
  }

  // ==========================================
  // LESSONS
  // ==========================================

  async findLessons(query: LessonQuery): Promise<PaginatedResult<LessonResult>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.level) where.level = query.level;
    if (query.language) where.language = query.language;

    const [data, total] = await Promise.all([
      this.prisma.lesson.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: this.lessonSelect(),
      }),
      this.prisma.lesson.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findLessonById(id: string): Promise<LessonResult | null> {
    return this.prisma.lesson.findUnique({
      where: { id },
      select: this.lessonSelect(),
    });
  }

  async countLessons(): Promise<number> {
    return this.prisma.lesson.count();
  }

  // ==========================================
  // PROGRESS
  // ==========================================

  async findProgressByUser(userId: string): Promise<ProgressResult[]> {
    return this.prisma.progress.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        lessonId: true,
        completed: true,
        score: true,
        xpEarned: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        lesson: {
          select: {
            id: true,
            title: true,
            level: true,
            language: true,
            xpReward: true,
          },
        },
      },
    });
  }

  async findProgressByUserAndLesson(
    userId: string,
    lessonId: string
  ): Promise<ProgressResult | null> {
    return this.prisma.progress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      select: {
        id: true,
        lessonId: true,
        completed: true,
        score: true,
        xpEarned: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        lesson: {
          select: {
            id: true,
            title: true,
            level: true,
            language: true,
            xpReward: true,
          },
        },
      },
    });
  }

  async upsertProgress(
    userId: string,
    dto: CreateProgressDto,
    xpEarned: number
  ): Promise<ProgressResult> {
    return this.prisma.progress.upsert({
      where: {
        userId_lessonId: { userId, lessonId: dto.lessonId },
      },
      create: {
        userId,
        lessonId: dto.lessonId,
        completed: true,
        score: dto.score,
        xpEarned,
        completedAt: new Date(),
      },
      update: {
        completed: true,
        score: dto.score,
        xpEarned,
        completedAt: new Date(),
      },
      select: {
        id: true,
        lessonId: true,
        completed: true,
        score: true,
        xpEarned: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        lesson: {
          select: {
            id: true,
            title: true,
            level: true,
            language: true,
            xpReward: true,
          },
        },
      },
    });
  }

  async countCompletedLessonsByUser(userId: string): Promise<number> {
    return this.prisma.progress.count({
      where: { userId, completed: true },
    });
  }

  // ==========================================
  // XP QUERIES
  // ==========================================

  async sumXpByUserSince(userId: string, since: Date): Promise<number> {
    const result = await this.prisma.progress.aggregate({
      where: {
        userId,
        completed: true,
        completedAt: { gte: since },
      },
      _sum: { xpEarned: true },
    });
    return result._sum.xpEarned ?? 0;
  }

  async sumTotalXpByUser(userId: string): Promise<number> {
    const result = await this.prisma.progress.aggregate({
      where: { userId, completed: true },
      _sum: { xpEarned: true },
    });
    return result._sum.xpEarned ?? 0;
  }

  // ==========================================
  // PROFILE ACCESS (for streak / totalXP)
  // ==========================================

  async findProfileByUserId(userId: string) {
    return this.prisma.profile.findUnique({
      where: { userId },
      select: {
        currentStreak: true,
        totalXP: true,
        dailyGoalMinutes: true,
      },
    });
  }

  async updateProfileXp(userId: string, totalXP: number): Promise<void> {
    await this.prisma.profile.update({
      where: { userId },
      data: { totalXP },
    });
  }

  // ==========================================
  // CONVERSATION COUNT (for achievements)
  // ==========================================

  async countConversationsByUser(userId: string): Promise<number> {
    return this.prisma.conversationSession.count({ where: { userId } });
  }

  // ==========================================
  // SELECT HELPERS
  // ==========================================

  private vocabularySelect() {
    return {
      id: true as const,
      word: true as const,
      meaning: true as const,
      example: true as const,
      language: true as const,
      difficulty: true as const,
      mastered: true as const,
      reviewCount: true as const,
      lastReviewedAt: true as const,
      nextReviewAt: true as const,
      createdAt: true as const,
      updatedAt: true as const,
    };
  }

  private grammarSelect() {
    return {
      id: true as const,
      sentence: true as const,
      correctSentence: true as const,
      explanation: true as const,
      grammarRule: true as const,
      mistakeType: true as const,
      createdAt: true as const,
    };
  }

  private lessonSelect() {
    return {
      id: true as const,
      title: true as const,
      description: true as const,
      level: true as const,
      language: true as const,
      estimatedMinutes: true as const,
      xpReward: true as const,
      createdAt: true as const,
      updatedAt: true as const,
    };
  }
}
