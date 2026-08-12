import { Router } from 'express';
import multer from 'multer';
import { aiController } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  validateChat,
  validateTranslate,
  validateFeedback,
  validatePronunciation,
  validateSpeech,
} from '../validators/ai.validator';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
});

// All AI endpoints require authorization and payload validation
router.post('/chat', authenticate, validateChat, aiController.chat);
router.post('/translate', authenticate, validateTranslate, aiController.translate);
router.post('/feedback', authenticate, validateFeedback, aiController.feedback);
router.post('/pronunciation', authenticate, validatePronunciation, aiController.pronunciation);
router.post('/speech', authenticate, upload.single('file'), validateSpeech, aiController.speech);

export default router;
