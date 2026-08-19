import fs from 'fs';
import path from 'path';
import { prisma } from '../src/database/prisma';

async function main() {
  const backupDir = path.resolve(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `db_backup_${timestamp}.json`);

  console.log(`Exporting database backup to: ${backupPath}`);

  const backupData = {
    timestamp: new Date().toISOString(),
    users: await prisma.user.findMany(),
    profiles: await prisma.profile.findMany(),
    learningProfiles: await prisma.learningProfile.findMany(),
    learnerAssessments: await prisma.learnerAssessment.findMany(),
    studyPlans: await prisma.studyPlan.findMany(),
    studyPlanDays: await prisma.studyPlanDay.findMany(),
    conversationSessions: await prisma.conversationSession.findMany(),
    messages: await prisma.message.findMany(),
    lessonSessions: await prisma.lessonSession.findMany(),
    learningProgress: await prisma.learningProgress.findMany(),
  };

  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
  console.log(`Backup completed successfully! Exported ${Object.keys(backupData).length} model datasets.`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Backup failed:', e);
  process.exit(1);
});
