import { prisma } from '../database/prisma';
import { studyPlanRepository } from '../repositories/study-plan.repository';
import { fastApiClient } from '../clients/fastapi.client';
import { ApiError } from '../utils/ApiError';
import { HttpStatusCodes } from '../constants/httpStatusCodes';
import { SKILL_PRIORITY_THRESHOLDS } from '../constants/learningConstants';
import { logger } from '../utils/logger';

export interface SkillPriority {
  skill: string;
  score: number;
  priority: 'critical' | 'high' | 'medium' | 'low' | 'mastered';
  priorityScore: number;
}

interface CachedRecommendation {
  data: any;
  timestamp: number;
}

const recommendationsCache = new Map<string, CachedRecommendation>();
const pendingRecommendationsPromises = new Map<string, Promise<any>>();
const RECOMMENDATIONS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function invalidateRecommendationsCache(userId: string) {
  recommendationsCache.delete(userId);
}

export function getLessonFallbackGreeting(day: {
  dayNumber: number;
  title: string;
  lessonType: string;
  lessonContent: string;
}): string {
  const type = (day.lessonType || 'Vocabulary').toLowerCase();
  const taskName = day.title || 'Practice Lesson';

  if (type.includes('vocab')) {
    return `Hi! 👋 Welcome to Day ${day.dayNumber} of your ${taskName} practice.\n\nToday we will learn key vocabulary for your target goals. Let's start with your first exercise:\n\n**Word**: *Collaborate*\n**Meaning**: To work together with others to achieve a common goal.\n\nCan you write a short sentence using the word **collaborate**?`;
  }

  if (type.includes('gramm')) {
    return `Hi! 👋 Welcome to Day ${day.dayNumber} Grammar Practice: ${taskName}.\n\nToday we'll focus on forming clear, accurate sentences.\n\n**Quick Example**: "I have been working here for two years." (Present Perfect Continuous)\n\nCan you share one thing you have been practicing or learning recently?`;
  }

  if (type.includes('speak') || type.includes('accent') || type.includes('convers')) {
    return `Hi! 👋 Welcome to Day ${day.dayNumber} Speaking Practice: ${taskName}.\n\nI'm your AI Language Mentor! Let's practice speaking naturally today.\n\nTo get started, tell me: What is your primary learning goal for this week?`;
  }

  if (type.includes('pronun')) {
    return `Hi! 👋 Welcome to Day ${day.dayNumber} Pronunciation Practice: ${taskName}.\n\nWe will work on your accent, clarity, and word stress today.\n\nTry reading this sentence aloud or typing it: *"Clear communication creates great opportunities."*\n\nHow does that feel?`;
  }

  return `Hi! 👋 Welcome to Day ${day.dayNumber}: ${taskName}.\n\nI'm ready to guide you through today's practice: ${day.lessonContent}.\n\nLet's begin! What would you like to practice first?`;
}

