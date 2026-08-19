import { LearningMemoryService } from '../learning-memory.service';
import { prisma } from '../../database/prisma';
import { fastApiClient } from '../../clients/fastapi.client';
import { v4 as uuidv4 } from 'uuid';

async function runTests() {
  console.log('=== STARTING LEARNING MEMORY SERVICE SUITE ===\n');
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passedCount++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failedCount++;
      process.exitCode = 1;
    }
  }

  // Mock fastApiClient.analyzeSession
  fastApiClient.analyzeSession = async () => ({
    completed: true,
    lessonCompletion: 100,
    studyMinutes: 15,
    grammarScore: 85,
    vocabularyScore: 80,
    confidenceScore: 75,
    fluencyScore: 70,
    pronunciationScore: 60,
    weakTopics: ['Present Perfect'],
    newWords: ['adaptive'],
    masteredWords: ['deployment'],
    grammarMistakes: [
      {
        sentence: 'I has done it',
        correctSentence: 'I have done it',
        explanation: 'Subject verb agreement',
        grammarRule: 'Present Perfect',
        mistakeType: 'Grammar',
      },
    ],
    completedObjectives: ['Spoke about engineering'],
    recommendedTopics: ['Workplace conversation'],
    recommendation: 'Good progress!',
  }) as any;

  const testUserId = uuidv4();
  const testSessionId = uuidv4();
  const testDayId = uuidv4();
  const testNextDayId = uuidv4();
  const testStudyPlanId = uuidv4();

  // Helper setup: Create db records in Prisma
  try {
    await prisma.user.create({
      data: {
        id: testUserId,
        email: `test-${testUserId}@example.com`,
        password: 'hashedpassword',
        name: 'Test User',
      },
    });

    await prisma.profile.create({
      data: {
        userId: testUserId,
        bio: 'Test bio',
      },
    });

    await prisma.learningProfile.create({
      data: {
        userId: testUserId,
        englishLevel: 'INTERMEDIATE',
        nativeLanguage: 'Malayalam',
        dailyLearningGoal: 15,
      },
    });

    await prisma.studyPlan.create({
      data: {
        id: testStudyPlanId,
        userId: testUserId,
        title: 'Test English Plan',
        description: 'Test Description',
        durationWeeks: 8,
      },
    });

    await prisma.studyPlanDay.create({
      data: {
        id: testDayId,
        studyPlanId: testStudyPlanId,
        dayNumber: 1,
        title: 'Day 1 Lesson',
        lessonType: 'Conversation',
        lessonContent: 'Practice daily greeting',
        status: 'AVAILABLE',
      },
    });

    await prisma.studyPlanDay.create({
      data: {
        id: testNextDayId,
        studyPlanId: testStudyPlanId,
        dayNumber: 2,
        title: 'Day 2 Lesson',
        lessonType: 'Conversation',
        lessonContent: 'Workplace chat',
        status: 'LOCKED',
      },
    });

    await prisma.conversationSession.create({
      data: {
        id: testSessionId,
        userId: testUserId,
        lessonId: testDayId,
        title: 'Day 1 Lesson',
        language: 'English',
        difficulty: 'BEGINNER',
        status: 'ACTIVE',
        totalMessages: 8,
        messages: {
          create: [
            { role: 'ASSISTANT', content: 'Hello! Welcome to lesson.' },
            { role: 'USER', content: 'Hi! Happy to start.' },
            { role: 'ASSISTANT', content: 'What is your background?' },
            { role: 'USER', content: 'I am Anu, a developer.' },
            { role: 'ASSISTANT', content: 'Nice to meet you!' },
            { role: 'USER', content: 'I like software engineering.' },
            { role: 'ASSISTANT', content: 'What programming language?' },
            { role: 'USER', content: 'I work with TypeScript.' },
          ],
        },
      },
    });
  } catch (err: any) {
    console.error('Setup failed:', err.message);
    process.exit(1);
  }

  const service = new LearningMemoryService();

  // -------------------------------------------------------------
  // TEST A: Non-final run (Turn 4 mid-lesson trigger, isFinal = false)
  // -------------------------------------------------------------
  console.log('--- TEST A: Non-final run (Turn 4, isFinal = false) ---');
  await service.queueAnalysisJob(testUserId, testSessionId, testDayId, false);

  const convSessionA = await prisma.conversationSession.findUnique({ where: { id: testSessionId } });
  const dayA = await prisma.studyPlanDay.findUnique({ where: { id: testDayId } });
  const nextDayA = await prisma.studyPlanDay.findUnique({ where: { id: testNextDayId } });
  const learningSessionA = await prisma.learningSession.findFirst({ where: { sessionId: testSessionId } });
  const profileA = await prisma.profile.findUnique({ where: { userId: testUserId } });

  assert(convSessionA?.status === 'ACTIVE', 'ConversationSession status remains ACTIVE');
  assert(dayA?.status === 'AVAILABLE', 'StudyPlanDay status remains AVAILABLE (not prematurely COMPLETED)');
  assert(nextDayA?.status === 'LOCKED', 'Next Day status remains LOCKED');
  assert(learningSessionA !== null, 'LearningSession record was created/updated with intermediate analysis');
  assert((profileA?.totalXP || 0) === 0, 'No completion XP was awarded for non-final run');

  // -------------------------------------------------------------
  // TEST B: Final run (Turn 20 completion, isFinal = true)
  // -------------------------------------------------------------
  console.log('\n--- TEST B: Final run (Turn 20 completion, isFinal = true) ---');
  await service.queueAnalysisJob(testUserId, testSessionId, testDayId, true);

  const convSessionB = await prisma.conversationSession.findUnique({ where: { id: testSessionId } });
  const dayB = await prisma.studyPlanDay.findUnique({ where: { id: testDayId } });
  const nextDayB = await prisma.studyPlanDay.findUnique({ where: { id: testNextDayId } });
  const profileB = await prisma.profile.findUnique({ where: { userId: testUserId } });

  assert(convSessionB?.status === 'COMPLETED', 'ConversationSession status transitioned to COMPLETED');
  assert(dayB?.status === 'COMPLETED', 'StudyPlanDay status transitioned to COMPLETED');
  assert(nextDayB?.status === 'AVAILABLE', 'Next Day status auto-unlocked to AVAILABLE');
  assert((profileB?.totalXP || 0) > 0, 'Completion XP was awarded for final run');

  // -------------------------------------------------------------
  // TEST C: Direct Final Call without prior non-final run (Short Lesson)
  // -------------------------------------------------------------
  console.log('\n--- TEST C: Direct Final Call for Short Lesson ---');
  const shortSessionId = uuidv4();
  const shortDayId = uuidv4();

  await prisma.studyPlanDay.create({
    data: {
      id: shortDayId,
      studyPlanId: testStudyPlanId,
      dayNumber: 3,
      title: 'Short Lesson',
      lessonType: 'Conversation',
      lessonContent: 'Short chat',
      status: 'AVAILABLE',
    },
  });

  await prisma.conversationSession.create({
    data: {
      id: shortSessionId,
      userId: testUserId,
      lessonId: shortDayId,
      title: 'Short Lesson',
      language: 'English',
      difficulty: 'BEGINNER',
      status: 'ACTIVE',
      totalMessages: 8,
      messages: {
        create: [
          { role: 'ASSISTANT', content: 'Welcome!' },
          { role: 'USER', content: 'Hello!' },
          { role: 'ASSISTANT', content: 'How are you?' },
          { role: 'USER', content: 'Great!' },
          { role: 'ASSISTANT', content: 'What is your project?' },
          { role: 'USER', content: 'Building AI mentor.' },
          { role: 'ASSISTANT', content: 'Awesome!' },
          { role: 'USER', content: 'Thank you.' },
        ],
      },
    },
  });

  await service.queueAnalysisJob(testUserId, shortSessionId, shortDayId, true);

  const shortConv = await prisma.conversationSession.findUnique({ where: { id: shortSessionId } });
  const shortDay = await prisma.studyPlanDay.findUnique({ where: { id: shortDayId } });
  const shortLearning = await prisma.learningSession.findFirst({ where: { sessionId: shortSessionId } });

  assert(shortConv?.status === 'COMPLETED', 'Short lesson ConversationSession marked COMPLETED');
  assert(shortDay?.status === 'COMPLETED', 'Short lesson StudyPlanDay marked COMPLETED');
  assert(shortLearning !== null, 'Short lesson LearningSession created via create path');

  // -------------------------------------------------------------
  // TEST D: 3-Deep Chain & Concurrent Duplicate Final Calls (Idempotency & Map Cleanup)
  // -------------------------------------------------------------
  console.log('\n--- TEST D: 3-Deep Chain, Concurrent Promise.all Finals & Map Cleanup ---');
  const chainSessionId = uuidv4();

  await prisma.conversationSession.create({
    data: {
      id: chainSessionId,
      userId: testUserId,
      title: 'Chain Lesson',
      language: 'English',
      difficulty: 'BEGINNER',
      status: 'ACTIVE',
      totalMessages: 8,
      messages: {
        create: [
          { role: 'ASSISTANT', content: '1' },
          { role: 'USER', content: '1' },
          { role: 'ASSISTANT', content: '2' },
          { role: 'USER', content: '2' },
          { role: 'ASSISTANT', content: '3' },
          { role: 'USER', content: '3' },
          { role: 'ASSISTANT', content: '4' },
          { role: 'USER', content: '4' },
        ],
      },
    },
  });

  // 1. Enqueue 3-deep chain in rapid succession
  const job1 = service.queueAnalysisJob(testUserId, chainSessionId, undefined, false);
  const job2 = service.queueAnalysisJob(testUserId, chainSessionId, undefined, false);
  const job3 = service.queueAnalysisJob(testUserId, chainSessionId, undefined, true);

  await Promise.all([job1, job2, job3]);

  // Check map cleanup: Map entry for chainSessionId must be deleted (undefined)
  const mapEntryAfterChain = (service as any).sessionJobQueues.get(chainSessionId);
  assert(mapEntryAfterChain === undefined, 'Queue map entry cleaned up after 3-deep chain completion (no memory leak)');

  const chainConv = await prisma.conversationSession.findUnique({ where: { id: chainSessionId } });
  assert(chainConv?.status === 'COMPLETED', 'Chain session final status is COMPLETED');

  // 2. Fire concurrent duplicate final calls with Promise.all
  const profileBeforeConcurrent = await prisma.profile.findUnique({ where: { userId: testUserId } });
  const xpBeforeConcurrent = profileBeforeConcurrent?.totalXP || 0;

  const finalJobA = service.queueAnalysisJob(testUserId, chainSessionId, undefined, true);
  const finalJobB = service.queueAnalysisJob(testUserId, chainSessionId, undefined, true);

  await Promise.all([finalJobA, finalJobB]);

  const profileAfterConcurrent = await prisma.profile.findUnique({ where: { userId: testUserId } });
  const xpAfterConcurrent = profileAfterConcurrent?.totalXP || 0;

  assert(xpAfterConcurrent === xpBeforeConcurrent, 'Duplicate concurrent final calls did NOT double-award XP (idempotency verified)');

  const mapEntryAfterConcurrent = (service as any).sessionJobQueues.get(chainSessionId);
  assert(mapEntryAfterConcurrent === undefined, 'Queue map entry cleaned up after concurrent final calls completion');

  console.log(`\n=== TEST SUMMARY: ${passedCount} Passed, ${failedCount} Failed ===`);

  // Cleanup test user
  try {
    await prisma.user.delete({ where: { id: testUserId } });
  } catch (e) {
    // Ignore cleanup error
  }

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
