import { fastApiClient } from '../clients/fastapi.client';
import { ChatDto } from '../dto/chat.dto';
import { TranslateDto } from '../dto/translate.dto';
import { FeedbackDto } from '../dto/feedback.dto';
import { PronunciationDto } from '../dto/pronunciation.dto';
import {
  ChatResponsePayload,
  TranslateResponsePayload,
  ConverseResponsePayload,
  PronunciationResponsePayload,
  SpeechResponsePayload,
  TranslateRequestPayload,
  ConverseRequestPayload,
  PronunciationRequestPayload,
} from '../types/ai.types';

import { prisma } from '../database/prisma';

export class AiService {
  private readonly client = fastApiClient;

  async chat(userId: string, dto: ChatDto, requestId?: string): Promise<ChatResponsePayload> {
    const session = await prisma.conversationSession.findUnique({
      where: { id: dto.sessionId },
    });

    if (session) {
      // 1. Save user's message to database
      await prisma.message.create({
        data: {
          sessionId: dto.sessionId,
          role: 'USER',
          content: dto.message,
        },
      });

      // Update session metrics
      await prisma.conversationSession.update({
        where: { id: dto.sessionId },
        data: {
          lastMessageAt: new Date(),
          totalMessages: { increment: 1 },
        },
      });
    }

    // 2. Load conversation history
    let history: any[] = [];
    if (session) {
      const dbMessages = await prisma.message.findMany({
        where: { sessionId: dto.sessionId },
        orderBy: { createdAt: 'asc' },
      });
      history = dbMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
    }

    // 3. Construct learnerProfile, learningMemory and lessonContext if available
    let lessonContext: any = null;
    let learnerProfile: any = null;
    let learningMemory: any = null;

    if (userId) {
      const userProfile = await prisma.learningProfile.findUnique({
        where: { userId },
        include: { goals: true, interests: true },
      });

      if (userProfile) {
        learnerProfile = {
          nativeLanguage: userProfile.nativeLanguage,
          ageGroup: userProfile.ageGroup,
          occupation: userProfile.occupation,
          englishLevel: userProfile.englishLevel,
          goals: userProfile.goals.map((g: any) => g.goal),
          interests: userProfile.interests.map((i: any) => i.interest),
          dailyGoal: userProfile.dailyLearningGoal,
        };
      }

      // Load weak grammar topics
      const weakTopics = await prisma.weakTopic.findMany({
        where: { userId, status: 'active' },
        select: { topic: true, mistakeCount: true },
        take: 10,
      });

      // Load vocabulary progress
      const vocabProgress = await prisma.vocabularyProgress.findMany({
        where: { userId },
        select: { word: true, status: true, masteryPercentage: true },
        take: 10,
      });

      // Load recent grammar mistakes
      const grammarMistakes = await prisma.grammarMistake.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { sentence: true, correctSentence: true, explanation: true, grammarRule: true },
        take: 5,
      });

      // Load last learning session summary
      const lastSession = await prisma.learningSession.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      learningMemory = {
        weakGrammarTopics: weakTopics.map((t) => t.topic),
        vocabulary: vocabProgress.map((v) => ({
          word: v.word,
          status: v.status,
          mastery: v.masteryPercentage,
        })),
        previousMistakes: grammarMistakes.map((m) => ({
          original: m.sentence,
          corrected: m.correctSentence,
          explanation: m.explanation || '',
          rule: m.grammarRule || '',
        })),
        strengths: lastSession ? [
          ...(lastSession.grammarScore > 75 ? ['Grammar'] : []),
          ...(lastSession.vocabularyScore > 75 ? ['Vocabulary'] : []),
          ...(lastSession.fluencyScore > 75 ? ['Speaking Fluency'] : []),
          ...(lastSession.confidenceScore > 75 ? ['Confidence'] : []),
        ] : [],
        recentSessionSummary: lastSession ? lastSession.recommendations : null,
        confidence: lastSession ? lastSession.confidenceScore : 70,
        fluency: lastSession ? lastSession.fluencyScore : 70,
      };
    }

    if (session?.lessonId) {
      const day = await prisma.studyPlanDay.findUnique({
        where: { id: session.lessonId },
      });
      if (day) {
        lessonContext = {
          studyPlanId: day.studyPlanId,
          weekId: `${day.studyPlanId}-week-${Math.ceil(day.dayNumber / 7)}`,
          dayId: day.id,
          lessonId: day.id,
          title: day.title,
          objectives: [day.lessonContent],
          lessonType: day.lessonType.toLowerCase(),
          difficulty: (session.difficulty || 'beginner').toLowerCase(),
          estimatedMinutes: day.estimatedMinutes || 20,
        };
      }
    }

    // 4. Request completion from AI Gateway
    const payload = {
      sessionId: dto.sessionId,
      message: dto.message,
      language: dto.language,
      history,
      lessonContext,
      learnerProfile,
      learningMemory,
    };

    const result = await this.client.chat(payload as any, requestId, userId);

    if (session && result.reply) {
      // 5. Save AI's response to database
      await prisma.message.create({
        data: {
          sessionId: dto.sessionId,
          role: 'ASSISTANT',
          content: result.reply,
        },
      });

      // Update session metrics again
      await prisma.conversationSession.update({
        where: { id: dto.sessionId },
        data: {
          lastMessageAt: new Date(),
          totalMessages: { increment: 1 },
        },
      });
    }

    return result;
  }

  async translate(
    userId: string,
    dto: TranslateDto,
    requestId?: string
  ): Promise<TranslateResponsePayload> {
    const payload: TranslateRequestPayload = {
      text: dto.text,
      source_language: dto.sourceLanguage,
      target_language: dto.targetLanguage,
    };
    return this.client.translate(payload, requestId, userId);
  }

  async feedback(
    userId: string,
    dto: FeedbackDto,
    requestId?: string
  ): Promise<ConverseResponsePayload> {
    const payload: ConverseRequestPayload = {
      session_id: dto.sessionId,
      user_id: userId,
      transcript: dto.transcript,
      conversation_history: (dto.conversationHistory || []).map((h) => ({
        role: h.role,
        content: h.content,
      })),
      target_language: dto.targetLanguage,
      proficiency_level: dto.proficiencyLevel || 'BEGINNER',
    };
    return this.client.feedback(payload, requestId, userId);
  }

  async pronunciation(
    userId: string,
    dto: PronunciationDto,
    requestId?: string
  ): Promise<PronunciationResponsePayload> {
    const payload: PronunciationRequestPayload = {
      session_id: dto.sessionId,
      user_id: userId,
      audio_url: dto.audioUrl,
      reference_text: dto.referenceText,
    };
    return this.client.pronunciation(payload, requestId, userId);
  }

  async speech(
    userId: string,
    file: Express.Multer.File,
    language: string,
    requestId?: string
  ): Promise<SpeechResponsePayload> {
    return this.client.speech(file, language, requestId, userId);
  }
}

export const aiService = new AiService();
