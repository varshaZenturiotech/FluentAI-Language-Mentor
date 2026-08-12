import { prisma } from '../database/prisma';
import { studyPlanService, StudyPlanService } from './study-plan.service';
import { studyPlanRepository } from '../repositories/study-plan.repository';

export class DashboardService {
  private readonly planService = studyPlanService;
  private readonly planRepo = studyPlanRepository;

  public async getDashboardData(userId: string) {
    // 1. Fetch User & Profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    // 2. Fetch Learning Profile
    const learningProfile = await prisma.learningProfile.findUnique({
      where: { userId },
      include: {
        goals: true,
        interests: true,
      },
    });

    // If onboarding is not completed, return early so the UI shows onboarding CTA
    if (!learningProfile || !learningProfile.onboardingCompleted) {
      return {
        onboardingCompleted: false,
      };
    }

    // 3. Fetch or Auto-Generate Study Plan
    let studyPlan = await this.planRepo.findActivePlanByUserId(userId);
    let planGenerationStatus: 'ready' | 'generating' | 'failed' = 'ready';
    let planGenerationError: string | null = null;

    if (!studyPlan) {
      const isGenerating = StudyPlanService.isGenerating(userId);
      const recentError = StudyPlanService.getRecentError(userId);

      if (isGenerating) {
        planGenerationStatus = 'generating';
      } else if (recentError) {
        planGenerationStatus = 'failed';
        planGenerationError = recentError;
      } else {
        planGenerationStatus = 'generating';
        // Trigger background generation without blocking
        this.planService.generatePlan(userId).catch((err) => {
          console.error(`Background study plan generation failed for user ${userId}:`, err);
        });
      }
    }

    // 4. Fetch Progress Summary
    let learningProgress = await this.planRepo.getLearningProgress(userId);
    if (!learningProgress) {
      learningProgress = await prisma.learningProgress.create({
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

    // 5. Gather Today's Plan Tasks
    // We sub-divide the today study plan day or generate 3-4 tasks based on the active day.
    const activeDay = studyPlan?.days?.find((d) => d.status === 'AVAILABLE');
    const todayPlan: any[] = [];

    if (activeDay) {
      // Main day activity
      todayPlan.push({
        id: activeDay.id,
        title: activeDay.title,
        estimatedMinutes: activeDay.estimatedMinutes,
        lessonType: activeDay.lessonType,
        completed: false,
        lessonContent: activeDay.lessonContent,
      });

      // Supporting daily tasks based on the day type
      if (activeDay.lessonType === 'Vocabulary') {
        todayPlan.push({
          id: `supp_conv_${activeDay.id}`,
          title: 'Review Vocabulary with Chat',
          estimatedMinutes: 5,
          lessonType: 'Conversation',
          completed: false,
        });
      } else if (activeDay.lessonType === 'Grammar') {
        todayPlan.push({
          id: `supp_list_${activeDay.id}`,
          title: 'Grammar Pronunciation practice',
          estimatedMinutes: 5,
          lessonType: 'Listening',
          completed: false,
        });
      } else {
        todayPlan.push({
          id: `supp_vocab_${activeDay.id}`,
          title: 'Review related keywords',
          estimatedMinutes: 5,
          lessonType: 'Vocabulary',
          completed: false,
        });
      }
    } else {
      // If all tasks are completed, automatically suggest review/practice tasks
      todayPlan.push({
        id: 'review_vocab',
        title: 'Review Saved Vocabulary',
        estimatedMinutes: 10,
        lessonType: 'Vocabulary',
        completed: false,
      });
      todayPlan.push({
        id: 'practice_speech',
        title: 'Practice Everyday Pronunciation',
        estimatedMinutes: 5,
        lessonType: 'Listening',
        completed: false,
      });
      todayPlan.push({
        id: 'chat_session',
        title: 'Start custom voice session',
        estimatedMinutes: 10,
        lessonType: 'Conversation',
        completed: false,
      });
    }

    // 6. Gather Weekly Activity data (last 7 days of logs)
    const logs = await prisma.dailyLearningLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 7,
    });

    const weeklyActivity = {
      dailyMinutes: [0, 0, 0, 0, 0, 0, 0],
      xpEarned: [0, 0, 0, 0, 0, 0, 0],
      lessonsCompleted: [0, 0, 0, 0, 0, 0, 0],
      conversationsCompleted: [0, 0, 0, 0, 0, 0, 0],
    };

    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday...

    for (let idx = 0; idx < 7; idx++) {
      // Offset relative to current day of week (1=Mon, 2=Tue... 7=Sun)
      const dayOffset = idx + 1 - (currentDayOfWeek === 0 ? 7 : currentDayOfWeek);
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + dayOffset);
      const targetDateString = targetDate.toISOString().split('T')[0];

      const matchingLog = logs.find((log) => {
        const logDateStr = new Date(log.date).toISOString().split('T')[0];
        return logDateStr === targetDateString;
      });

      if (matchingLog) {
        weeklyActivity.dailyMinutes[idx] = matchingLog.minutesStudied;
        // Simple XP estimate: 10 XP per minute studied
        weeklyActivity.xpEarned[idx] = matchingLog.minutesStudied * 10;
        weeklyActivity.lessonsCompleted[idx] = matchingLog.completedLessons;
        // Assuming tasks represent conversation completion if tasks > lessons
        weeklyActivity.conversationsCompleted[idx] = Math.max(0, matchingLog.completedTasks - matchingLog.completedLessons);
      }
    }

    // 7. Dynamic Greeting
    const hour = new Date().getHours();
    let timeGreeting = 'Good Morning';
    if (hour >= 12 && hour < 17) timeGreeting = 'Good Afternoon';
    else if (hour >= 17) timeGreeting = 'Good Evening';

    // Calculate current study week
    let currentWeek = 1;
    if (activeDay) {
      currentWeek = Math.ceil(activeDay.dayNumber / 7);
    } else if (studyPlan && studyPlan.days.length > 0) {
      currentWeek = 4; // completed all
    }

    const greeting = {
      text: `${timeGreeting}, ${user?.name || 'Learner'}!`,
      subtext: studyPlan
        ? `Today you'll continue Week ${currentWeek} of your AI English Journey.`
        : 'Let\'s get started with your study path today.',
      todayGoalMinutes: learningProfile.dailyLearningGoal || 15,
      currentStreak: learningProgress.streak,
      completionPercentage: Math.round(learningProgress.completionPercentage),
      currentWeek,
    };

    // 8. XP System details
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayLog = logs.find((l) => new Date(l.date).getTime() >= todayStart.getTime());
    const todayMinutes = todayLog ? todayLog.minutesStudied : 0;
    const todayXP = todayMinutes * 10; // 10 XP per minute studied

    const totalXP = user?.profile?.totalXP || 0;
    const dailyGoalMinutes = learningProfile.dailyLearningGoal || 15;
    const dailyGoalXp = dailyGoalMinutes * 10;

    const xp = {
      totalXP,
      todayXP,
      dailyGoalXp,
      weeklyChallengeCompleted: learningProgress.lessonsCompleted >= 4,
    };

    // 9. Streak Object
    const streak = {
      streak: learningProgress.streak,
      active: learningProgress.streak > 0,
    };

    // 10. Dynamic Recommended Lessons based on Occupation / Profile
    const occupation = learningProfile.occupation?.toLowerCase() || 'general';
    const recommendedLessons: any[] = [];

    if (occupation.includes('engineer') || occupation.includes('software') || occupation.includes('tech') || occupation.includes('developer')) {
      recommendedLessons.push(
        { id: 'rec_1', title: 'Business Meeting', estimatedMinutes: 15, lessonType: 'Conversation', reason: 'Master conflict resolution and product demos.' },
        { id: 'rec_2', title: 'Code Review Discussion', estimatedMinutes: 10, lessonType: 'Vocabulary', reason: 'Review key expressions for giving feedback.' },
        { id: 'rec_3', title: 'Sprint Planning', estimatedMinutes: 10, lessonType: 'Grammar', reason: 'Use passive voice and estimates effectively.' },
        { id: 'rec_4', title: 'Email Writing', estimatedMinutes: 10, lessonType: 'Review', reason: 'Draft precise status update emails.' }
      );
    } else if (occupation.includes('student') || occupation.includes('college') || occupation.includes('school')) {
      recommendedLessons.push(
        { id: 'rec_1', title: 'Classroom Conversation', estimatedMinutes: 10, lessonType: 'Conversation', reason: 'Practice speaking with professors and classmates.' },
        { id: 'rec_2', title: 'Presentation Skills', estimatedMinutes: 15, lessonType: 'Listening', reason: 'Study effective slide transition hooks.' },
        { id: 'rec_3', title: 'Exam Preparation', estimatedMinutes: 15, lessonType: 'Review', reason: 'Prepare for essay structures and logic flow.' }
      );
    } else if (occupation.includes('travel') || occupation.includes('explore') || occupation.includes('tourist')) {
      recommendedLessons.push(
        { id: 'rec_1', title: 'Airport Conversation', estimatedMinutes: 10, lessonType: 'Conversation', reason: 'Practice baggage claims and customs.' },
        { id: 'rec_2', title: 'Hotel Check-in', estimatedMinutes: 10, lessonType: 'Vocabulary', reason: 'Vocabulary for accommodation amenities.' },
        { id: 'rec_3', title: 'Restaurant English', estimatedMinutes: 10, lessonType: 'Listening', reason: 'Review listening exercises for food orders.' }
      );
    } else {
      recommendedLessons.push(
        { id: 'rec_1', title: 'Daily Conversation', estimatedMinutes: 10, lessonType: 'Conversation', reason: 'Practice casual greetings and chatting.' },
        { id: 'rec_2', title: 'Workplace Introduction', estimatedMinutes: 15, lessonType: 'Vocabulary', reason: 'How to introduce yourself in new environments.' },
        { id: 'rec_3', title: 'Giving Presentations', estimatedMinutes: 15, lessonType: 'Grammar', reason: 'Practice presenting data points and stats.' }
      );
    }

    // 11. Recent Mistakes (actual grammar mistakes & vocabulary gaps + pronunciation tips)
    const dbMistakes = await prisma.grammarMistake.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const dbVocab = await prisma.vocabulary.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const grammarMistakes = dbMistakes.map((m) => ({
      topic: m.explanation?.split('.')[0] || 'Verb agreement',
      count: 1,
      example: m.sentence,
      correction: m.correctSentence,
    }));

    // Add Malayalam speaker pronunciation helpers
    const pronunciationMistakes = [
      { word: 'Schedule', score: 68 },
      { word: 'Comfortable', score: 72 },
      { word: 'Development', score: 70 },
    ];

    const recentMistakes = {
      grammar: grammarMistakes.length > 0 ? grammarMistakes : [
        { topic: 'Present Perfect', count: 2, example: 'I have went to the market yesterday.', correction: 'I went to the market yesterday.' },
        { topic: 'Subject-Verb Agreement', count: 1, example: 'He speak English very well.', correction: 'He speaks English very well.' }
      ],
      vocabulary: dbVocab.map((v) => ({
        word: v.word,
        meaning: v.meaning,
        usage: v.example,
      })),
      pronunciation: pronunciationMistakes,
    };

    // 12. Dynamic AI Recommendations Focus
    let recs: any = null;
    try {
      recs = await this.planService.getRecommendations(userId);
    } catch (err) {
      console.warn('Could not retrieve AI recommendations for dashboard:', err);
    }

    const recommendations = recs ? [recs] : [
      {
        focus: 'Practice workplace conversations.',
        reason: 'You struggled with subject-verb agreement in your last discussion.',
        vocabulary: ['Sprint', 'Deadline', 'Deployment', 'Repository'],
      },
    ];

    return {
      onboardingCompleted: true,
      greeting,
      studyPlan,
      planGenerationStatus,
      planGenerationError,
      todayPlan,
      weeklyActivity,
      learningProgress,
      xp,
      streak,
      recommendedLessons,
      recentMistakes,
      recommendations,
    };
  }
}

export const dashboardService = new DashboardService();