export function calculateSkillPriorities(
  baseline: {
    grammar: number;
    vocabulary: number;
    reading: number;
    listening: number;
    writing: number;
    speaking: number;
    pronunciation: number;
    fluency: number;
    actualGrammar?: number | null;
    actualVocabulary?: number | null;
    actualReading?: number | null;
    actualListening?: number | null;
    actualWriting?: number | null;
    actualSpeaking?: number | null;
    actualPronunciation?: number | null;
    actualFluency?: number | null;
    completed: boolean;
  },
  goals: string[],
  mistakeCount: number
): SkillPriority[] {
  const getScore = (key: string): number => {
    if (baseline.completed) {
      const actualKey = `actual${key.charAt(0).toUpperCase() + key.slice(1)}`;
      return (baseline as any)[actualKey] ?? (baseline as any)[key] ?? 50;
    }
    return (baseline as any)[key] ?? 50;
  };

  const skillsList = [
    'grammar',
    'vocabulary',
    'reading',
    'listening',
    'writing',
    'speaking',
    'pronunciation',
    'fluency',
  ];

  const goalStr = goals.join(' ').toLowerCase();

  return skillsList.map((skill) => {
    const score = getScore(skill);
    const weaknessFactor = 100 - score;

    let goalRelevance = 1.0;
    if (
      goalStr.includes('interview') ||
      goalStr.includes('career') ||
      goalStr.includes('work') ||
      goalStr.includes('job') ||
      goalStr.includes('conversation') ||
      goalStr.includes('social')
    ) {
      if (skill === 'speaking' || skill === 'fluency') {
        goalRelevance = 2.0;
      } else if (skill === 'pronunciation' || skill === 'vocabulary') {
        goalRelevance = 1.5;
      } else {
        goalRelevance = 1.2;
      }
    } else if (
      goalStr.includes('exam') ||
      goalStr.includes('academic') ||
      goalStr.includes('study') ||
      goalStr.includes('test')
    ) {
      if (skill === 'grammar' || skill === 'writing') {
        goalRelevance = 2.0;
      } else if (skill === 'reading' || skill === 'vocabulary') {
        goalRelevance = 1.5;
      } else {
        goalRelevance = 1.2;
      }
    } else if (goalStr.includes('travel')) {
      if (skill === 'speaking' || skill === 'listening') {
        goalRelevance = 2.0;
      } else if (skill === 'fluency') {
        goalRelevance = 1.5;
      } else {
        goalRelevance = 1.1;
      }
    }

    let mistakeAdjustment = 0;
    if (skill === 'grammar' && mistakeCount > 0) {
      const MAX_ADJUSTMENT = 15;
      const FACTOR = 5;
      mistakeAdjustment = Math.min(MAX_ADJUSTMENT, Math.log2(mistakeCount + 1) * FACTOR);
    }

    const priorityScore = weaknessFactor * goalRelevance + mistakeAdjustment;

    let priority: 'critical' | 'high' | 'medium' | 'low' | 'mastered' = 'low';
    if (priorityScore >= SKILL_PRIORITY_THRESHOLDS.CRITICAL) {
      priority = 'critical';
    } else if (priorityScore >= SKILL_PRIORITY_THRESHOLDS.HIGH) {
      priority = 'high';
    } else if (priorityScore >= SKILL_PRIORITY_THRESHOLDS.MEDIUM) {
      priority = 'medium';
    } else if (priorityScore >= SKILL_PRIORITY_THRESHOLDS.LOW) {
      priority = 'low';
    } else {
      priority = 'mastered';
    }

    return {
      skill,
      score,
      priority,
      priorityScore,
    };
  });
}

export class StudyPlanService {
  private readonly repository = studyPlanRepository;
  private readonly client = fastApiClient;

  private static activeGenerations = new Map<string, Promise<any>>();
  private static recentErrors = new Map<string, { error: string; timestamp: number }>();

  static isGenerating(userId: string): boolean {
    return StudyPlanService.activeGenerations.has(userId);
  }

  static getRecentError(userId: string): string | null {
    const cached = StudyPlanService.recentErrors.get(userId);
    if (!cached) return null;
    const isExpired = Date.now() - cached.timestamp > 2 * 60 * 1000; // 2 minutes TTL
    if (isExpired) {
      StudyPlanService.recentErrors.delete(userId);
      return null;
    }
    return cached.error;
  }

  static clearRecentError(userId: string): void {
    StudyPlanService.recentErrors.delete(userId);
  }

  generatePlan(userId: string): Promise<any> {
    // Explicit generation or retry clears any recent cached errors
    StudyPlanService.clearRecentError(userId);

    const activePromise = StudyPlanService.activeGenerations.get(userId);
    if (activePromise) {
      logger.info(`Coalescing study plan generation request for user ${userId}`);
      return activePromise;
    }

    const promise = (async () => {
      try {
        const plan = await this.executeGeneratePlan(userId);
        return plan;
      } catch (err: any) {
        logger.error(`Error generating study plan for user ${userId}:`, err);
        const safeErrorMessage = "We couldn't generate your study plan right now. Please try again.";
        StudyPlanService.recentErrors.set(userId, {
          error: safeErrorMessage,
          timestamp: Date.now()
        });
        throw err;
      } finally {
        StudyPlanService.activeGenerations.delete(userId);
      }
    })();

    StudyPlanService.activeGenerations.set(userId, promise);
    return promise;
  }

