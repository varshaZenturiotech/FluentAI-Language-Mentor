import { CreateVocabularyDto, UpdateVocabularyDto } from '../dto/vocabulary.dto';
import { CreateGrammarDto } from '../dto/grammar.dto';
import { CreateProgressDto } from '../dto/progress.dto';
import { TodayXpResult } from '../dto/today-xp.dto';
import { prisma } from '../database/prisma';
import {
  LearningRepository,
  VocabularyResult,
  GrammarMistakeResult,
  LessonResult,
  ProgressResult,
  VocabularyQuery,
  LessonQuery,
  PaginatedResult,
} from '../repositories/learning.repository';
import { ApiError } from '../utils/ApiError';
import { HttpStatusCodes } from '../constants/httpStatusCodes';
import { ProgressTracker } from '../utils/progress-tracker';

// ==========================================
// ACHIEVEMENT DEFINITIONS
// ==========================================

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

/**
 * Learning Service
 *
 * Responsibility: Business logic ONLY.
 * - Calculates XP, streaks, and achievements.
 * - Enforces ownership verification.
 * - Throws semantic ApiErrors for the global error handler.
 *
 * Never performs direct Prisma queries.
 */
export class LearningService {
  private learningRepository: LearningRepository;

  constructor(learningRepository: LearningRepository = new LearningRepository()) {
    this.learningRepository = learningRepository;
  }

  // ==========================================
  // TODAY XP
  // ==========================================

  /**
   * Computes the authenticated user's XP summary: today, weekly, monthly, total, and streak.
   */
  async getTodayXp(userId: string): Promise<TodayXpResult> {
    const now = new Date();

    // Start of today (midnight UTC)
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    // Start of this week (Monday midnight UTC)
    const dayOfWeek = now.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(todayStart);
    weekStart.setUTCDate(weekStart.getUTCDate() - mondayOffset);

    // Start of this month (1st midnight UTC)
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const [todayXP, weeklyXP, monthlyXP, totalXP, profile] = await Promise.all([
      this.learningRepository.sumXpByUserSince(userId, todayStart),
      this.learningRepository.sumXpByUserSince(userId, weekStart),
      this.learningRepository.sumXpByUserSince(userId, monthStart),
      this.learningRepository.sumTotalXpByUser(userId),
      this.learningRepository.findProfileByUserId(userId),
    ]);

    return {
      todayXP,
      currentStreak: profile?.currentStreak ?? 0,
      weeklyXP,
      monthlyXP,
      totalXP,
    };
  }

  // ==========================================
  // VOCABULARY
  // ==========================================

  async getVocabulary(
    userId: string,
    query: VocabularyQuery
  ): Promise<PaginatedResult<VocabularyResult>> {
    return this.learningRepository.findVocabularyByUser(userId, query);
  }

  async createVocabulary(userId: string, dto: CreateVocabularyDto): Promise<VocabularyResult> {
    const vocab = await this.learningRepository.createVocabulary(userId, dto);
    await ProgressTracker.trackProgressEvent(userId, 'vocabulary', 2);
    return vocab;
  }

  async updateVocabulary(
    userId: string,
    vocabId: string,
    dto: UpdateVocabularyDto
  ): Promise<VocabularyResult> {
    await this.verifyVocabularyOwnership(userId, vocabId);
    return this.learningRepository.updateVocabulary(vocabId, dto);
  }

  async deleteVocabulary(userId: string, vocabId: string): Promise<void> {
    await this.verifyVocabularyOwnership(userId, vocabId);
    await this.learningRepository.deleteVocabulary(vocabId);
  }

  // ==========================================
  // GRAMMAR
  // ==========================================

  async getGrammarMistakes(userId: string): Promise<GrammarMistakeResult[]> {
    return this.learningRepository.findGrammarMistakesByUser(userId);
  }

  async createGrammarMistake(userId: string, dto: CreateGrammarDto): Promise<GrammarMistakeResult> {
    const mistake = await this.learningRepository.createGrammarMistake(userId, dto);
    await ProgressTracker.trackProgressEvent(userId, 'grammar', 3);
    return mistake;
  }

  // ==========================================
  // LESSONS
  // ==========================================

  async getLessons(query: LessonQuery): Promise<PaginatedResult<LessonResult>> {
    return this.learningRepository.findLessons(query);
  }

  // ==========================================
  // PROGRESS
  // ==========================================

