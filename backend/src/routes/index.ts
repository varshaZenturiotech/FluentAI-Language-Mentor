import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import conversationRoutes from './conversation.routes';
import learningRoutes from './learning.routes';
import aiRoutes from './ai.routes';
import learningProfileRoutes from './learning-profile.routes';
import studyPlanRoutes from './study-plan.routes';
import dashboardRoutes from './dashboard.routes';
import { authenticate } from '../middleware/auth.middleware';
import { LearningController } from '../controllers/learning.controller';

const router = Router();
const learningController = new LearningController();

// Register v1 routes
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/conversations', conversationRoutes);
router.use('/learning', learningRoutes);
router.use('/ai', aiRoutes);
router.use('/learning-profile', learningProfileRoutes);
router.use('/study-plan', studyPlanRoutes);
router.use('/dashboard', dashboardRoutes);

// Root level aliases for direct/flat endpoints
router.get('/learning-progress', authenticate, (req, res, next) =>
  learningController.getProgress(req, res, next)
);
router.get('/learning-sessions', authenticate, (req, res, next) =>
  learningController.getLearningSessions(req, res, next)
);
router.get('/learning-analytics', authenticate, (req, res, next) =>
  learningController.getLearningAnalytics(req, res, next)
);
router.get('/xp', authenticate, (req, res, next) =>
  learningController.getXpHistory(req, res, next)
);
router.get('/streak', authenticate, (req, res, next) =>
  learningController.getStreakDetails(req, res, next)
);
router.get('/vocabulary-progress', authenticate, (req, res, next) =>
  learningController.getVocabularyProgress(req, res, next)
);
router.get('/grammar-progress', authenticate, (req, res, next) =>
  learningController.getGrammarProgress(req, res, next)
);

export default router;
