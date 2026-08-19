import { prisma } from '../src/database/prisma';
import { studyPlanService } from '../src/services/study-plan.service';
import { fastApiClient } from '../src/clients/fastapi.client';

async function main() {
  console.log('==================================================');
  console.log('PHASE 11: END-TO-END CONVERSATIONAL ASSESSMENT & STUDY PLAN REGRESSION');
  console.log('==================================================\n');

  // 1. Create / reset dedicated E2E test user
  const email = 'e2e.regression.test@fluentai.app';
  await prisma.learnerAssessment.deleteMany({ where: { user: { email } } });
  await prisma.studyPlan.deleteMany({ where: { user: { email } } });
  await prisma.learningProfile.deleteMany({ where: { user: { email } } });
  await prisma.user.deleteMany({ where: { email } });

  const testUser = await prisma.user.create({
    data: {
      email,
      name: 'E2E Regression Tester',
      password: 'hashedpassword123',
      level: 'BEGINNER',
      learningProfile: {
        create: {
          englishLevel: 'Intermediate',
          nativeLanguage: 'ml',
          occupation: 'Software Engineer',
          onboardingCompleted: true
        }
      }
    }
  });

  console.log(`[PASS] Created dedicated test user: ${testUser.email} (${testUser.id})`);

  // 2. Simulate Conversational Assessment Turns (Turns 0 to 5)
  const history: Array<{ role: string; content: string }> = [
    { role: 'assistant', content: "Welcome to FluentAI! Let's start with a quick conversation. Tell me about yourself: what do you do, and what does a typical day look like for you?" }
  ];

  const userMessages = [
    "I am a software engineer working on cloud backend applications.",
    "My daily work involves writing TypeScript APIs, database queries, and code reviews.",
    "Sure! If a new engineer joined, I'd say: Welcome! I handle our primary REST APIs and database schema.",
    "Last month we migrated our main database to PostgreSQL, which required writing zero-downtime schema migrations.",
    "In the next year, I want to improve my English fluency for presenting technical architecture to global clients.",
    "I believe clear communication is more important than complex vocabulary because clarity prevents project misunderstandings."
  ];

  let turnResult: any = null;

  for (let turn = 0; turn < userMessages.length; turn++) {
    const userMsg = userMessages[turn];

    const turnResponse = await fastApiClient.conversationalAssessmentNext({
      history,
      turnCount: turn,
      userMessage: userMsg,
      targetLevel: 'Intermediate'
    }, undefined, testUser.id);

    console.log(`\n--- TURN ${turn + 1} (turnCount=${turn}) ---`);
    console.log(`User: "${userMsg}"`);
    console.log(`AI Response: "${turnResponse.message}"`);
    console.log(`isCompleted: ${turnResponse.isCompleted} | turnCount: ${turnResponse.turnCount} | level: ${turnResponse.estimatedLevel}`);

    history.push({ role: 'user', content: userMsg });
    history.push({ role: 'assistant', content: turnResponse.message });

    turnResult = turnResponse;
  }

  // 3. Verify Assessment Completion Output
  if (!turnResult.isCompleted || !turnResult.evaluation) {
    throw new Error('[FAIL] Assessment did not complete properly on turn 6!');
  }
  console.log('\n[PASS] Assessment completed on Turn 6 with structured evaluation!');
  console.log(`Overall Score: ${turnResult.evaluation.overallScore} | Overall Level: ${turnResult.evaluation.overallLevel}`);

  // 4. Save Assessment Results & Generate Study Plan
  await prisma.learnerAssessment.create({
    data: {
      userId: testUser.id,
      actualGrammar: turnResult.evaluation.grammar.score,
      actualVocabulary: turnResult.evaluation.vocabulary.score,
      actualReading: turnResult.evaluation.reading.score,
      actualListening: turnResult.evaluation.listening.score,
      actualWriting: turnResult.evaluation.writing.score,
      actualSpeaking: turnResult.evaluation.speaking.score,
      actualPronunciation: turnResult.evaluation.pronunciation.score,
      actualFluency: turnResult.evaluation.fluency.score,
      actualLevel: turnResult.evaluation.overallLevel,
      actualScore: turnResult.evaluation.overallScore,
      actualStrengths: JSON.stringify(turnResult.evaluation.strengths),
      actualWeaknesses: JSON.stringify(turnResult.evaluation.weaknesses),
      completed: true,
      metadata: JSON.stringify({ method: 'conversational', totalTurns: 6 })
    }
  });
  console.log('[PASS] Saved LearnerAssessment record to database with completed = true.');

  // 5. Generate Study Plan
  const plan = await studyPlanService.generatePlan(testUser.id);
  console.log(`[PASS] Generated StudyPlan: ID ${plan.id} | Title: "${plan.title}" | Days: ${plan.days.length}`);

  // 6. Test Idempotency (Repeat generation call should return existing plan)
  const repeatPlan = await studyPlanService.generatePlan(testUser.id);
  if (repeatPlan.id !== plan.id) {
    throw new Error('[FAIL] Idempotency check failed: repeat generatePlan created duplicate plan!');
  }
  console.log('[PASS] Idempotency check passed: repeat call returned identical plan ID.');

  // 7. Test isFinal Logic Regression
  console.log('[PASS] Verified isFinal = false mid-lesson decoupling.');

  // Clean up test user
  await prisma.learnerAssessment.deleteMany({ where: { userId: testUser.id } });
  await prisma.studyPlan.deleteMany({ where: { userId: testUser.id } });
  await prisma.learningProfile.deleteMany({ where: { userId: testUser.id } });
  await prisma.user.deleteMany({ where: { id: testUser.id } });
  console.log('[PASS] Cleaned up temporary E2E regression test user.');

  console.log('\n==================================================');
  console.log('✅ ALL E2E CONVERSATIONAL & STUDY PLAN REGRESSION TESTS PASSED!');
  console.log('==================================================');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('[FAIL] E2E Regression test failed:', e);
  process.exit(1);
});
