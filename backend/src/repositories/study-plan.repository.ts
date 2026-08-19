import { prisma } from '../database/prisma';
import { StudyPlanDayStatus } from '@prisma/client';
import { OBJECTIVE_MASTERY_THRESHOLD } from '../constants/learningConstants';

export interface CreateStudyPlanDto {
  title: string;
  description: string;
  durationWeeks: number;
  weeksMetadata?: string;
  days: {
    dayNumber: number;
    weekNumber: number;
    title: string;
    estimatedMinutes: number;
    lessonType: string;
    lessonContent: string;
  }[];
}

/** Serialisable mastery record attached to the plan response. */
export interface ObjectiveMasteryRecord {
  id: string;
  objective: string;
  masteryScore: number;
  accuracy: number;
  attemptsCount: number;
  lastPracticed: Date;
  /** Derived status – computed server-side from the central threshold */
  masteryStatus: 'MASTERED' | 'PROFICIENT' | 'PRACTICING' | 'NOT_STARTED';
}

function deriveMasteryStatus(rec: { masteryScore: number; attemptsCount: number }): ObjectiveMasteryRecord['masteryStatus'] {
  if (rec.attemptsCount === 0) return 'NOT_STARTED';
  if (rec.masteryScore >= OBJECTIVE_MASTERY_THRESHOLD) return 'MASTERED';
  if (rec.masteryScore >= 50) return 'PROFICIENT';
  return 'PRACTICING';
}

export class StudyPlanRepository {
  private readonly prisma = prisma;

  /**
   * Fetch the active plan for a user, embedding all ObjectiveMastery records
   * in a single batch query. The caller never needs a second request for mastery data.
   */
  async findActivePlanByUserId(userId: string) {
    // Parallelise the two independent queries
    const [plan, rawMasteries] = await Promise.all([
      this.prisma.studyPlan.findFirst({
        where: { userId },
        include: {
          days: {
            orderBy: { dayNumber: 'asc' },
          },
        },
      }),
      this.prisma.objectiveMastery.findMany({
        where: { userId },
        orderBy: { lastPracticed: 'desc' },
      }),
    ]);

    if (!plan) return null;

    // Derive masteryStatus on each record using the central threshold
    const objectiveMasteries: ObjectiveMasteryRecord[] = rawMasteries.map((m) => ({
      id: m.id,
      objective: m.objective,
      masteryScore: m.masteryScore,
      accuracy: m.accuracy,
      attemptsCount: m.attemptsCount,
      lastPracticed: m.lastPracticed,
      masteryStatus: deriveMasteryStatus(m),
    }));

    return {
      ...plan,
      objectiveMasteries,
      objectiveMasteryThreshold: OBJECTIVE_MASTERY_THRESHOLD,
    };
  }

  async deletePlansByUserId(userId: string) {
    return this.prisma.studyPlan.deleteMany({
      where: { userId },
    });
  }

