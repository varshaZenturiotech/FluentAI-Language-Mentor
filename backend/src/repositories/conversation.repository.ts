import { ConversationStatus, MessageRole } from '@prisma/client';
import { CreateSessionDto } from '../dto/create-session.dto';
import { CreateMessageDto } from '../dto/create-message.dto';
import { prisma } from '../database/prisma';

/**
 * Shape of a conversation session returned to callers.
 * Includes an aggregated messageCount for list views.
 */
export interface SessionResult {
  id: string;
  title: string;
  topic: string | null;
  lessonType: string | null;
  language: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  lastMessageAt: Date | null;
  totalMessages: number;
  status: ConversationStatus;
  startedAt: Date;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

/**
 * Shape of a single message returned to callers.
 * Only includes the fields the API contract exposes — no internal DB metadata.
 */
export interface MessageResult {
  id: string;
  role: MessageRole;
  content: string;
  translatedText: string | null;
  correctedText: string | null;
  feedback: string | null;
  audioUrl?: string | null;
  translatedContent?: string | null;
  createdAt: Date;
}

/**
 * Shape of a raw conversation session row from Prisma (before message count enrichment).
 */
interface RawSession {
  id: string;
  userId: string;
  title: string;
  topic: string | null;
  lessonType: string | null;
  language: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  lastMessageAt: Date | null;
  totalMessages: number;
  status: ConversationStatus;
  startedAt: Date;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Conversation Repository
 *
 * Responsibility: Prisma data access ONLY.
 * No business logic. No error formatting. No HTTP concerns.
 */
export class ConversationRepository {
  private readonly prisma = prisma;

  /**
   * Creates a new conversation session for the given user.
   * Status defaults to ACTIVE, startedAt defaults to now() via Prisma schema.
   */
  async createSession(userId: string, dto: CreateSessionDto): Promise<SessionResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { learningLanguage: true, level: true },
    });

    const session = await this.prisma.conversationSession.create({
      data: {
        userId,
        title: dto.title,
        topic: dto.topic,
        lessonType: dto.lessonType,
        language: dto.language ?? user?.learningLanguage ?? 'en',
        difficulty: dto.difficulty ?? user?.level ?? 'BEGINNER',
        status: 'ACTIVE',
      },
    });

    return this.toSessionResult(session, 0);
  }

  /**
   * Returns all conversation sessions for a user, newest first.
   * Each session is enriched with its message count via Prisma's _count.
   */
  async findSessionsByUser(userId: string): Promise<SessionResult[]> {
    const sessions = await this.prisma.conversationSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return sessions.map((s) => this.toSessionResult(s, s._count.messages));
  }

  /**
   * Finds a single conversation session by its ID.
   * Returns null if not found. Caller must check ownership.
   */
  async findSessionById(sessionId: string): Promise<RawSession | null> {
    return this.prisma.conversationSession.findUnique({
      where: { id: sessionId },
    });
  }

  /**
   * Creates a new message within a conversation session.
   * Atomically updates totalMessages and lastMessageAt on the session.
   */
  async createMessage(sessionId: string, dto: CreateMessageDto): Promise<MessageResult> {
    const message = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          sessionId,
          role: dto.role,
          content: dto.content,
          translatedText: dto.translatedText,
          correctedText: dto.correctedText,
          feedback: dto.feedback,
          audioUrl: dto.audioUrl,
          translatedContent: dto.translatedContent,
        },
      });

      await tx.conversationSession.update({
        where: { id: sessionId },
        data: {
          lastMessageAt: msg.createdAt,
          totalMessages: {
            increment: 1,
          },
        },
      });

      return msg;
    });

    return {
      id: message.id,
      role: message.role,
      content: message.content,
      translatedText: message.translatedText,
      correctedText: message.correctedText,
      feedback: message.feedback,
      audioUrl: message.audioUrl,
      translatedContent: message.translatedContent,
      createdAt: message.createdAt,
    };
  }

  /**
   * Returns all messages for a conversation session, ordered by createdAt ascending.
   * Only selects the fields exposed by the API contract.
   */
  async findMessages(sessionId: string): Promise<MessageResult[]> {
    return this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        translatedText: true,
        correctedText: true,
        feedback: true,
        audioUrl: true,
        translatedContent: true,
        createdAt: true,
      },
    });
  }

  /**
   * Returns the total number of messages in a conversation session.
   */
  async countMessages(sessionId: string): Promise<number> {
    return this.prisma.message.count({
      where: { sessionId },
    });
  }

  /**
   * Deletes a conversation and all its messages within a single Prisma transaction.
   * Messages are deleted first to respect the foreign-key relationship,
   * although the schema also has onDelete: Cascade configured.
   */
  async deleteConversation(sessionId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.message.deleteMany({ where: { sessionId } });
      await tx.conversationSession.delete({ where: { id: sessionId } });
    });
  }

  /**
   * Maps a raw Prisma session row + message count into the public SessionResult shape.
   */
  private toSessionResult(session: RawSession, messageCount: number): SessionResult {
    return {
      id: session.id,
      title: session.title,
      topic: session.topic,
      lessonType: session.lessonType,
      language: session.language,
      difficulty: session.difficulty,
      lastMessageAt: session.lastMessageAt,
      totalMessages: session.totalMessages,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messageCount,
    };
  }
}
