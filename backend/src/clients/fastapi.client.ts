import axios, { AxiosInstance, AxiosError } from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { IFastApiClient } from '../interfaces/fastapi.interface';
import { ApiError } from '../utils/ApiError';
import { HttpStatusCodes, HttpStatusCode } from '../constants/httpStatusCodes';
import {
  ChatRequestPayload,
  ChatResponsePayload,
  TranslateRequestPayload,
  TranslateResponsePayload,
  ConverseRequestPayload,
  ConverseResponsePayload,
  PronunciationRequestPayload,
  PronunciationResponsePayload,
  SpeechResponsePayload,
} from '../types/ai.types';

export class FastApiClient implements IFastApiClient {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.AI_SERVICE_URL,
      timeout: env.AI_REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': env.INTERNAL_API_KEY,
      },
    });
  }

  private async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    retriesLeft = 1,
    delayMs = 1500
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error: any) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const errorCode = axios.isAxiosError(error) ? error.response?.data?.error?.code : undefined;

      // DO NOT retry 429 rate limit errors or 4xx client errors
      if (status === 429 || errorCode === 'LLM_RATE_LIMITED' || (status && status >= 400 && status < 500)) {
        logger.warn(`[AI_RATE_LIMITED] Received ${status} from AI Gateway (${errorCode}). Skipping retry.`, {
          status,
          code: errorCode,
        });
        throw error;
      }

      const isTransient =
        axios.isAxiosError(error) &&
        ((status && status >= 500) ||
          error.code === 'ECONNABORTED' ||
          !error.response);

      if (isTransient && retriesLeft > 0) {
        logger.warn(
          `[AI_RETRY] FastAPI Client transient error ${status || error.code}. Retrying in ${delayMs}ms... (${retriesLeft} attempts left)`,
          {
            error: error.message,
          }
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return this.executeWithRetry(requestFn, retriesLeft - 1, delayMs * 2);
      }
      throw error;
    }
  }

  private handleError(error: any): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      const status = axiosError.response?.status;
      const responseData = axiosError.response?.data;
      const message = responseData?.error?.message || responseData?.message || axiosError.message;

      logger.error(`FastAPI Client HTTP Error | status: ${status} | message: ${message}`, {
        status,
        code: axiosError.code,
        url: axiosError.config?.url,
      });

      if (status) {
        if (status === 401 || status === 403) {
          throw new ApiError(status as HttpStatusCode, 'Unauthorized access to the AI Gateway.');
        } else if (status === 404) {
          throw new ApiError(status as HttpStatusCode, 'AI Gateway resource not found.');
        } else if (status === 408 || axiosError.code === 'ECONNABORTED') {
          throw new ApiError(HttpStatusCodes.BAD_GATEWAY, 'AI Gateway request timed out.');
        }
        throw new ApiError(status as HttpStatusCode, message);
      }
    }

    logger.error('FastAPI Client unexpected error:', { error: error.message || error });
    throw new ApiError(
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to communicate with the internal AI Gateway.'
    );
  }

  private getHeaders(requestId?: string, userId?: string) {
    const headers: Record<string, string> = {};
    if (requestId) headers['X-Request-Id'] = requestId;
    if (userId) headers['X-User-Id'] = userId;
    return headers;
  }

  async chat(
    payload: ChatRequestPayload,
    requestId?: string,
    userId?: string
  ): Promise<ChatResponsePayload> {
    const startTime = Date.now();
    logger.info(
      `Sending Chat Request to FastAPI | sessionId: ${payload.sessionId} | reqId: ${requestId}`
    );

    try {
      const response = await this.executeWithRetry(async () => {
        return this.client.post('/api/v1/chat', payload, {
          headers: this.getHeaders(requestId, userId),
        });
      });

      const latency = Date.now() - startTime;
      logger.info(`FastAPI Chat Success | latency: ${latency}ms | status: ${response.status}`);
      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async initLesson(
    payload: any,
    requestId?: string,
    userId?: string
  ): Promise<ChatResponsePayload> {
    const startTime = Date.now();
    logger.info(
      `Sending Lesson Init Request to FastAPI | sessionId: ${payload.sessionId} | reqId: ${requestId}`
    );

    try {
      const response = await this.executeWithRetry(async () => {
        return this.client.post('/api/v1/chat/lesson-init', payload, {
          headers: this.getHeaders(requestId, userId),
        });
      });

      const latency = Date.now() - startTime;
      logger.info(`FastAPI Lesson Init Success | latency: ${latency}ms | status: ${response.status}`);
      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async translate(
    payload: TranslateRequestPayload,
    requestId?: string,
    userId?: string
  ): Promise<TranslateResponsePayload> {
    const startTime = Date.now();
    logger.info(`Sending Translate Request to FastAPI | reqId: ${requestId}`);

    const apiPayload = {
      text: payload.text,
      source_language: payload.source_language,
      target_language: payload.target_language,
    };

    try {
      const response = await this.executeWithRetry(async () => {
        return this.client.post('/internal/translate', apiPayload, {
          headers: this.getHeaders(requestId, userId),
        });
      });

      const latency = Date.now() - startTime;
      logger.info(`FastAPI Translate Success | latency: ${latency}ms | status: ${response.status}`);
      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async feedback(
    payload: ConverseRequestPayload,
    requestId?: string,
    userId?: string
  ): Promise<ConverseResponsePayload> {
    const startTime = Date.now();
    logger.info(
      `Sending Feedback (Chat-Fallback) Request to FastAPI | session_id: ${payload.session_id} | reqId: ${requestId}`
    );

    const chatPayload: ChatRequestPayload = {
      sessionId: payload.session_id,
      message: payload.transcript,
      language: payload.target_language,
    };

    try {
      const response = await this.executeWithRetry(async () => {
        return this.client.post('/api/v1/chat', chatPayload, {
          headers: this.getHeaders(requestId, userId),
        });
      });

      const latency = Date.now() - startTime;
      logger.info(`FastAPI Feedback Success | latency: ${latency}ms | status: ${response.status}`);

      const chatData: ChatResponsePayload = response.data.data;

      return {
        reply_text: chatData.reply,
        corrected_text: null,
        feedback: null,
        corrections: [],
        emotion: 'neutral',
        blend_shapes: {},
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async pronunciation(
    payload: PronunciationRequestPayload,
    requestId?: string,
    userId?: string
  ): Promise<PronunciationResponsePayload> {
    const startTime = Date.now();
    logger.info(
      `Sending Pronunciation Request to FastAPI | session_id: ${payload.session_id} | reqId: ${requestId}`
    );

    try {
      const response = await this.executeWithRetry(async () => {
        return this.client.post('/internal/pronunciation', payload, {
          headers: this.getHeaders(requestId, userId),
        });
      });

      const latency = Date.now() - startTime;
      logger.info(
        `FastAPI Pronunciation Success | latency: ${latency}ms | status: ${response.status}`
      );
      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async speech(
    file: Express.Multer.File,
    language: string,
    requestId?: string,
    userId?: string
  ): Promise<SpeechResponsePayload> {
    const startTime = Date.now();
    logger.info(
      `Sending Speech Request to FastAPI | filename: ${file.originalname} | size: ${file.size} bytes | language: ${language} | reqId: ${requestId}`
    );

    try {
      const formData = new FormData();
      const blob = new Blob([file.buffer], { type: file.mimetype });
      formData.append('file', blob, file.originalname);
      formData.append('language', language);

      const response = await this.executeWithRetry(async () => {
        return this.client.post('/api/v1/speech/transcribe', formData, {
          headers: {
            ...this.getHeaders(requestId, userId),
            'Content-Type': 'multipart/form-data',
          },
        });
      });

      const latency = Date.now() - startTime;
      logger.info(`FastAPI Speech Success | latency: ${latency}ms | status: ${response.status}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async generateStudyPlan(
    profile: any,
    baselineSkills?: any,
    requestId?: string,
    userId?: string
  ): Promise<any> {
    const startTime = Date.now();
    logger.info(`Sending Generate Study Plan Request to FastAPI | reqId: ${requestId}`);

    try {
      const response = await this.executeWithRetry(async () => {
        return this.client.post('/api/v1/study-plan/generate', { profile, baseline_skills: baselineSkills }, {
          headers: this.getHeaders(requestId, userId),
        });
      }, 0);

      const latency = Date.now() - startTime;
      logger.info(`FastAPI Generate Study Plan Success | latency: ${latency}ms | status: ${response.status}`);
      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getRecommendations(
    profile: any,
    progress: any,
    mistakes: any[],
    vocab: string[],
    requestId?: string,
    userId?: string
  ): Promise<any> {
    const startTime = Date.now();
    logger.info(`Sending Recommendations Request to FastAPI | reqId: ${requestId}`);

    try {
      // No retry: the AI Gateway already has its own service-level fallback for
      // LLM failures. Retrying here only compounds latency and increases the
      // chance of cascading 502s reaching the frontend.
      const response = await this.client.post('/api/v1/study-plan/recommendations', {
        profile,
        progress,
        mistakes,
        vocab
      }, {
        headers: this.getHeaders(requestId, userId),
      });

      const latency = Date.now() - startTime;
      logger.info(`FastAPI Recommendations Success | latency: ${latency}ms | status: ${response.status}`);
      return response.data.data;
    } catch (error: any) {
      const latency = Date.now() - startTime;
      const status = error?.response?.status;
      const message = error?.response?.data?.error?.message || error?.message || 'unknown';
      logger.error(
        `FastAPI Recommendations Failed | latency: ${latency}ms | status: ${status} | message: ${message}`
      );

      // Return a backend-level fallback so the frontend always receives a
      // usable recommendations object rather than a 502.
      return {
        focus: 'Daily Grammar & Conversation Focus',
        reason: "Let's work on conversation fluency and review common grammar topics.",
        vocabulary: ['Practice', 'Communicate', 'Fluency', 'Grammar', 'Vocabulary'],
      };
    }
  }

  async analyzeSession(
    payload: {
      profile: any;
      study_plan: any;
      current_lesson: any;
      weak_topics: string[];
      recent_vocab: string[];
      prev_summary: string | null;
      messages: any[];
    },
    requestId?: string,
    userId?: string
  ): Promise<any> {
    const startTime = Date.now();
    logger.info(`Sending Analyze Session Request to FastAPI | reqId: ${requestId}`);

    try {
      const response = await this.executeWithRetry(async () => {
        return this.client.post('/api/v1/learning/analyze', {
          profile: payload.profile,
          study_plan: payload.study_plan,
          current_lesson: payload.current_lesson,
          weak_topics: payload.weak_topics,
          recent_vocab: payload.recent_vocab,
          prev_summary: payload.prev_summary,
          messages: payload.messages,
        }, {
          headers: this.getHeaders(requestId, userId),
        });
      });

      const latency = Date.now() - startTime;
      logger.info(`FastAPI Analyze Session Success | latency: ${latency}ms | status: ${response.status}`);
      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async evaluateBaseline(
    payload: {
      writingText: string;
      speakingTranscript?: string;
      mcGrammarScore: number;
      mcGrammarTotal: number;
      mcVocabularyScore: number;
      mcVocabularyTotal: number;
      mcReadingScore: number;
      mcReadingTotal: number;
      mcListeningScore: number;
      mcListeningTotal: number;
      targetLevel: string;
      speakingAudioProvided?: boolean;
    },
    requestId?: string,
    userId?: string
  ): Promise<any> {
    const startTime = Date.now();
    logger.info(`Sending Evaluate Baseline Request to FastAPI | reqId: ${requestId}`);

    try {
      const response = await this.executeWithRetry(async () => {
        return this.client.post('/api/v1/learning/evaluate-baseline', payload, {
          headers: this.getHeaders(requestId, userId),
        });
      });

      const latency = Date.now() - startTime;
      logger.info(`FastAPI Evaluate Baseline Success | latency: ${latency}ms | status: ${response.status}`);
      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const fastApiClient = new FastApiClient();