  /**
   * Create or upsert an active study plan.
   *
   * Key invariants:
   * 1. COMPLETED days are never modified.
   * 2. Days with ANY session activity (LessonSession | ConversationSession | LearningSession)
   *    are never modified – regardless of their `status` field.
   * 3. planVersion is incremented only when at least one updatable day has its
   *    curriculum content (title | lessonType | lessonContent) actually changed.
   * 4. Initial creation always starts at planVersion = 1.
   */
  async createStudyPlan(userId: string, dto: CreateStudyPlanDto) {
    return this.prisma.$transaction(async (tx: any) => {
      // Find if an active plan exists
      let plan = await tx.studyPlan.findFirst({
        where: { userId },
        include: { days: true },
      });

      if (plan) {
        const existingDays: any[] = plan.days;
        const updatedDays: any[] = [];
        let curriculumActuallyChanged = false;

        // Batch query active session IDs across all days in a single roundtrip
        const existingDayIds = existingDays.map((d: any) => d.id);
        const [activeLessonSessions, activeConvSessions, activeLearningSessions] = await Promise.all([
          tx.lessonSession.findMany({ where: { dayId: { in: existingDayIds } }, select: { dayId: true } }),
          tx.conversationSession.findMany({ where: { lessonId: { in: existingDayIds } }, select: { lessonId: true } }),
          tx.learningSession.findMany({ where: { studyPlanDayId: { in: existingDayIds } }, select: { studyPlanDayId: true } }),
        ]);

        const activeDayIdSet = new Set<string>([
          ...activeLessonSessions.map((s: any) => s.dayId).filter(Boolean),
          ...activeConvSessions.map((s: any) => s.lessonId).filter(Boolean),
          ...activeLearningSessions.map((s: any) => s.studyPlanDayId).filter(Boolean),
        ]);

        for (const day of dto.days) {
          const parsedDayNumber = parseInt(day.dayNumber as any, 10);
          const parsedWeekNumber = parseInt(day.weekNumber as any, 10);
          const parsedEstimatedMinutes = parseInt(day.estimatedMinutes as any, 10);

          const existingDay = existingDays.find((d: any) => d.dayNumber === parsedDayNumber);

          if (existingDay) {
            const hasActivity = activeDayIdSet.has(existingDay.id);

            // Never touch completed days or days with any recorded activity
            if (existingDay.status === 'COMPLETED' || hasActivity) {
              updatedDays.push(existingDay);
              continue;
            }

            // Check if the incoming content actually differs from what's stored
            const contentChanged =
              existingDay.title !== day.title ||
              existingDay.lessonType !== day.lessonType ||
              existingDay.lessonContent !== day.lessonContent;

            if (contentChanged) {
              curriculumActuallyChanged = true;
              const updated = await tx.studyPlanDay.update({
                where: { id: existingDay.id },
                data: {
                  title: day.title,
                  weekNumber: parsedWeekNumber,
                  estimatedMinutes: parsedEstimatedMinutes,
                  lessonType: day.lessonType,
                  lessonContent: day.lessonContent,
                },
              });
              updatedDays.push(updated);
            } else {
              // Content identical — keep the existing record unchanged
              updatedDays.push(existingDay);
            }
          } else {
            // New day (shouldn't normally happen on adaptive update, but handle gracefully)
            const created = await tx.studyPlanDay.create({
              data: {
                studyPlanId: plan.id,
                dayNumber: parsedDayNumber,
                weekNumber: parsedWeekNumber,
                title: day.title,
                estimatedMinutes: parsedEstimatedMinutes,
                lessonType: day.lessonType,
                lessonContent: day.lessonContent,
                status: parsedDayNumber === 1 ? StudyPlanDayStatus.AVAILABLE : StudyPlanDayStatus.LOCKED,
              },
            });
            updatedDays.push(created);
            curriculumActuallyChanged = true;
          }
        }

        // Update plan metadata; only increment version when curriculum actually changed
        const nextVersion = curriculumActuallyChanged ? (plan.planVersion || 1) + 1 : (plan.planVersion || 1);

        plan = await tx.studyPlan.update({
          where: { id: plan.id },
          data: {
            title: dto.title,
            description: dto.description,
            durationWeeks: dto.durationWeeks,
            weeksMetadata: dto.weeksMetadata,
            planVersion: nextVersion,
            lastAdaptedAt: curriculumActuallyChanged ? new Date() : plan.lastAdaptedAt,
          },
          include: { days: true },
        });

        updatedDays.sort((a, b) => a.dayNumber - b.dayNumber);
        return { ...plan, days: updatedDays };
      } else {
        // Create new plan — always version 1
        const createdPlan = await tx.studyPlan.create({
          data: {
            userId,
            title: dto.title,
            description: dto.description,
            durationWeeks: dto.durationWeeks,
            weeksMetadata: dto.weeksMetadata,
            planVersion: 1,
            lastAdaptedAt: new Date(),
            days: {
              create: dto.days.map((day) => {
                const parsedDayNumber = parseInt(day.dayNumber as any, 10);
                const parsedWeekNumber = parseInt(day.weekNumber as any, 10);
                const parsedEstimatedMinutes = parseInt(day.estimatedMinutes as any, 10);
                return {
                  dayNumber: parsedDayNumber,
                  weekNumber: parsedWeekNumber,
                  title: day.title,
                  estimatedMinutes: parsedEstimatedMinutes,
                  lessonType: day.lessonType,
                  lessonContent: day.lessonContent,
                  status: parsedDayNumber === 1 ? StudyPlanDayStatus.AVAILABLE : StudyPlanDayStatus.LOCKED,
                };
              }),
            },
          },
          include: {
            days: { orderBy: { dayNumber: 'asc' } },
          },
        });
        return createdPlan;
      }
    }, { timeout: 30000, maxWait: 10000 });
  }

  async findDayById(dayId: string) {
    return this.prisma.studyPlanDay.findUnique({
      where: { id: dayId },
      include: { studyPlan: true },
    });
  }

