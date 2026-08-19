import { prisma } from '../database/prisma';
import { fastApiClient } from '../clients/fastapi.client';
import { logger } from '../utils/logger';

export class LearningMemoryService {
  /**
   * Per-session job queues for serializing analysis runs
   * Note: sessionJobQueues provides process-local in-memory serialization.
   * If scaling horizontally across multiple Node instances, a distributed lock (e.g. Redis) is required.
   */
  private readonly sessionJobQueues = new Map<string, Promise<void>>();

  /**
   * Queue analysis job asynchronously
   */
  public async queueAnalysisJob(
    userId: string,
    sessionId: string,
    studyPlanDayId?: string,
    isFinal: boolean = false
  ): Promise<void> {
    logger.info(`Queued AI Session Analysis Job (isFinal=${isFinal}) for session: ${sessionId}, user: ${userId}`);

    const existingPromise = this.sessionJobQueues.get(sessionId) || Promise.resolve();

    const newPromise = (async () => {
      try {
        await existingPromise;
      } catch (err) {
        // Ignore errors from previous job in queue
      }
      await this.analyzeSessionInBackground(userId, sessionId, studyPlanDayId, isFinal);
    })();

    this.sessionJobQueues.set(sessionId, newPromise);

    newPromise.finally(() => {
      if (this.sessionJobQueues.get(sessionId) === newPromise) {
        this.sessionJobQueues.delete(sessionId);
      }
    });

    return newPromise;
  }

  /**
   * Background runner for session analysis
   */
  private async analyzeSessionInBackground(
    userId: string,
    sessionId: string,
    studyPlanDayId?: string,
    isFinal: boolean = false
  ): Promise<void> {
    logger.info(`Starting background analysis (isFinal=${isFinal}) for session: ${sessionId}`);

    // 1. Fetch Session and Messages
    const session = await prisma.conversationSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!session) {
      logger.error(`Session ${sessionId} not found for analysis`);
      return;
    }

    // Check if session was already finalized in DB
    const wasAlreadyFinalized = session.status === 'COMPLETED';

    const existingSession = await prisma.learningSession.findFirst({
      where: { sessionId },
    });

    // 2. Fetch User Profile
    const profile = await prisma.learningProfile.findUnique({
      where: { userId },
      include: { goals: true, interests: true },
    });

    if (!profile) {
      logger.error(`Learning profile for user ${userId} not found`);
      return;
    }

    // 3. Fetch current Study Plan
    const studyPlan = await prisma.studyPlan.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // 4. Fetch Weak Topics and Recent Vocab
    const weakTopicsDb = await prisma.weakTopic.findMany({
      where: { userId, status: 'active' },
      select: { topic: true },
      take: 10,
    });
    const weakTopicsList = weakTopicsDb.map((t) => t.topic);

    const recentVocabDb = await prisma.vocabularyProgress.findMany({
      where: { userId },
      orderBy: { lastReviewed: 'desc' },
      select: { word: true },
      take: 10,
    });
    const recentVocabList = recentVocabDb.map((v) => v.word);

    // 5. Fetch previous session summary
    const prevSession = await prisma.learningSession.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const prevSummary = prevSession ? prevSession.recommendations : null;

    // 6. Format messages list for FastAPI payload
    const formattedMessages = session.messages.map((m) => ({
      role: m.role.toLowerCase(),
      content: m.content,
    }));

    // 7. Invoke FastAPI Gateway Analyzer
    const gatewayPayload = {
      profile: {
        occupation: profile.occupation || 'Professional',
        englishLevel: profile.englishLevel,
        nativeLanguage: profile.nativeLanguage,
        goals: profile.goals.map((g) => g.goal),
        interests: profile.interests.map((i) => i.interest),
      },
      study_plan: studyPlan ? { title: studyPlan.title, description: studyPlan.description } : null,
      current_lesson: session.title,
      weak_topics: weakTopicsList,
      recent_vocab: recentVocabList,
      prev_summary: prevSummary,
      messages: formattedMessages,
    };

    const analysisResult = await fastApiClient.analyzeSession(gatewayPayload, undefined, userId);

    if (!analysisResult) {
      logger.error('FastAPI returned empty analysis result');
      return;
    }

    // 8. Extract analysis details
    const studyMinutes = Number(analysisResult.studyMinutes) || 15;
    const grammarScore = Number(analysisResult.grammarScore) || 75;
    const vocabularyScore = Number(analysisResult.vocabularyScore) || 70;
    const fluencyScore = Number(analysisResult.fluencyScore) || 70;
    const confidenceScore = Number(analysisResult.confidenceScore) || 75;
    const pronunciationScore = Number(analysisResult.pronunciationScore) || 60;
    const lessonCompletion = Number(analysisResult.lessonCompletion) || 100;

    const weakTopics = analysisResult.weakTopics || [];
    const newWords = analysisResult.newWords || [];
    const masteredWords = analysisResult.masteredWords || [];
    const grammarMistakes = analysisResult.grammarMistakes || [];
    const completedObjectives = analysisResult.completedObjectives || [];
    const recommendedTopics = analysisResult.recommendedTopics || [];

    const recommendationsText = JSON.stringify({
      focus: recommendedTopics[0] || 'Focus on fluency in professional conversation',
      reason: `Based on your recent scores: grammar (${grammarScore}%), vocabulary (${vocabularyScore}%).`,
      vocabulary: newWords.slice(0, 5),
    });

