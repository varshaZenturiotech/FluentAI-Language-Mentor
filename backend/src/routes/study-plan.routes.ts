import { Router } from 'express';
import { studyPlanController } from '../controllers/study-plan.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All study plan routes require authentication
router.use(authenticate);

router.post('/generate', studyPlanController.generatePlan);
router.get('/', studyPlanController.getPlan);
router.post('/day/:id/start', studyPlanController.startLessonSession);
router.put('/day/:id/complete', studyPlanController.completeDay);
router.get('/recommendations', studyPlanController.getRecommendations);
router.get('/progress', studyPlanController.getProgress);

export default router;
