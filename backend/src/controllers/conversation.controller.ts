import { Request, Response, NextFunction } from 'express';
import { ConversationService } from '../services/conversation.service';
import { CreateSessionDto } from '../dto/create-session.dto';
import { CreateMessageDto } from '../dto/create-message.dto';
import { ApiError } from '../utils/ApiError';
import { HttpStatusCodes } from '../constants/httpStatusCodes';

/**
 * Conversation Controller
 *
 * Responsibility: HTTP request/response handling ONLY.
 * - Extracts data from the request (params, body, user context).
 * - Calls the appropriate service method.
 * - Formats and sends the response.
 * - Delegates all errors to the global error handler via next().
 *
 * No business logic. No Prisma queries.
 */
export class ConversationController {
  private conversationService: ConversationService;

  constructor(conversationService: ConversationService = new ConversationService()) {
    this.conversationService = conversationService;
  }

  /**
   * POST /api/v1/conversations
   * Creates a new conversation session for the authenticated user.
   *
   * HTTP 201 – session created
   * HTTP 400 – validation failure (handled by validator middleware)
   * HTTP 401 – unauthenticated
   */
  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const dto: CreateSessionDto = req.body;
      const session = await this.conversationService.createSession(req.user.id, dto);

      res.status(HttpStatusCodes.CREATED).json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/conversations
   * Returns all conversation sessions for the authenticated user.
   *
   * HTTP 200 – list of sessions (may be empty)
   * HTTP 401 – unauthenticated
   */
  async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const sessions = await this.conversationService.getSessions(req.user.id);

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/conversations/:sessionId/messages
   * Returns all messages for a specific conversation session.
   *
   * HTTP 200 – list of messages (may be empty)
   * HTTP 401 – unauthenticated
   * HTTP 403 – conversation belongs to another user
   * HTTP 404 – conversation not found
   */
  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const { sessionId } = req.params;
      const messages = await this.conversationService.getMessages(req.user.id, sessionId);

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/conversations/:sessionId/messages
   * Saves a new message within a conversation session.
   *
   * HTTP 201 – message created
   * HTTP 400 – validation failure (handled by validator middleware)
   * HTTP 401 – unauthenticated
   * HTTP 403 – conversation belongs to another user
   * HTTP 404 – conversation not found
   */
  async createMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const { sessionId } = req.params;
      const dto: CreateMessageDto = req.body;
      const message = await this.conversationService.createMessage(req.user.id, sessionId, dto);

      res.status(HttpStatusCodes.CREATED).json({
        success: true,
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/conversations/:sessionId
   * Deletes a conversation and all its messages.
   *
   * HTTP 200 – conversation deleted
   * HTTP 401 – unauthenticated
   * HTTP 403 – conversation belongs to another user
   * HTTP 404 – conversation not found
   */
  async deleteConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const { sessionId } = req.params;
      await this.conversationService.deleteConversation(req.user.id, sessionId);

      res.status(HttpStatusCodes.OK).json({
        success: true,
        message: 'Conversation deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}