    // 9. Save or update Learning Session Record
    let learningSessionRecord;
    if (existingSession) {
      learningSessionRecord = await prisma.learningSession.update({
        where: { id: existingSession.id },
        data: {
          studyPlanDayId: studyPlanDayId || existingSession.studyPlanDayId,
          studyMinutes,
          grammarScore,
          vocabularyScore,
          fluencyScore,
          confidenceScore,
          pronunciationScore,
          lessonCompletionPercentage: lessonCompletion,
          completedTasks: completedObjectives.join(', '),
          weakTopics: JSON.stringify(weakTopics),
          newWords: JSON.stringify(newWords),
          recommendations: recommendationsText,
        },
      });
      logger.info(`Successfully updated learning session record: ${learningSessionRecord.id}`);
    } else {
      learningSessionRecord = await prisma.learningSession.create({
        data: {
          userId,
          sessionId,
          studyPlanDayId: studyPlanDayId || null,
          studyMinutes,
          grammarScore,
          vocabularyScore,
          fluencyScore,
          confidenceScore,
          pronunciationScore,
          lessonCompletionPercentage: lessonCompletion,
          completedTasks: completedObjectives.join(', '),
          weakTopics: JSON.stringify(weakTopics),
          newWords: JSON.stringify(newWords),
          recommendations: recommendationsText,
        },
      });
      logger.info(`Successfully created learning session record: ${learningSessionRecord.id}`);
    }

    // 10. Update study duration on the conversation session itself
    if (isFinal) {
      await prisma.conversationSession.update({
        where: { id: sessionId },
        data: {
          durationMinutes: studyMinutes,
          status: 'COMPLETED',
          endedAt: new Date(),
        },
      });
    } else {
      await prisma.conversationSession.update({
        where: { id: sessionId },
        data: {
          durationMinutes: studyMinutes,
        },
      });
    }

    // 11. Save Grammar Mistakes (GrammarMistake table)
    if (grammarMistakes && grammarMistakes.length > 0) {
      for (const mistake of grammarMistakes) {
        await prisma.grammarMistake.create({
          data: {
            userId,
            sentence: mistake.sentence || 'Unknown',
            correctSentence: mistake.correctSentence || 'Unknown',
            explanation: mistake.explanation || '',
            grammarRule: mistake.grammarRule || 'General',
            mistakeType: mistake.mistakeType || 'Grammar',
          },
        });

        // Add mistake to WeakTopics automatically
        const topicName = mistake.grammarRule || 'General Grammar';
        await prisma.weakTopic.upsert({
          where: { userId_topic: { userId, topic: topicName } },
          create: {
            userId,
            topic: topicName,
            mistakeCount: 1,
            improvementScore: 0,
            status: 'active',
            lastPracticed: new Date(),
          },
          update: {
            mistakeCount: { increment: 1 },
            lastPracticed: new Date(),
          },
        });
      }
    }

    // 12. Save Weak Topics
    for (const topic of weakTopics) {
      await prisma.weakTopic.upsert({
        where: { userId_topic: { userId, topic } },
        create: {
          userId,
          topic,
          mistakeCount: 1,
          improvementScore: 0,
          status: 'active',
          lastPracticed: new Date(),
        },
        update: {
          lastPracticed: new Date(),
        },
      });
    }

    // 13. Save Vocabulary Progress (new and mastered words)
    for (const w of newWords) {
      await prisma.vocabularyProgress.upsert({
        where: { userId_word: { userId, word: w } },
        create: {
          userId,
          word: w,
          meaning: 'Added via AI analysis',
          timesSeen: 1,
          timesCorrect: 0,
          masteryPercentage: 0,
          status: 'new',
          lastReviewed: new Date(),
        },
        update: {
          timesSeen: { increment: 1 },
          lastReviewed: new Date(),
        },
      });
    }

    for (const w of masteredWords) {
      await prisma.vocabularyProgress.upsert({
        where: { userId_word: { userId, word: w } },
        create: {
          userId,
          word: w,
          meaning: 'Mastered via AI analysis',
          timesSeen: 1,
          timesCorrect: 1,
          masteryPercentage: 100,
          status: 'mastered',
          lastReviewed: new Date(),
        },
        update: {
          timesSeen: { increment: 1 },
          timesCorrect: { increment: 1 },
          masteryPercentage: 100,
          status: 'mastered',
          lastReviewed: new Date(),
        },
      });
    }

    // Count user messages in this session
    const userMessagesCount = session.messages.filter((m) => m.role === 'USER').length;

    // Check completion criteria:
    // AI marks lesson completed (e.g. analysisResult.completed === true or lessonCompletion >= 80)
    // AND user has sent at least 4 messages AND isFinal is true!
    const isAiCompleted = analysisResult.completed === true || Number(analysisResult.lessonCompletion) >= 80;
    const isCompleted = isFinal && isAiCompleted && userMessagesCount >= 4;