  private async executeGeneratePlan(userId: string): Promise<any> {
    // 1. Fetch user's learning profile
    const profile = await prisma.learningProfile.findUnique({
      where: { userId },
      include: {
        goals: true,
        interests: true,
      },
    });

    if (!profile) {
      throw new ApiError(HttpStatusCodes.BAD_REQUEST, 'Learning profile not found. Please complete onboarding first.');
    }

    // 2. Fetch user's baseline assessment if available, throw if not completed
    const baseline = await prisma.learnerAssessment.findUnique({
      where: { userId },
    });

    if (!baseline || !baseline.completed) {
      throw new ApiError(HttpStatusCodes.BAD_REQUEST, 'Please complete the baseline assessment before generating a study plan.');
    }

    // 3. Prepare profile payload
    const profilePayload = {
      ageGroup: profile.ageGroup,
      occupation: profile.occupation,
      englishLevel: profile.englishLevel,
      nativeLanguage: profile.nativeLanguage,
      goals: profile.goals.map((g: any) => g.goal),
      interests: profile.interests.map((i: any) => i.interest),
      dailyLearningGoal: profile.dailyLearningGoal,
    };

    // Calculate priority focus areas deterministically
    const mistakeCount = await prisma.grammarMistake.count({ where: { userId } });
    const computedPriorities = calculateSkillPriorities(baseline, profilePayload.goals, mistakeCount);
    const sortedSkills = [...computedPriorities].sort((a, b) => b.priorityScore - a.priorityScore);
    const priorityAreas = sortedSkills.slice(0, 3).map((s) => s.skill);

    const baselinePayload = {
      grammar: baseline.completed ? baseline.actualGrammar : baseline.grammar,
      vocabulary: baseline.completed ? baseline.actualVocabulary : baseline.vocabulary,
      reading: baseline.completed ? baseline.actualReading : baseline.reading,
      speaking: baseline.completed ? baseline.actualSpeaking : baseline.speaking,
      listening: baseline.completed ? baseline.actualListening : baseline.listening,
      writing: baseline.completed ? baseline.actualWriting : baseline.writing,
      pronunciation: baseline.completed ? baseline.actualPronunciation : baseline.pronunciation,
      fluency: baseline.completed ? baseline.actualFluency : baseline.fluency,
      strengths: baseline.completed && baseline.actualStrengths ? JSON.parse(baseline.actualStrengths) : [],
      weaknesses: baseline.completed && baseline.actualWeaknesses ? JSON.parse(baseline.actualWeaknesses) : [],
      level: baseline.completed ? baseline.actualLevel : undefined,
      score: baseline.completed ? baseline.actualScore : undefined,
      is_actual_assessment: baseline.completed,
      priority_areas: priorityAreas,
    };

    // 4. Request generation from AI Gateway
    const planData = await this.client.generateStudyPlan(profilePayload, baselinePayload, userId);

    if (!planData || !planData.weeks) {
      throw new ApiError(HttpStatusCodes.INTERNAL_SERVER_ERROR, 'Failed to generate study plan from AI Gateway');
    }

    // Flatten weeks days list and construct metadata
    const flatDays = [];
    for (const week of planData.weeks) {
      for (const day of week.days) {
        flatDays.push({
          dayNumber: day.dayNumber,
          weekNumber: week.weekNumber,
          title: day.title,
          estimatedMinutes: day.estimatedMinutes,
          lessonType: day.lessonType,
          lessonContent: day.lessonContent,
        });
      }
    }

    const weeksMetaOnly = planData.weeks.map((w: any) => ({
      weekNumber: w.weekNumber,
      title: w.title,
      description: w.description,
      focusSkills: w.focusSkills,
      objectives: w.objectives,
    }));
    const weeksMetadataStr = JSON.stringify(weeksMetaOnly);

    // 5. Save plan in database using repository
    const savedPlan = await this.repository.createStudyPlan(userId, {
      title: planData.title || `Personalized Roadmap for ${profile.occupation || 'Learner'}`,
      description: planData.description || 'A tailored English learning curriculum.',
      durationWeeks: planData.durationWeeks || 8,
      weeksMetadata: weeksMetadataStr,
      days: flatDays,
    });

    return savedPlan;
  }

  async getPlan(userId: string) {
    let plan = await this.repository.findActivePlanByUserId(userId);
    return plan;
  }

  async completeDay(userId: string, dayId: string) {
    const day = await this.repository.findDayById(dayId);
    if (!day) {
      throw new ApiError(HttpStatusCodes.NOT_FOUND, 'Study plan day not found');
    }

    const updatedDay = await this.repository.completeDay(userId, dayId);
    return updatedDay;
  }