  async completeDay(userId: string, dayId: string) {
    return this.prisma.$transaction(async (tx: any) => {
      // 1. Fetch day details
      const day = await tx.studyPlanDay.findUnique({
        where: { id: dayId },
        include: { studyPlan: true },
      });

      if (!day || day.studyPlan.userId !== userId) {
        throw new Error('Study plan day not found or unauthorized');
      }

      if (day.status === StudyPlanDayStatus.COMPLETED) {
        return day;
      }

      // 2. Mark day as COMPLETED
      const updatedDay = await tx.studyPlanDay.update({
        where: { id: dayId },
        data: { status: StudyPlanDayStatus.COMPLETED },
      });

      // 3. Unlock the next day
      const nextDayNumber = day.dayNumber + 1;
      const nextDay = await tx.studyPlanDay.findFirst({
        where: {
          studyPlanId: day.studyPlanId,
          dayNumber: nextDayNumber,
        },
      });

      if (nextDay && nextDay.status === StudyPlanDayStatus.LOCKED) {
        await tx.studyPlanDay.update({
          where: { id: nextDay.id },
          data: { status: StudyPlanDayStatus.AVAILABLE },
        });
      }

      // 4. Update Daily Learning Log
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      await tx.dailyLearningLog.upsert({
        where: { userId_date: { userId, date: todayDate } },
        create: {
          userId,
          date: todayDate,
          minutesStudied: day.estimatedMinutes,
          completedTasks: 1,
          completedLessons: day.lessonType.toLowerCase() === 'vocabulary' || day.lessonType.toLowerCase() === 'grammar' ? 1 : 0,
        },
        update: {
          minutesStudied: { increment: day.estimatedMinutes },
          completedTasks: { increment: 1 },
          completedLessons: day.lessonType.toLowerCase() === 'vocabulary' || day.lessonType.toLowerCase() === 'grammar' ? { increment: 1 } : undefined,
        },
      });

      // 5. Update Learning Progress
      const allDays = await tx.studyPlanDay.findMany({
        where: { studyPlanId: day.studyPlanId },
      });

      const completedDaysCount = allDays.filter((d: any) => d.status === StudyPlanDayStatus.COMPLETED).length;
      const totalDaysCount = allDays.length;
      const completionPercentage = totalDaysCount > 0 ? (completedDaysCount / totalDaysCount) * 100 : 0.0;

      const calculatedStreak = await this.calculateStreakInternal(tx, userId);

      await tx.learningProgress.upsert({
        where: { userId },
        create: {
          userId,
          studyMinutes: day.estimatedMinutes,
          lessonsCompleted: day.lessonType.toLowerCase() === 'vocabulary' || day.lessonType.toLowerCase() === 'grammar' ? 1 : 0,
          conversationsCompleted: day.lessonType.toLowerCase() === 'conversation' ? 1 : 0,
          vocabularyLearned: day.lessonType.toLowerCase() === 'vocabulary' ? 5 : 0,
          grammarTopicsCompleted: day.lessonType.toLowerCase() === 'grammar' ? 1 : 0,
          listeningSessions: day.lessonType.toLowerCase() === 'listening' ? 1 : 0,
          streak: calculatedStreak,
          completionPercentage,
        },
        update: {
          studyMinutes: { increment: day.estimatedMinutes },
          lessonsCompleted: day.lessonType.toLowerCase() === 'vocabulary' || day.lessonType.toLowerCase() === 'grammar' ? { increment: 1 } : undefined,
          conversationsCompleted: day.lessonType.toLowerCase() === 'conversation' ? { increment: 1 } : undefined,
          vocabularyLearned: day.lessonType.toLowerCase() === 'vocabulary' ? { increment: 5 } : undefined,
          grammarTopicsCompleted: day.lessonType.toLowerCase() === 'grammar' ? { increment: 1 } : undefined,
          listeningSessions: day.lessonType.toLowerCase() === 'listening' ? { increment: 1 } : undefined,
          streak: calculatedStreak,
          completionPercentage,
        },
      });

      return updatedDay;
    });
  }

  async getLearningProgress(userId: string) {
    return this.prisma.learningProgress.findUnique({ where: { userId } });
  }

  async getDailyLogs(userId: string) {
    return this.prisma.dailyLearningLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 7,
    });
  }

  private async calculateStreakInternal(tx: any, userId: string): Promise<number> {
    const logs = await tx.dailyLearningLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    if (logs.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const latestLogDate = new Date(logs[0].date);
    latestLogDate.setHours(0, 0, 0, 0);

    if (latestLogDate.getTime() !== today.getTime()) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (latestLogDate.getTime() !== yesterday.getTime()) {
        return 0;
      }
    }

    let expectedDate = latestLogDate;
    for (const log of logs) {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      if (logDate.getTime() === expectedDate.getTime()) {
        streak++;
        expectedDate = new Date(expectedDate);
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }
}

export const studyPlanRepository = new StudyPlanRepository();