    // 14. Unlock Study Plan Day Tasks & recalculate study plan completion percentage
    let isDayCompleted = false;
    if (studyPlanDayId && isCompleted && !wasAlreadyFinalized) {
      const currentDay = await prisma.studyPlanDay.findUnique({
        where: { id: studyPlanDayId },
      });

      if (currentDay && currentDay.status !== 'COMPLETED') {
        await prisma.studyPlanDay.update({
          where: { id: studyPlanDayId },
          data: { status: 'COMPLETED' },
        });
        isDayCompleted = true;

        // Auto unlock next day
        const nextDay = await prisma.studyPlanDay.findFirst({
          where: { studyPlanId: currentDay.studyPlanId, dayNumber: currentDay.dayNumber + 1 },
        });
        if (nextDay && nextDay.status === 'LOCKED') {
          await prisma.studyPlanDay.update({
            where: { id: nextDay.id },
            data: { status: 'AVAILABLE' },
          });
        }
      }
    }

    // Update LessonSession status if it exists
    if (studyPlanDayId) {
      const lessonSession = await prisma.lessonSession.findFirst({
        where: { userId, dayId: studyPlanDayId },
      });
      if (lessonSession) {
        const isNowCompleted = isCompleted || lessonSession.status === 'COMPLETED';
        await prisma.lessonSession.update({
          where: { id: lessonSession.id },
          data: {
            status: isNowCompleted ? 'COMPLETED' : 'IN_PROGRESS',
            completedAt: isNowCompleted ? (lessonSession.completedAt || new Date()) : null,
            duration: studyMinutes,
            completionPercentage: Number(analysisResult.lessonCompletion) || 0.0,
            aiSummary: analysisResult.recommendation || '',
            xpEarned: isNowCompleted ? 20 : 0,
          },
        });
      }
    }

    // 15. XP calculation - ONLY award XP if isFinal === true AND session was not already finalized!
    if (!isFinal || wasAlreadyFinalized) {
      logger.info(`Skipping XP award for session ${sessionId} (isFinal=${isFinal}, wasAlreadyFinalized=${wasAlreadyFinalized})`);
      return;
    }

    // 15. XP calculation
    // Conversation -> 20 XP, Vocabulary -> 10 XP, Grammar -> 15 XP, Pronunciation -> 20 XP, Quiz -> 25 XP, Daily Goal Complete -> 50 XP
    let sessionXp = 20;
    const typeStr = session.lessonType || 'Conversation';
    if (typeStr.toLowerCase().includes('vocab')) {
      sessionXp = 10;
    } else if (typeStr.toLowerCase().includes('gram')) {
      sessionXp = 15;
    } else if (typeStr.toLowerCase().includes('pron')) {
      sessionXp = 20;
    } else if (typeStr.toLowerCase().includes('quiz')) {
      sessionXp = 25;
    }

    // If it's a study plan lesson, only award the XP if they successfully completed the lesson.
    if (studyPlanDayId && !isCompleted) {
      sessionXp = 0;
    }

    // Check Daily Goal Complete XP reward
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyLog = await prisma.dailyLearningLog.upsert({
      where: { userId_date: { userId, date: today } },
      create: {
        userId,
        date: today,
        minutesStudied: studyMinutes,
        completedLessons: isDayCompleted ? 1 : 0,
        completedTasks: 1,
      },
      update: {
        minutesStudied: { increment: studyMinutes },
        completedLessons: isDayCompleted ? { increment: 1 } : undefined,
        completedTasks: { increment: 1 },
      },
    });

    let extraDailyXp = 0;
    // If daily goal just reached
    if (dailyLog.minutesStudied >= profile.dailyLearningGoal && dailyLog.minutesStudied - studyMinutes < profile.dailyLearningGoal) {
      extraDailyXp = 50;
      logger.info(`User ${userId} completed their daily study goal! +50 XP rewarded.`);
    }

    const totalXpAwarded = sessionXp + extraDailyXp;

    // 16. Update User profile totalXP
    await prisma.profile.update({
      where: { userId },
      data: {
        totalXP: { increment: totalXpAwarded },
      },
    });

    // 17. Streak System
    // Only increment/maintain streak if lesson was completed OR if it is a generic (non-lesson) chat.
    const shouldUpdateStreakAndProgress = !studyPlanDayId || isCompleted;

    const currentProgress = await prisma.learningProgress.findUnique({
      where: { userId },
    });

    let newStreak = currentProgress ? currentProgress.streak : 0;
    const nowTime = new Date();
    nowTime.setHours(0, 0, 0, 0);

    if (shouldUpdateStreakAndProgress) {
      if (currentProgress && currentProgress.lastLearningDate) {
        const lastDate = new Date(currentProgress.lastLearningDate);
        lastDate.setHours(0, 0, 0, 0);

        const diffTime = Math.abs(nowTime.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          // Studied today already: keep streak
          newStreak = currentProgress.streak;
        } else if (diffDays === 1) {
          // Studied yesterday: increment streak
          newStreak = currentProgress.streak + 1;
        } else if (diffDays === 2) {
          // Missed one day: keep streak
          newStreak = currentProgress.streak;
        } else {
          // Missed two or more days: reset streak to 1
          newStreak = 1;
        }
      } else {
        // First study event: set streak to 1
        newStreak = 1;
      }
    }

    // 18. Recalculate overall study plan percentage
    let completionPercentage = 0;
    if (studyPlan) {
      const planDays = await prisma.studyPlanDay.findMany({
        where: { studyPlanId: studyPlan.id },
      });
      const completed = planDays.filter((d) => d.status === 'COMPLETED').length;
      completionPercentage = planDays.length > 0 ? (completed / planDays.length) * 100 : 0;
    }