  async getRecommendations(userId: string) {
    const now = Date.now();
    const cached = recommendationsCache.get(userId);

    if (cached && now - cached.timestamp < RECOMMENDATIONS_CACHE_TTL_MS) {
      logger.info(`[RECOMMENDATION_CACHE_HIT] Returning cached recommendations for userId: ${userId}`);
      return cached.data;
    }

    if (pendingRecommendationsPromises.has(userId)) {
      logger.info(`[RECOMMENDATION_REQUEST_COALESCED] Coalescing concurrent recommendation request for userId: ${userId}`);
      return pendingRecommendationsPromises.get(userId)!;
    }

    const fetchPromise = (async () => {
      try {
        const profile = await prisma.learningProfile.findUnique({
          where: { userId },
          include: { goals: true, interests: true },
        });

        if (!profile) {
          throw new ApiError(HttpStatusCodes.BAD_REQUEST, 'Learning profile not found. Please complete onboarding first.');
        }

        const [mistakes, vocabList, progress] = await Promise.all([
          prisma.grammarMistake.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5,
          }),
          prisma.vocabulary.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10,
          }),
          this.repository.getLearningProgress(userId),
        ]);

        const profilePayload = {
          ageGroup: profile.ageGroup,
          occupation: profile.occupation,
          englishLevel: profile.englishLevel,
          nativeLanguage: profile.nativeLanguage,
          goals: profile.goals.map((g: any) => g.goal),
          interests: profile.interests.map((i: any) => i.interest),
          dailyLearningGoal: profile.dailyLearningGoal,
        };

        const progressPayload = progress ? {
          lessonsCompleted: progress.lessonsCompleted,
          conversationsCompleted: progress.conversationsCompleted,
          vocabularyLearned: progress.vocabularyLearned,
          grammarTopicsCompleted: progress.grammarTopicsCompleted,
          streak: progress.streak,
          currentLevel: progress.currentLevel,
        } : {};

        const mistakesPayload = mistakes.map((m: any) => ({
          sentence: m.sentence,
          correctSentence: m.correctSentence,
          explanation: m.explanation,
        }));

        const vocabPayload = vocabList.map((v: any) => v.word);

        logger.info(`[RECOMMENDATION_CACHE_MISS] Requesting AI recommendations for userId: ${userId}`);
        const recs = await this.client.getRecommendations(
          profilePayload,
          progressPayload,
          mistakesPayload,
          vocabPayload,
          undefined,
          userId
        );

