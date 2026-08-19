import { prisma } from '../src/database/prisma';

async function main() {
  console.log('==================================================');
  console.log('DATABASE INSPECTION FOR CATEGORY A & B RECORDS');
  console.log('==================================================\n');

  // 1. Users & Profiles
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      profile: {
        select: {
          totalXP: true
        }
      },
      learningProgress: {
        select: {
          xp: true,
          lessonsCompleted: true,
          conversationsCompleted: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Total Users Found: ${users.length}`);
  users.forEach((u) => {
    console.log(`- User [${u.id}] Email: ${u.email} | Name: ${u.name} | Created: ${u.createdAt.toISOString()} | TotalXP: ${u.profile?.totalXP ?? 0} | ProgressXP: ${u.learningProgress?.xp ?? 0}`);
  });

  // 2. LearnerAssessment Records
  const assessments = await prisma.learnerAssessment.findMany({
    include: {
      user: {
        select: { email: true, name: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`\n--------------------------------------------------`);
  console.log(`LearnerAssessment Records: Total = ${assessments.length}`);
  console.log(`--------------------------------------------------`);
  assessments.forEach((a) => {
    console.log(`- ID: ${a.id} | User: ${a.user.email} (${a.userId}) | Completed: ${a.completed} | Score: ${a.actualScore} | Level: ${a.actualLevel} | Created: ${a.createdAt.toISOString()} | Metadata: ${a.metadata || 'null'}`);
  });

  // 3. StudyPlan Records
  const studyPlans = await prisma.studyPlan.findMany({
    include: {
      user: { select: { email: true } },
      days: { select: { id: true, dayNumber: true, status: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`\n--------------------------------------------------`);
  console.log(`StudyPlan Records: Total = ${studyPlans.length}`);
  console.log(`--------------------------------------------------`);
  studyPlans.forEach((sp) => {
    const completedDays = sp.days.filter((d) => d.status === 'COMPLETED').length;
    const availableDays = sp.days.filter((d) => d.status === 'AVAILABLE').length;
    console.log(`- Plan ID: ${sp.id} | User: ${sp.user.email} (${sp.userId}) | Title: "${sp.title}" | Version: ${sp.planVersion} | Days: Total ${sp.days.length}, Completed ${completedDays}, Available ${availableDays} | Created: ${sp.createdAt.toISOString()}`);
  });

  // 4. ConversationSession Records
  const sessions = await prisma.conversationSession.findMany({
    include: {
      user: { select: { email: true } },
      messages: { select: { id: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`\n--------------------------------------------------`);
  console.log(`ConversationSession Records: Total = ${sessions.length}`);
  console.log(`--------------------------------------------------`);
  
  const isFinalFixDeployDate = new Date('2026-08-18T02:50:00Z');

  sessions.forEach((s) => {
    const msgCount = s.messages.length;
    const isPreFix = s.createdAt < isFinalFixDeployDate;
    const isSuspiciousCompleted = s.status === 'COMPLETED' && isPreFix && (msgCount < 8 || (s.totalMessages && s.totalMessages < 8));

    console.log(`- Session ID: ${s.id} | User: ${s.user.email} (${s.userId}) | Status: ${s.status} | Messages: Real ${msgCount}, Stored ${s.totalMessages} | Created: ${s.createdAt.toISOString()} | PreFix: ${isPreFix} | SuspiciousPrematureCompletion: ${isSuspiciousCompleted}`);
  });

  // 5. StudyPlanDay Records
  const completedDays = await prisma.studyPlanDay.findMany({
    where: { status: 'COMPLETED' },
    include: {
      studyPlan: {
        include: { user: { select: { email: true } } }
      },
      lessonSessions: true
    }
  });

  console.log(`\n--------------------------------------------------`);
  console.log(`Completed StudyPlanDay Records: Total = ${completedDays.length}`);
  console.log(`--------------------------------------------------`);
  completedDays.forEach((spd) => {
    console.log(`- Day ID: ${spd.id} | PlanID: ${spd.studyPlanId} | User: ${spd.studyPlan.user.email} | Day: ${spd.dayNumber} | Title: "${spd.title}" | LessonSessions: ${spd.lessonSessions.length}`);
  });

  // 6. LessonSession & LearningSession Records
  const lessonSessions = await prisma.lessonSession.findMany({
    include: {
      user: { select: { email: true } }
    }
  });
  console.log(`\n--------------------------------------------------`);
  console.log(`LessonSession Records: Total = ${lessonSessions.length}`);
  console.log(`--------------------------------------------------`);
  lessonSessions.forEach((ls) => {
    console.log(`- Session ID: ${ls.id} | User: ${ls.user.email} | Status: ${ls.status} | XPEarned: ${ls.xpEarned} | Started: ${ls.startedAt.toISOString()} | Completed: ${ls.completedAt ? ls.completedAt.toISOString() : 'null'}`);
  });

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