    // 19. Update Learning Progress table
    const level = Math.floor((currentProgress ? currentProgress.studyMinutes + totalXpAwarded : totalXpAwarded) / 100) + 1;

    const lessonsCompletedInc = isDayCompleted ? 1 : 0;
    const conversationsCompletedInc = (shouldUpdateStreakAndProgress && typeStr.toLowerCase().includes('conversation')) ? 1 : 0;
    const vocabularyCompletedInc = (shouldUpdateStreakAndProgress && typeStr.toLowerCase().includes('vocab')) ? 1 : 0;
    const grammarCompletedInc = (shouldUpdateStreakAndProgress && typeStr.toLowerCase().includes('grammar')) ? 1 : 0;
    const pronunciationCompletedInc = (shouldUpdateStreakAndProgress && typeStr.toLowerCase().includes('pron')) ? 1 : 0;
    const listeningCompletedInc = (shouldUpdateStreakAndProgress && typeStr.toLowerCase().includes('listen')) ? 1 : 0;
    const quizCompletedInc = (shouldUpdateStreakAndProgress && typeStr.toLowerCase().includes('quiz')) ? 1 : 0;

    await prisma.learningProgress.upsert({
      where: { userId },
      create: {
        userId,
        lessonsCompleted: lessonsCompletedInc,
        conversationsCompleted: conversationsCompletedInc,
        vocabularyLearned: vocabularyCompletedInc,
        grammarTopicsCompleted: grammarCompletedInc,
        listeningSessions: listeningCompletedInc,
        pronunciationSessions: pronunciationCompletedInc,
        quizzesCompleted: quizCompletedInc,
        studyMinutes,
        streak: newStreak,
        completionPercentage,
        currentLevel: profile.englishLevel,
        totalMinutes: studyMinutes,
        grammarCompleted: grammarCompletedInc,
        vocabularyCompleted: vocabularyCompletedInc,
        pronunciationCompleted: pronunciationCompletedInc,
        listeningCompleted: listeningCompletedInc,
        quizCompleted: quizCompletedInc,
        lastLearningDate: shouldUpdateStreakAndProgress ? new Date() : (currentProgress?.lastLearningDate ?? new Date()),
        overallProgress: completionPercentage,
        xp: totalXpAwarded,
        level: level,
      },
      update: {
        lessonsCompleted: { increment: lessonsCompletedInc },
        conversationsCompleted: { increment: conversationsCompletedInc },
        vocabularyLearned: { increment: vocabularyCompletedInc },
        grammarTopicsCompleted: { increment: grammarCompletedInc },
        listeningSessions: { increment: listeningCompletedInc },
        pronunciationSessions: { increment: pronunciationCompletedInc },
        quizzesCompleted: { increment: quizCompletedInc },
        studyMinutes: { increment: studyMinutes },
        streak: newStreak,
        completionPercentage,
        currentLevel: profile.englishLevel,
        totalMinutes: { increment: studyMinutes },
        grammarCompleted: { increment: grammarCompletedInc },
        vocabularyCompleted: { increment: vocabularyCompletedInc },
        pronunciationCompleted: { increment: pronunciationCompletedInc },
        listeningCompleted: { increment: listeningCompletedInc },
        quizCompleted: { increment: quizCompletedInc },
        lastLearningDate: shouldUpdateStreakAndProgress ? new Date() : undefined,
        overallProgress: completionPercentage,
        xp: { increment: totalXpAwarded },
        level: level,
      },
    });

    // Objective Mastery tracking
    if (completedObjectives && completedObjectives.length > 0) {
      const sessionAccuracy = Math.round((grammarScore + fluencyScore + confidenceScore) / 3);
      for (const obj of completedObjectives) {
        if (!obj || typeof obj !== 'string' || obj.trim() === '') continue;
        const cleanObj = obj.trim();

        const existingMastery = await prisma.objectiveMastery.findUnique({
          where: { userId_objective: { userId, objective: cleanObj } },
        });

        if (existingMastery) {
          const newAttempts = existingMastery.attemptsCount + 1;
          const newAccuracy = Math.round((existingMastery.accuracy * existingMastery.attemptsCount + sessionAccuracy) / newAttempts);
          // Mastery formula: accuracy * (1 - exp(-attempts * 0.4))
          const newMasteryScore = Math.min(100, Math.round(newAccuracy * (1 - Math.exp(-newAttempts * 0.4))));
          await prisma.objectiveMastery.update({
            where: { id: existingMastery.id },
            data: {
              attemptsCount: newAttempts,
              accuracy: newAccuracy,
              masteryScore: newMasteryScore,
              lastPracticed: new Date(),
            },
          });
        } else {
          const initialMastery = Math.round(sessionAccuracy * (1 - Math.exp(-1 * 0.4))); // ~33% of accuracy
          await prisma.objectiveMastery.create({
            data: {
              userId,
              objective: cleanObj,
              attemptsCount: 1,
              accuracy: sessionAccuracy,
              masteryScore: initialMastery,
              lastPracticed: new Date(),
            },
          });
        }
      }
    }

