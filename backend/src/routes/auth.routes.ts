import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRegister } from '../validators/auth.validator';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/register', validateRegister, (req, res, next) =>
  authController.register(req, res, next)
);

router.post('/login', (req, res, next) => authController.login(req, res, next));

router.post('/logout', authenticate, (req, res, next) => authController.logout(req, res, next));

router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));

router.get('/me', authenticate, (req, res, next) => authController.me(req, res, next));

export default router;