  /**
   * Returns the user's learning progress summary including completion stats.
   */
  async getProgress(userId: string): Promise<any> {
    const [progress, completedLessons, totalLessons, totalXP, profile, learningProgress] = await Promise.all([
      this.learningRepository.findProgressByUser(userId),
      this.learningRepository.countCompletedLessonsByUser(userId),
      this.learningRepository.countLessons(),
      this.learningRepository.sumTotalXpByUser(userId),
      this.learningRepository.findProfileByUserId(userId),
      prisma.learningProgress.findUnique({ where: { userId } }),
    ]);

    const completionPercentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      completedLessons,
      totalLessons,
      completionPercentage,
      totalXP,
      currentStreak: profile?.currentStreak ?? 0,
      progress,
      ...(learningProgress || {}),
    };
  }

  /**
   * Marks a lesson as completed, calculates XP, and updates the user's profile totalXP.
   *
   * XP formula: xpEarned = lesson.xpReward × (score / 100)
   * Minimum 1 XP if score > 0.
   *
   * @throws {ApiError} 404 – lesson not found
   */
  async completeLesson(userId: string, dto: CreateProgressDto): Promise<ProgressResult> {
    // Verify lesson exists
    const lesson = await this.learningRepository.findLessonById(dto.lessonId);
    if (!lesson) {
      throw new ApiError(HttpStatusCodes.NOT_FOUND, 'Lesson not found.');
    }

    // Calculate XP earned based on score
    const xpEarned = Math.max(
      dto.score > 0 ? 1 : 0,
      Math.round(lesson.xpReward * (dto.score / 100))
    );

    // Upsert progress record (create or update if re-completing)
    const progress = await this.learningRepository.upsertProgress(userId, dto, xpEarned);

    // Recalculate total XP and sync to profile
    const newTotalXP = await this.learningRepository.sumTotalXpByUser(userId);
    await this.learningRepository.updateProfileXp(userId, newTotalXP);

    // Track study plan and learning progress automatically
    await ProgressTracker.trackProgressEvent(userId, 'lesson', lesson.estimatedMinutes);

    return progress;
  }

  // ==========================================
  // ACHIEVEMENTS
  // ==========================================

  /**
   * Computes the user's achievements by checking their current stats against
   * predefined milestones. All checks are derived from data already in the DB —
   * no separate achievements table needed.
   */
  async getAchievements(userId: string): Promise<Achievement[]> {
    const [
      completedLessons,
      totalXP,
      profile,
      vocabCount,
      masteredVocabCount,
      grammarCount,
      conversationCount,
    ] = await Promise.all([
      this.learningRepository.countCompletedLessonsByUser(userId),
      this.learningRepository.sumTotalXpByUser(userId),
      this.learningRepository.findProfileByUserId(userId),
      this.learningRepository.countVocabularyByUser(userId),
      this.learningRepository.countMasteredVocabularyByUser(userId),
      this.learningRepository.countGrammarMistakesByUser(userId),
      this.learningRepository.countConversationsByUser(userId),
    ]);

    const streak = profile?.currentStreak ?? 0;

    return [
      {
        id: 'first_lesson',
        name: 'First Lesson',
        description: 'Complete your first lesson',
        icon: '🎓',
        unlocked: completedLessons >= 1,
      },
      {
        id: 'ten_lessons',
        name: 'Dedicated Learner',
        description: 'Complete 10 lessons',
        icon: '📚',
        unlocked: completedLessons >= 10,
      },
      {
        id: '100_xp',
        name: '100 XP',
        description: 'Earn 100 XP total',
        icon: '⭐',
        unlocked: totalXP >= 100,
      },
      {
        id: '500_xp',
        name: 'XP Master',
        description: 'Earn 500 XP total',
        icon: '🌟',
        unlocked: totalXP >= 500,
      },
      {
        id: '7_day_streak',
        name: '7 Day Streak',
        description: 'Maintain a 7 day learning streak',
        icon: '🔥',
        unlocked: streak >= 7,
      },
      {
        id: '30_day_streak',
        name: 'Monthly Warrior',
        description: 'Maintain a 30 day learning streak',
        icon: '💪',
        unlocked: streak >= 30,
      },
      {
        id: '100_vocabulary',
        name: '100 Vocabulary',
        description: 'Save 100 vocabulary words',
        icon: '📖',
        unlocked: vocabCount >= 100,
      },
      {
        id: 'vocab_master',
        name: 'Vocabulary Master',
        description: 'Master 50 vocabulary words',
        icon: '🏆',
        unlocked: masteredVocabCount >= 50,
      },
      {
        id: 'grammar_master',
        name: 'Grammar Master',
        description: 'Log 50 grammar corrections',
        icon: '✍️',
        unlocked: grammarCount >= 50,
      },
      {
        id: 'conversation_starter',
        name: 'Conversation Starter',
        description: 'Start your first conversation',
        icon: '💬',
        unlocked: conversationCount >= 1,
      },
      {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Have 25 conversations',
        icon: '🦋',
        unlocked: conversationCount >= 25,
      },
    ];
  }

  // ==========================================
  // PRIVATE HELPERS
  // ==========================================

  /**
   * Verifies the authenticated user owns the given vocabulary entry.
   *
   * @throws {ApiError} 404 – vocabulary not found
   * @throws {ApiError} 403 – vocabulary belongs to another user
   */
  private async verifyVocabularyOwnership(userId: string, vocabId: string): Promise<void> {
    const vocab = await this.learningRepository.findVocabularyById(vocabId);

    if (!vocab) {
      throw new ApiError(HttpStatusCodes.NOT_FOUND, 'Vocabulary entry not found.');
    }

    if (vocab.userId !== userId) {
      throw new ApiError(
        HttpStatusCodes.FORBIDDEN,
        'You do not have permission to access this vocabulary entry.'
      );
    }
  }
}