    // Weekly Assessment Compile Check
    if (isDayCompleted && studyPlanDayId) {
      const currentDay = await prisma.studyPlanDay.findUnique({
        where: { id: studyPlanDayId },
      });
      if (currentDay && currentDay.dayNumber % 7 === 0) {
        const weekNum = currentDay.dayNumber / 7;
        // Find all days of this week
        const weekDays = await prisma.studyPlanDay.findMany({
          where: {
            studyPlanId: currentDay.studyPlanId,
            dayNumber: {
              gte: (weekNum - 1) * 7 + 1,
              lte: weekNum * 7
            }
          }
        });
        const weekDayIds = weekDays.map(d => d.id);
        const weekSessions = await prisma.learningSession.findMany({
          where: {
            userId,
            studyPlanDayId: { in: weekDayIds }
          }
        });

        if (weekSessions.length > 0) {
          const avgGrammar = Math.round(weekSessions.reduce((sum, s) => sum + s.grammarScore, 0) / weekSessions.length);
          const avgVocab = Math.round(weekSessions.reduce((sum, s) => sum + s.vocabularyScore, 0) / weekSessions.length);
          const avgSpeaking = Math.round(weekSessions.reduce((sum, s) => sum + s.fluencyScore, 0) / weekSessions.length);
          const avgListening = Math.round(weekSessions.reduce((sum, s) => sum + s.confidenceScore, 0) / weekSessions.length);
          const avgPronunciation = Math.round(weekSessions.reduce((sum, s) => sum + s.pronunciationScore, 0) / weekSessions.length);
          const avgFluency = avgSpeaking;
          const avgWriting = Math.round((avgGrammar + avgVocab) / 2);

          await prisma.weeklyAssessment.upsert({
            where: { userId_weekNumber: { userId, weekNumber: weekNum } },
            create: {
              userId,
              weekNumber: weekNum,
              grammar: avgGrammar,
              speaking: avgSpeaking,
              listening: avgListening,
              writing: avgWriting,
              pronunciation: avgPronunciation,
              fluency: avgFluency,
              feedback: `Excellent work completing Week ${weekNum}! Your average scores: Grammar: ${avgGrammar}%, Vocabulary: ${avgVocab}%, Speaking: ${avgSpeaking}%, Listening: ${avgListening}%.`,
            },
            update: {
              grammar: avgGrammar,
              speaking: avgSpeaking,
              listening: avgListening,
              writing: avgWriting,
              pronunciation: avgPronunciation,
              fluency: avgFluency,
              feedback: `Excellent work completing Week ${weekNum}! Your average scores: Grammar: ${avgGrammar}%, Vocabulary: ${avgVocab}%, Speaking: ${avgSpeaking}%, Listening: ${avgListening}%.`,
            }
          });
          logger.info(`Successfully generated WeeklyAssessment for Week ${weekNum}`);
        }
      }
    }

