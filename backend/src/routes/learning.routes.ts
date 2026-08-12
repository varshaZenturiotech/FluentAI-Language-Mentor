import { Router } from 'express';
import { LearningController } from '../controllers/learning.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  validateCreateVocabulary,
  validateUpdateVocabulary,
  validateCreateGrammar,
  validateCreateProgress,
} from '../validators/learning.validator';

const router = Router();
const learningController = new LearningController();

/**
 * All learning routes require authentication.
 * The `authenticate` middleware must validate the JWT and populate req.user.id.
 */

// ==========================================
// XP
// ==========================================

// GET /api/v1/learning/today-xp
router.get('/today-xp', authenticate, (req, res, next) =>
  learningController.getTodayXp(req, res, next)
);

// ==========================================
// VOCABULARY
// ==========================================

// GET /api/v1/learning/vocabulary
router.get('/vocabulary', authenticate, (req, res, next) =>
  learningController.getVocabulary(req, res, next)
);

// POST /api/v1/learning/vocabulary
router.post('/vocabulary', authenticate, validateCreateVocabulary, (req, res, next) =>
  learningController.createVocabulary(req, res, next)
);

// PUT /api/v1/learning/vocabulary/:id
router.put('/vocabulary/:id', authenticate, validateUpdateVocabulary, (req, res, next) =>
  learningController.updateVocabulary(req, res, next)
);

// DELETE /api/v1/learning/vocabulary/:id
router.delete('/vocabulary/:id', authenticate, (req, res, next) =>
  learningController.deleteVocabulary(req, res, next)
);

// ==========================================
// GRAMMAR
// ==========================================

// GET /api/v1/learning/grammar
router.get('/grammar', authenticate, (req, res, next) =>
  learningController.getGrammarMistakes(req, res, next)
);

// POST /api/v1/learning/grammar
router.post('/grammar', authenticate, validateCreateGrammar, (req, res, next) =>
  learningController.createGrammarMistake(req, res, next)
);

// ==========================================
// LESSONS
// ==========================================

// GET /api/v1/learning/lessons
router.get('/lessons', authenticate, (req, res, next) =>
  learningController.getLessons(req, res, next)
);

// ==========================================
// PROGRESS
// ==========================================

// GET /api/v1/learning/progress
router.get('/progress', authenticate, (req, res, next) =>
  learningController.getProgress(req, res, next)
);

// POST /api/v1/learning/progress
router.post('/progress', authenticate, validateCreateProgress, (req, res, next) =>
  learningController.completeLesson(req, res, next)
);

// ==========================================
// ACHIEVEMENTS
// ==========================================

// GET /api/v1/learning/achievements
router.get('/achievements', authenticate, (req, res, next) =>
  learningController.getAchievements(req, res, next)
);

// ==========================================
// HYBRID LEARNING MEMORY SYSTEM
// ==========================================

// POST /api/v1/learning/analyze
router.post('/analyze', authenticate, (req, res, next) =>
  learningController.analyzeSession(req, res, next)
);

// GET /api/v1/learning/weak-topics
router.get('/weak-topics', authenticate, (req, res, next) =>
  learningController.getWeakTopics(req, res, next)
);

// GET /api/v1/learning/sessions
router.get('/sessions', authenticate, (req, res, next) =>
  learningController.getLearningSessions(req, res, next)
);

// GET /api/v1/learning/sessions/:sessionId
router.get('/sessions/:sessionId', authenticate, (req, res, next) =>
  learningController.getLearningSessionStatus(req, res, next)
);

// GET /api/v1/learning/recommendations
router.get('/recommendations', authenticate, (req, res, next) =>
  learningController.getRecommendations(req, res, next)
);

// GET /api/v1/learning/summary
router.get('/summary', authenticate, (req, res, next) =>
  learningController.getSummary(req, res, next)
);

// GET /api/v1/learning/analytics
router.get('/analytics', authenticate, (req, res, next) =>
  learningController.getLearningAnalytics(req, res, next)
);

// GET /api/v1/learning/xp
router.get('/xp', authenticate, (req, res, next) =>
  learningController.getXpHistory(req, res, next)
);

// GET /api/v1/learning/streak
router.get('/streak', authenticate, (req, res, next) =>
  learningController.getStreakDetails(req, res, next)
);

// GET /api/v1/learning/vocabulary-progress
router.get('/vocabulary-progress', authenticate, (req, res, next) =>
  learningController.getVocabularyProgress(req, res, next)
);

// GET /api/v1/learning/grammar-progress
router.get('/grammar-progress', authenticate, (req, res, next) =>
  learningController.getGrammarProgress(req, res, next)
);

export default router;
