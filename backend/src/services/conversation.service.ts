import { CreateSessionDto } from '../dto/create-session.dto';
import { CreateMessageDto } from '../dto/create-message.dto';
import {
  ConversationRepository,
  SessionResult,
  MessageResult,
} from '../repositories/conversation.repository';
import { ApiError } from '../utils/ApiError';
import { HttpStatusCodes } from '../constants/httpStatusCodes';
import { ProgressTracker } from '../utils/progress-tracker';

/**
 * Conversation Service
 *
 * Responsibility: Business logic ONLY.
 * - Enforces ownership checks (user can only access their own conversations).
 * - Orchestrates repository calls.
 * - Throws semantic ApiErrors understood by the global error handler.
 *
 * Never performs direct Prisma queries.
 */
export class ConversationService {
  private conversationRepository: ConversationRepository;

  constructor(conversationRepository: ConversationRepository = new ConversationRepository()) {
    this.conversationRepository = conversationRepository;
  }

  /**
   * Creates a new conversation session for the authenticated user.
   */
  async createSession(userId: string, dto: CreateSessionDto): Promise<SessionResult> {
    const session = await this.conversationRepository.createSession(userId, dto);
    await ProgressTracker.trackProgressEvent(userId, 'conversation', 10);
    return session;
  }

  /**
   * Returns all conversation sessions for the authenticated user, newest first.
   * Each session includes its message count.
   */
  async getSessions(userId: string): Promise<SessionResult[]> {
    return this.conversationRepository.findSessionsByUser(userId);
  }

  /**
   * Returns all messages for a specific conversation session.
   *
   * @throws {ApiError} 404 – conversation not found
   * @throws {ApiError} 403 – conversation belongs to another user
   */
  async getMessages(userId: string, sessionId: string): Promise<MessageResult[]> {
    const session = await this.findAndVerifyOwnership(userId, sessionId);
    return this.conversationRepository.findMessages(session.id);
  }

  /**
   * Creates a new message within a conversation session.
   *
   * @throws {ApiError} 404 – conversation not found
   * @throws {ApiError} 403 – conversation belongs to another user
   */
  async createMessage(
    userId: string,
    sessionId: string,
    dto: CreateMessageDto
  ): Promise<MessageResult> {
    const session = await this.findAndVerifyOwnership(userId, sessionId);
    return this.conversationRepository.createMessage(session.id, dto);
  }

  /**
   * Deletes a conversation and all its messages.
   *
   * @throws {ApiError} 404 – conversation not found
   * @throws {ApiError} 403 – conversation belongs to another user
   */
  async deleteConversation(userId: string, sessionId: string): Promise<void> {
    const session = await this.findAndVerifyOwnership(userId, sessionId);
    await this.conversationRepository.deleteConversation(session.id);
  }

  /**
   * Finds a conversation session and verifies the authenticated user owns it.
   * Centralised here so every action that requires ownership checks goes through
   * the same consistent logic.
   *
   * @throws {ApiError} 404 – session does not exist
   * @throws {ApiError} 403 – session belongs to a different user
   */
  private async findAndVerifyOwnership(
    userId: string,
    sessionId: string
  ): Promise<{ id: string; userId: string }> {
    const session = await this.conversationRepository.findSessionById(sessionId);

    if (!session) {
      throw new ApiError(HttpStatusCodes.NOT_FOUND, 'Conversation not found.');
    }

    if (session.userId !== userId) {
      throw new ApiError(
        HttpStatusCodes.FORBIDDEN,
        'You do not have permission to access this conversation.'
      );
    }

    return session;
  }
}