    logger.info(`AI Session Analysis complete for session: ${sessionId}. Updated user metrics & plan. Completed: ${isCompleted}`);
  }

  public async getLearningAnalytics(userId: string): Promise<any> {
    const sessions = await prisma.learningSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const progress = await prisma.learningProgress.findUnique({
      where: { userId },
    });

    const userProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    const learningProfile = await prisma.learningProfile.findUnique({
      where: { userId },
    });

    const vocabProgress = await prisma.vocabularyProgress.findMany({
      where: { userId },
    });

    const weakTopics = await prisma.weakTopic.findMany({
      where: { userId },
      orderBy: { mistakeCount: 'desc' },
    });

    const dailyLogs = await prisma.dailyLearningLog.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });

    const baseline = await prisma.learnerAssessment.findUnique({
      where: { userId },
    });

    const weeklyAssessments = await prisma.weeklyAssessment.findMany({
      where: { userId },
      orderBy: { weekNumber: 'asc' },
    });

    const objectiveMasteries = await prisma.objectiveMastery.findMany({
      where: { userId },
      orderBy: { masteryScore: 'desc' },
    });

    // Check if the user has any activity
    if (sessions.length === 0 && (!progress || progress.totalMinutes === 0)) {
      return {
        hasActivity: false,
      };
    }

    // 1. Learning Summary calculations
    const totalMinutes = progress ? progress.totalMinutes : sessions.reduce((sum, s) => sum + s.studyMinutes, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const studyTimeString = totalHours > 0
      ? `${totalHours} Hour${totalHours > 1 ? 's' : ''} ${remainingMinutes} Minute${remainingMinutes !== 1 ? 's' : ''}`
      : `${remainingMinutes} Minute${remainingMinutes !== 1 ? 's' : ''}`;

    const avgGrammarAccuracy = sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + s.grammarScore, 0) / sessions.length)
      : 80;

    const masteredVocabCount = vocabProgress.filter(v => v.status === 'mastered').length;
    const learningVocabCount = vocabProgress.filter(v => v.status === 'learning' || v.status === 'new').length;

    const totalXP = userProfile ? userProfile.totalXP : 0;
    const currentLevel = Math.floor(totalXP / 100) + 1;

    // 2. Skill Proficiency Matrix
    const vocabularyScore = sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.vocabularyScore, 0) / sessions.length) : 70;
    const grammarScore = sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.grammarScore, 0) / sessions.length) : 72;
    const speakingScore = sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.fluencyScore, 0) / sessions.length) : 66;
    const listeningScore = sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.confidenceScore, 0) / sessions.length) : 70;
    const pronunciationScore = sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.pronunciationScore, 0) / sessions.length) : 68;
    const readingScore = 75; // Baseline default
    const writingScore = 70; // Baseline default

    // 3. Overall Learning Progress
    const studyPlan = await prisma.studyPlan.findFirst({
      where: { userId },
      include: { days: true },
      orderBy: { createdAt: 'desc' },
    });

    let overallCompletion = 0;
    let completedTasks = 0;
    let totalTasks = 0;
    let currentWeekNumber = 1;
    let currentDayNumber = 1;

    if (studyPlan && studyPlan.days.length > 0) {
      totalTasks = studyPlan.days.length;
      completedTasks = studyPlan.days.filter(d => d.status === 'COMPLETED').length;
      overallCompletion = Math.round((completedTasks / totalTasks) * 100);

      const activeDay = studyPlan.days.find(d => d.status === 'AVAILABLE');
      if (activeDay) {
        currentWeekNumber = Math.ceil(activeDay.dayNumber / 7);
        currentDayNumber = activeDay.dayNumber;
      } else {
        currentWeekNumber = Math.ceil(totalTasks / 7);
        currentDayNumber = totalTasks;
      }
    }

    // 4. Progress Timeline (weeks 1 to 4)
    const timelineWeeks: any[] = [];
    if (studyPlan) {
      const days = studyPlan.days;
      const totalWeeks = Math.ceil(days.length / 7);

      for (let w = 1; w <= totalWeeks; w++) {
        const weekDays = days.filter(d => d.dayNumber > (w - 1) * 7 && d.dayNumber <= w * 7);
        const completedWeekDays = weekDays.filter(d => d.status === 'COMPLETED');

        let weekStatus = 'UPCOMING';
        if (completedWeekDays.length === weekDays.length) {
          weekStatus = 'COMPLETED';
        } else if (completedWeekDays.length > 0 || weekDays.some(d => d.status === 'AVAILABLE')) {
          weekStatus = 'CURRENT';
        }

        const weekCompletion = weekDays.length > 0 ? Math.round((completedWeekDays.length / weekDays.length) * 100) : 0;

        // Sum XP and study time from sessions matching this week's days
        const weekDayIds = weekDays.map(d => d.id);
        const weekSessions = sessions.filter(s => s.studyPlanDayId && weekDayIds.includes(s.studyPlanDayId));
        const weekStudyTime = weekSessions.reduce((sum, s) => sum + s.studyMinutes, 0);

        timelineWeeks.push({
          weekNumber: w,
          status: weekStatus,
          completionPercentage: weekCompletion,
          lessons: weekDays.filter(d => d.lessonType !== 'Conversation' && d.status === 'COMPLETED').length,
          conversations: weekDays.filter(d => d.lessonType === 'Conversation' && d.status === 'COMPLETED').length,
          vocabulary: weekDays.filter(d => d.lessonType === 'Vocabulary' && d.status === 'COMPLETED').length,
          grammar: weekDays.filter(d => d.lessonType === 'Grammar' && d.status === 'COMPLETED').length,
          xpEarned: completedWeekDays.length * 20,
          studyTime: weekStudyTime || completedWeekDays.length * 15,
        });
      }
    }

    // 5. Weekly Activity details (last 7 days of DailyLearningLog)
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const last7DaysLogs: any[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const targetLog = dailyLogs.find(log => {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === d.getTime();
      });

      last7DaysLogs.push({
        dayName: weekdays[d.getDay()],
        dateStr: d.toISOString().split('T')[0],
        studyMinutes: targetLog ? targetLog.minutesStudied : 0,
        xpEarned: targetLog ? targetLog.minutesStudied * 10 : 0,
        completedLessons: targetLog ? targetLog.completedLessons : 0,
        conversationTime: targetLog ? Math.max(0, targetLog.minutesStudied - 5) : 0, // simple estimate
        vocabularyLearned: targetLog ? Math.round(targetLog.completedTasks * 1.5) : 0,
        grammarPractice: targetLog ? targetLog.completedTasks : 0,
      });
    }

    // 6. AI Skill Evolution (Improvement compared to previous week/sessions)
    let grammarImprovement = 0;
    let speakingImprovement = 0;
    let vocabularyImprovement = 0;

    if (sessions.length > 1) {
      const recent = sessions[0];
      const older = sessions[sessions.length - 1];
      grammarImprovement = Math.max(-15, Math.min(30, recent.grammarScore - older.grammarScore));
      speakingImprovement = Math.max(-15, Math.min(30, recent.fluencyScore - older.fluencyScore));
      vocabularyImprovement = Math.max(-15, Math.min(30, recent.vocabularyScore - older.vocabularyScore));
    } else {
      grammarImprovement = 5;
      speakingImprovement = 8;
      vocabularyImprovement = 10;
    }

    // 7. Vocabulary progress breakdown
    const needsReviewCount = vocabProgress.filter(v => v.status === 'new' || v.masteryPercentage < 50).length;
    const weakVocabulary = vocabProgress.filter(v => v.masteryPercentage < 50).slice(0, 5).map(v => v.word);
    const recentlyLearned = vocabProgress.slice(0, 5).map(v => v.word);

    // 8. Grammar progress breakdown
    const activeWeakTopics = weakTopics.filter(t => t.status === 'active');
    const currentTopic = studyPlan?.days?.find(d => d.status === 'AVAILABLE')?.title || 'Conversation Basics';

    // 9. Pronunciation analytics
    const pronunciationScoreAvg = sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.pronunciationScore, 0) / sessions.length) : 65;
    const mispronouncedWords = ['Schedule', 'Comfortable', 'Development', 'Repository', 'Wednesday'];

    // 10. Conversation Analytics
    const totalConversations = progress ? progress.conversationsCompleted : sessions.filter(s => s.completedTasks?.toLowerCase().includes('conversation') || s.studyPlanDayId).length;
    const averageDuration = sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.studyMinutes, 0) / sessions.length) : 12;
    const averageConfidence = sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.confidenceScore, 0) / sessions.length) : 70;
    const averageFluency = sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.fluencyScore, 0) / sessions.length) : 68;
    const mostPracticedTopic = sessions.length > 0 && sessions[0].completedTasks ? sessions[0].completedTasks.split(',')[0] : 'General Speaking';

    // 11. Learning Heatmap (last 365 days)
    const heatmapData: any[] = [];
    const oneYearAgo = new Date();
    oneYearAgo.setDate(today.getDate() - 365);

    // Filter logs for the last year
    const yearLogs = dailyLogs.filter(log => new Date(log.date).getTime() >= oneYearAgo.getTime());
    yearLogs.forEach(log => {
      const mins = log.minutesStudied;
      let level = 0;
      if (mins > 0 && mins <= 10) level = 1;
      else if (mins > 10 && mins <= 20) level = 2;
      else if (mins > 20 && mins <= 30) level = 3;
      else if (mins > 30) level = 4;

      heatmapData.push({
        date: new Date(log.date).toISOString().split('T')[0],
        count: mins,
        level: level,
      });
    });

    // 12. Milestones
    const milestonesList = [
      { id: 'm1', title: 'Completed First Lesson', description: 'Started your active path', earned: progress ? progress.lessonsCompleted >= 1 : false },
      { id: 'm2', title: '7-Day Streak', description: 'Maintained 7 days practice', earned: progress ? progress.streak >= 7 : false },
      { id: 'm3', title: '100 XP', description: 'Reached 100 experience points', earned: totalXP >= 100 },
      { id: 'm4', title: '500 XP', description: 'Reached 500 experience points', earned: totalXP >= 500 },
      { id: 'm5', title: '100 Words Learned', description: 'Added 100 words to dictionary', earned: progress ? progress.vocabularyLearned >= 100 : false },
      { id: 'm6', title: 'Completed Week 1', description: 'Finished all tasks in Week 1', earned: completedTasks >= 7 },
      { id: 'm7', title: 'Completed First Conversation', description: 'Had your first voice chat', earned: progress ? progress.conversationsCompleted >= 1 : false },
      { id: 'm8', title: 'Grammar Master', description: 'Completed 10 grammar topics', earned: progress ? progress.grammarTopicsCompleted >= 10 : false },
      { id: 'm9', title: 'Vocabulary Explorer', description: 'Completed 20 vocab lessons', earned: progress ? progress.vocabularyLearned >= 20 : false },
    ];
    const milestones = milestonesList.filter(m => m.earned);

    // 13. AI Insights
    const aiInsights: string[] = [];
    if (sessions.length > 0) {
      const latest = sessions[0];
      if (latest.grammarScore >= 80) {
        aiInsights.push('Excellent grammar progress! Your usage of structures is very precise.');
      } else {
        aiInsights.push('Keep practicing grammar. Try speaking in complete sentences to reduce errors.');
      }
      aiInsights.push(`Vocabulary retention is improving. You mastered ${masteredVocabCount} words.`);
      if (latest.confidenceScore >= 85) {
        aiInsights.push(`Speaking confidence increased by ${speakingImprovement}%.`);
      }
      if (activeWeakTopics.length > 0) {
        aiInsights.push(`${activeWeakTopics[0].topic} still needs practice.`);
      }
      aiInsights.push(`Recommended focus: ${currentTopic} Practice Session.`);
    } else {
      aiInsights.push('Welcome to FluentAI! Practice your first speaking conversation to receive AI insights.');
    }

    // 14. Weak Areas details
    const weakAreas = [
      { category: 'Grammar', topic: activeWeakTopics.length > 0 ? activeWeakTopics[0].topic : 'Prepositions', mistakeCount: activeWeakTopics.length > 0 ? activeWeakTopics[0].mistakeCount : 3, trend: 'stable' },
      { category: 'Vocabulary', topic: weakVocabulary.length > 0 ? weakVocabulary[0] : 'Professional phrases', mistakeCount: needsReviewCount || 2, trend: 'improving' },
      { category: 'Pronunciation', topic: 'L/R Phonemes', mistakeCount: 5, trend: 'stable' },
      { category: 'Listening', topic: 'Fast native speech', mistakeCount: 4, trend: 'improving' },
      { category: 'Speaking', topic: 'Sentence connectors', mistakeCount: 6, trend: 'improving' },
    ];

    // 15. Learning Goals (Today's, Weekly, Monthly)
    const dailyGoal = learningProfile?.dailyLearningGoal || 15;
    const todayStudyMinutes = last7DaysLogs[last7DaysLogs.length - 1].studyMinutes;
    const todayGoalCompletion = Math.min(100, Math.round((todayStudyMinutes / dailyGoal) * 100));

    const weeklyGoal = dailyGoal * 5;
    const weeklyStudyMinutes = last7DaysLogs.reduce((sum, log) => sum + log.studyMinutes, 0);
    const weeklyGoalCompletion = Math.min(100, Math.round((weeklyStudyMinutes / weeklyGoal) * 100));

    const monthlyGoal = dailyGoal * 20;
    const monthlyStudyMinutes = dailyLogs.filter(log => {
      const logMonth = new Date(log.date).getMonth();
      const thisMonth = new Date().getMonth();
      return logMonth === thisMonth;
    }).reduce((sum, log) => sum + log.minutesStudied, 0);
    const monthlyGoalCompletion = Math.min(100, Math.round((monthlyStudyMinutes / monthlyGoal) * 100));

    return {
      hasActivity: true,
      summary: {
        studyTime: studyTimeString,
        grammarAccuracy: avgGrammarAccuracy,
        vocabularyLearned: masteredVocabCount || vocabularyScore,
        currentStreak: progress ? progress.streak : 0,
        totalXP,
        level: currentLevel,
      },
      skills: {
        vocabulary: vocabularyScore,
        grammar: grammarScore,
        speaking: speakingScore,
        listening: listeningScore,
        pronunciation: pronunciationScore,
        reading: readingScore,
        writing: writingScore,
        overallScore: Math.round((vocabularyScore + grammarScore + speakingScore + listeningScore + pronunciationScore) / 5),
      },
      overallProgress: {
        completionPercentage: overallCompletion,
        completedTasks,
        totalTasks,
        lessonsCompleted: progress ? progress.lessonsCompleted : 0,
        conversationsCompleted: progress ? progress.conversationsCompleted : 0,
        vocabularyCompleted: progress ? progress.vocabularyLearned : 0,
        grammarCompleted: progress ? progress.grammarTopicsCompleted : 0,
        listeningCompleted: progress ? progress.listeningSessions : 0,
        pronunciationCompleted: progress ? progress.pronunciationSessions : 0,
        quizCompleted: progress ? progress.quizzesCompleted : 0,
        studyDays: dailyLogs.length,
        currentWeek: currentWeekNumber,
        currentDay: currentDayNumber,
      },
      timeline: timelineWeeks,
      weeklyActivity: last7DaysLogs,
      evolution: {
        grammar: grammarScore,
        grammarDiff: grammarImprovement,
        speaking: speakingScore,
        speakingDiff: speakingImprovement,
        vocabulary: vocabularyScore,
        vocabularyDiff: vocabularyImprovement,
      },
      vocabulary: {
        mastered: masteredVocabCount,
        learning: learningVocabCount,
        needsReview: needsReviewCount,
        weakVocabulary,
        recentlyLearned,
      },
      grammar: {
        completed: weakTopics.filter(t => t.status === 'mastered').length,
        currentTopic,
        weakTopics: activeWeakTopics.map(t => ({ topic: t.topic, count: t.mistakeCount })),
      },
      pronunciation: {
        score: pronunciationScoreAvg,
        mispronouncedWords,
      },
      conversations: {
        totalConversations,
        averageDuration,
        averageConfidence,
        averageFluency,
        mostPracticedTopic,
      },
      heatmap: heatmapData,
      milestones,
      aiInsights,
      weakAreas,
      goals: {
        today: { goal: dailyGoal, current: todayStudyMinutes, completion: todayGoalCompletion },
        weekly: { goal: weeklyGoal, current: weeklyStudyMinutes, completion: weeklyGoalCompletion },
        monthly: { goal: monthlyGoal, current: monthlyStudyMinutes, completion: monthlyGoalCompletion },
      },
      baselineSkills: baseline ? {
        grammar: baseline.grammar,
        vocabulary: baseline.vocabulary,
        reading: baseline.reading,
        speaking: baseline.speaking,
        listening: baseline.listening,
        writing: baseline.writing,
        pronunciation: baseline.pronunciation,
        fluency: baseline.fluency,
        completed: baseline.completed,
        actualGrammar: baseline.actualGrammar,
        actualVocabulary: baseline.actualVocabulary,
        actualReading: baseline.actualReading,
        actualListening: baseline.actualListening,
        actualWriting: baseline.actualWriting,
        actualSpeaking: baseline.actualSpeaking,
        actualPronunciation: baseline.actualPronunciation,
        actualFluency: baseline.actualFluency,
        actualLevel: baseline.actualLevel,
        actualScore: baseline.actualScore,
      } : null,
      weeklyAssessments: weeklyAssessments.map(wa => ({
        weekNumber: wa.weekNumber,
        grammar: wa.grammar,
        speaking: wa.speaking,
        listening: wa.listening,
        writing: wa.writing,
        pronunciation: wa.pronunciation,
        fluency: wa.fluency,
        feedback: wa.feedback,
        createdAt: wa.createdAt,
      })),
      objectiveMasteries: objectiveMasteries.map(om => ({
        objective: om.objective,
        attemptsCount: om.attemptsCount,
        accuracy: om.accuracy,
        masteryScore: om.masteryScore,
        lastPracticed: om.lastPracticed,
      })),
    };
  }
}

export const learningMemoryService = new LearningMemoryService();