        recommendationsCache.set(userId, { data: recs, timestamp: Date.now() });
        return recs;
      } catch (err: any) {
        logger.warn(`[RECOMMENDATION_FALLBACK] AI Recommendations failed (${err.message}). Using fallback recommendations.`);
        if (cached) {
          logger.info(`[RECOMMENDATION_CACHE_HIT] Returning stale cached recommendations for userId: ${userId}`);
          return cached.data;
        }
        return {
          study_plan_focus: 'Focus on daily vocabulary and workplace conversation practice.',
          recommended_activities: [
            {
              title: 'Workplace Vocabulary',
              type: 'vocabulary',
              estimatedMinutes: 10,
              reason: 'Build core business terminology',
            },
            {
              title: 'Daily Speaking Challenge',
              type: 'speaking',
              estimatedMinutes: 15,
              reason: 'Improve natural spoken fluency',
            },
          ],
          daily_goals: ['Complete 1 lesson', 'Practice 5 new vocabulary words'],
        };
      } finally {
        pendingRecommendationsPromises.delete(userId);
      }
    })();

    pendingRecommendationsPromises.set(userId, fetchPromise);
    return fetchPromise;
  }

  async getProgress(userId: string) {
    let progress = await this.repository.getLearningProgress(userId);
    if (!progress) {
      progress = await prisma.learningProgress.create({
        data: {
          userId,
          lessonsCompleted: 0,
          conversationsCompleted: 0,
          vocabularyLearned: 0,
          grammarTopicsCompleted: 0,
          listeningSessions: 0,
          pronunciationSessions: 0,
          quizzesCompleted: 0,
          studyMinutes: 0,
          streak: 0,
          completionPercentage: 0.0,
          currentLevel: 'BEGINNER',
        },
      });
    }

    const logs = await this.repository.getDailyLogs(userId);

    return {
      progress,
      logs,
    };
  }

  async startLessonSession(userId: string, dayId: string) {
    const day = await this.repository.findDayById(dayId);
    if (!day) {
      throw new ApiError(HttpStatusCodes.NOT_FOUND, 'Study plan day not found');
    }

    if (day.status === 'LOCKED') {
      await prisma.studyPlanDay.update({
        where: { id: dayId },
        data: { status: 'AVAILABLE' },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { learningLanguage: true, level: true },
    });

    const weekId = Math.ceil(day.dayNumber / 7);

    // 1. Find or create an active LessonSession
    let lessonSession = await prisma.lessonSession.findFirst({
      where: {
        userId,
        dayId,
        status: { in: ['NOT_STARTED', 'IN_PROGRESS'] },
      },
    });

    if (!lessonSession) {
      lessonSession = await prisma.lessonSession.create({
        data: {
          userId,
          studyPlanId: day.studyPlanId,
          weekId,
          dayId,
          status: 'IN_PROGRESS',
        },
      });
    } else {
      lessonSession = await prisma.lessonSession.update({
        where: { id: lessonSession.id },
        data: { status: 'IN_PROGRESS', startedAt: new Date() },
      });
    }

    // 2. Find or create ConversationSession linked to this day
    let conversationSession = await prisma.conversationSession.findFirst({
      where: {
        userId,
        lessonId: day.id,
      },
    });

    if (!conversationSession) {
      conversationSession = await prisma.conversationSession.create({
        data: {
          userId,
          title: day.title,
          topic: day.title,
          lessonType: day.lessonType,
          language: user?.learningLanguage ?? 'en',
          difficulty: user?.level ?? 'BEGINNER',
          status: 'ACTIVE',
          studyPlanId: day.studyPlanId,
          lessonId: day.id,
        },
      });
    }

    // 3. Find existing messages for this session
    const existingMessages = await prisma.message.findMany({
      where: { sessionId: conversationSession.id },
      orderBy: { createdAt: 'asc' },
    });

    let initialMessage = existingMessages.find((m) => m.role === 'ASSISTANT') || null;
    let isFallback = false;

    // 4. Generate initial AI greeting if no ASSISTANT message exists
    if (!initialMessage) {
      logger.info(
        `[LESSON_INIT_AI_REQUEST] Generating initial AI greeting | sessionId: ${conversationSession.id} | dayId: ${day.id} | taskType: ${day.lessonType}`
      );

      const profile = await prisma.learningProfile.findUnique({
        where: { userId },
        include: { goals: true, interests: true },
      });

      const learnerProfile = profile ? {
        nativeLanguage: profile.nativeLanguage,
        ageGroup: profile.ageGroup,
        occupation: profile.occupation,
        englishLevel: profile.englishLevel,
        goals: profile.goals.map((g: any) => g.goal),
        interests: profile.interests.map((i: any) => i.interest),
        dailyGoal: profile.dailyLearningGoal,
      } : null;

      const lessonContext = {
        studyPlanId: day.studyPlanId,
        weekId: `${day.studyPlanId}-week-${weekId}`,
        dayId: day.id,
        lessonId: day.id,
        title: day.title,
        objectives: [day.lessonContent],
        lessonType: day.lessonType.toLowerCase(),
        difficulty: (user?.level ?? 'BEGINNER').toLowerCase(),
        estimatedMinutes: day.estimatedMinutes || 20,
      };

      let aiGreetingText = '';

      try {
        const chatPayload = {
          sessionId: conversationSession.id,
          message: 'Hello! I am ready to start my lesson.',
          language: user?.learningLanguage ?? 'en',
          history: [],
          lessonContext,
          learnerProfile,
        };

        const result = await this.client.chat(chatPayload as any, undefined, userId);
        if (result && result.reply) {
          aiGreetingText = result.reply;
          logger.info(
            `[LESSON_INIT_AI_SUCCESS] Successfully generated AI greeting | sessionId: ${conversationSession.id}`
          );
        }
      } catch (err: any) {
        isFallback = true;
        logger.warn(
          `[LESSON_INIT_FALLBACK] AI generation failed or rate limited (${err.message}). Using safe lesson fallback greeting | sessionId: ${conversationSession.id}`
        );
        aiGreetingText = getLessonFallbackGreeting(day);
      }

      if (!aiGreetingText) {
        isFallback = true;
        aiGreetingText = getLessonFallbackGreeting(day);
      }

      // Persist initial ASSISTANT message in DB so conversation is guaranteed to be non-empty
      const createdMessage = await prisma.message.create({
        data: {
          sessionId: conversationSession.id,
          role: 'ASSISTANT',
          content: aiGreetingText,
        },
      });

      await prisma.conversationSession.update({
        where: { id: conversationSession.id },
        data: {
          lastMessageAt: new Date(),
          totalMessages: { increment: 1 },
        },
      });

      initialMessage = createdMessage;
    }

    return {
      lessonSession,
      conversationSession,
      initialMessage: initialMessage ? {
        id: initialMessage.id,
        role: 'ASSISTANT',
        content: initialMessage.content,
        isFallback,
      } : null,
    };
  }
}

export const studyPlanService = new StudyPlanService();
