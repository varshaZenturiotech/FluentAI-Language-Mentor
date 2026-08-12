import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateCreateSession, validateCreateMessage } from '../validators/conversation.validator';

const router = Router();
const conversationController = new ConversationController();

/**
 * All conversation routes require authentication.
 * The `authenticate` middleware must validate the JWT and populate req.user.id
 * before any handler below executes.
 */

// POST /api/v1/conversations — Create a new conversation session
router.post('/', authenticate, validateCreateSession, (req, res, next) =>
  conversationController.createSession(req, res, next)
);

// GET /api/v1/conversations — List all sessions for the authenticated user
router.get('/', authenticate, (req, res, next) =>
  conversationController.getSessions(req, res, next)
);

// GET /api/v1/conversations/:sessionId/messages — List messages for a session
router.get('/:sessionId/messages', authenticate, (req, res, next) =>
  conversationController.getMessages(req, res, next)
);

// POST /api/v1/conversations/:sessionId/messages — Add a message to a session
router.post('/:sessionId/messages', authenticate, validateCreateMessage, (req, res, next) =>
  conversationController.createMessage(req, res, next)
);

// DELETE /api/v1/conversations/:sessionId — Delete a conversation and its messages
router.delete('/:sessionId', authenticate, (req, res, next) =>
  conversationController.deleteConversation(req, res, next)
);

export default router;
