import { prisma } from '../src/database/prisma';

async function main() {
  console.log('==================================================');
  console.log('DATABASE INTEGRITY VERIFICATION');
  console.log('==================================================\n');

  let errors = 0;

  const validUserIds = (await prisma.user.findMany({ select: { id: true } })).map((u) => u.id);
  const validStudyPlanIds = (await prisma.studyPlan.findMany({ select: { id: true } })).map((sp) => sp.id);

  // 1. Orphan LearnerAssessment
  const orphanAssessments = await prisma.learnerAssessment.findMany({
    where: { userId: { notIn: validUserIds } }
  });
  if (orphanAssessments.length > 0) {
    console.error(`[FAIL] Found ${orphanAssessments.length} orphaned LearnerAssessment records!`);
    errors++;
  } else {
    console.log('[PASS] No orphaned LearnerAssessment records.');
  }

  // 2. Orphan StudyPlan
  const orphanStudyPlans = await prisma.studyPlan.findMany({
    where: { userId: { notIn: validUserIds } }
  });
  if (orphanStudyPlans.length > 0) {
    console.error(`[FAIL] Found ${orphanStudyPlans.length} orphaned StudyPlan records!`);
    errors++;
  } else {
    console.log('[PASS] No orphaned StudyPlan records.');
  }

  // 3. Orphan StudyPlanDay
  const orphanStudyPlanDays = await prisma.studyPlanDay.findMany({
    where: { studyPlanId: { notIn: validStudyPlanIds } }
  });
  if (orphanStudyPlanDays.length > 0) {
    console.error(`[FAIL] Found ${orphanStudyPlanDays.length} orphaned StudyPlanDay records!`);
    errors++;
  } else {
    console.log('[PASS] No orphaned StudyPlanDay records.');
  }

  // 4. Orphan ConversationSession
  const orphanSessions = await prisma.conversationSession.findMany({
    where: { userId: { notIn: validUserIds } }
  });
  if (orphanSessions.length > 0) {
    console.error(`[FAIL] Found ${orphanSessions.length} orphaned ConversationSession records!`);
    errors++;
  } else {
    console.log('[PASS] No orphaned ConversationSession records.');
  }

  // 5. Orphan LearningProfile
  const orphanProfiles = await prisma.learningProfile.findMany({
    where: { userId: { notIn: validUserIds } }
  });
  if (orphanProfiles.length > 0) {
    console.error(`[FAIL] Found ${orphanProfiles.length} orphaned LearningProfile records!`);
    errors++;
  } else {
    console.log('[PASS] No orphaned LearningProfile records.');
  }

  console.log(`\nIntegrity Verification Result: ${errors === 0 ? 'ALL CHECKS PASSED' : errors + ' ERRORS FOUND'}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
