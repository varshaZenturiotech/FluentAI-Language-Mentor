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

    // 2. Fetch recent activity details
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

    // 3. Prepare payload for recommendations
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

    // 4. Request recommendations from AI Gateway
    const recs = await this.client.getRecommendations(
      profilePayload,
      progressPayload,
      mistakesPayload,
      vocabPayload,
      undefined,
      userId
    );

    return recs;
  }

  async getProgress(userId: string) {
    let progress = await this.repository.getLearningProgress(userId);
    if (!progress) {
      // Create empty progress entry if not exists
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

    // 3. Generate initial AI greeting if the session has no messages
    const messageCount = await prisma.message.count({
      where: { sessionId: conversationSession.id },
    });

    if (messageCount === 0) {
      try {
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

        const chatPayload = {
          sessionId: conversationSession.id,
          message: 'Hello! I am ready to start my lesson.',
          language: user?.learningLanguage ?? 'en',
          history: [],
          lessonContext,
          learnerProfile,
        };

        // Call the AI Gateway client directly
        const initialResult = await this.client.chat(chatPayload as any, undefined, userId);

        if (initialResult && initialResult.reply) {
          await prisma.message.create({
            data: {
              sessionId: conversationSession.id,
              role: 'ASSISTANT',
              content: initialResult.reply,
            },
          });

          await prisma.conversationSession.update({
            where: { id: conversationSession.id },
            data: {
              lastMessageAt: new Date(),
              totalMessages: 1,
            },
          });
        }
      } catch (err) {
        console.error('Failed to generate initial AI lesson message:', err);
      }
    }

    return {
      lessonSession,
      conversationSession,
    };
  }
}

export const studyPlanService = new StudyPlanService();
