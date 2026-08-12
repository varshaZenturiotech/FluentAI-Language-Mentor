import { prisma } from '../database/prisma';

export class ProgressTracker {
  private static async calculateStreak(userId: string): Promise<number> {
    const logs = await prisma.dailyLearningLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    if (logs.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const latestLogDate = new Date(logs[0].date);
    latestLogDate.setHours(0, 0, 0, 0);

    if (latestLogDate.getTime() !== today.getTime() && latestLogDate.getTime() !== yesterday.getTime()) {
      return 0; // Streak broken
    }

    let expectedDate = latestLogDate;

    for (const log of logs) {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);

      if (logDate.getTime() === expectedDate.getTime()) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break; // Streak broken
      }
    }

    return streak;
  }

  public static async trackProgressEvent(
    userId: string,
    activityType: 'lesson' | 'conversation' | 'vocabulary' | 'grammar' | 'listening' | 'pronunciation' | 'quiz',
    durationMinutes = 5
  ) {
    try {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      await prisma.$transaction(async (tx: any) => {
        // 1. Update Daily Learning Log
        await tx.dailyLearningLog.upsert({
          where: {
            userId_date: {
              userId,
              date: todayDate,
            },
          },
          create: {
            userId,
            date: todayDate,
            minutesStudied: durationMinutes,
            completedTasks: 1,
            completedLessons: activityType === 'lesson' || activityType === 'grammar' ? 1 : 0,
          },
          update: {
            minutesStudied: { increment: durationMinutes },
            completedTasks: { increment: 1 },
            completedLessons: activityType === 'lesson' || activityType === 'grammar' ? { increment: 1 } : undefined,
          },
        });

        // 2. Fetch all days for active study plan to update completion percentage if any exists
        const activePlan = await tx.studyPlan.findFirst({
          where: { userId },
          include: { days: true },
        });

        let completionPercentage = 0.0;
        if (activePlan && activePlan.days.length > 0) {
          const completedDays = activePlan.days.filter((d: any) => d.status === 'COMPLETED').length;
          completionPercentage = (completedDays / activePlan.days.length) * 100;
        }

        // Calculate current streak
        const streak = await this.calculateStreak(userId);

        // 3. Update Learning Progress stats
        await tx.learningProgress.upsert({
          where: { userId },
          create: {
            userId,
            lessonsCompleted: activityType === 'lesson' ? 1 : 0,
            conversationsCompleted: activityType === 'conversation' ? 1 : 0,
            vocabularyLearned: activityType === 'vocabulary' ? 1 : 0,
            grammarTopicsCompleted: activityType === 'grammar' ? 1 : 0,
            listeningSessions: activityType === 'listening' ? 1 : 0,
            pronunciationSessions: activityType === 'pronunciation' ? 1 : 0,
            quizzesCompleted: activityType === 'quiz' ? 1 : 0,
            studyMinutes: durationMinutes,
            streak,
            completionPercentage,
          },
          update: {
            lessonsCompleted: activityType === 'lesson' ? { increment: 1 } : undefined,
            conversationsCompleted: activityType === 'conversation' ? { increment: 1 } : undefined,
            vocabularyLearned: activityType === 'vocabulary' ? { increment: 1 } : undefined,
            grammarTopicsCompleted: activityType === 'grammar' ? { increment: 1 } : undefined,
            listeningSessions: activityType === 'listening' ? { increment: 1 } : undefined,
            pronunciationSessions: activityType === 'pronunciation' ? { increment: 1 } : undefined,
            quizzesCompleted: activityType === 'quiz' ? { increment: 1 } : undefined,
            studyMinutes: { increment: durationMinutes },
            streak,
            completionPercentage,
          },
        });
      });
    } catch (error) {
      console.error('Error tracking learning progress event:', error);
    }
  }
}
