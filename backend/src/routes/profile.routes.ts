import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateUpdateProfile } from '../validators/profile.validator';

const router = Router();
const profileController = new ProfileController();

/**
 * All profile routes require authentication.
 * The `authenticate` middleware must validate the JWT and populate req.user.id
 * before any of the handlers below execute.
 */

// GET /api/v1/profile
router.get('/', authenticate, (req, res, next) => profileController.getProfile(req, res, next));

// PUT /api/v1/profile
// validateUpdateProfile runs first: rejects bad payloads before the controller is reached.
router.put('/', authenticate, validateUpdateProfile, (req, res, next) =>
  profileController.updateProfile(req, res, next)
);

// DELETE /api/v1/profile
router.delete('/', authenticate, (req, res, next) =>
  profileController.deleteAccount(req, res, next)
);

export default router;
