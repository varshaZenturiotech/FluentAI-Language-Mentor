import { Router } from 'express';
import multer from 'multer';
import { learningProfileController } from '../controllers/learning-profile.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateLearningProfile } from '../validators/learning-profile.validator';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
});

// GET /api/v1/learning-profile
router.get('/', authenticate, learningProfileController.getProfile);

// POST /api/v1/learning-profile
router.post('/', authenticate, validateLearningProfile, learningProfileController.upsertProfile);

// PUT /api/v1/learning-profile
router.put('/', authenticate, validateLearningProfile, learningProfileController.upsertProfile);

// POST /api/v1/learning-profile/baseline-assessment
router.post('/baseline-assessment', authenticate, upload.single('file'), learningProfileController.submitBaselineAssessment);

export default router;
