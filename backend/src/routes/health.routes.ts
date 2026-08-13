import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

const router = Router();

/**
 * @route   GET /api/v1/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', healthController.checkHealth);
router.get('/health/diagnose-gateway', healthController.diagnoseGateway);

export default router;
