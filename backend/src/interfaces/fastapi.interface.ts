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

export interface IFastApiClient {
  chat(
    payload: ChatRequestPayload,
    requestId?: string,
    userId?: string
  ): Promise<ChatResponsePayload>;
  initLesson(
    payload: any,
    requestId?: string,
    userId?: string
  ): Promise<ChatResponsePayload>;
  translate(
    payload: TranslateRequestPayload,
    requestId?: string,
    userId?: string
  ): Promise<TranslateResponsePayload>;
  feedback(
    payload: ConverseRequestPayload,
    requestId?: string,
    userId?: string
  ): Promise<ConverseResponsePayload>;
  pronunciation(
    payload: PronunciationRequestPayload,
    requestId?: string,
    userId?: string
  ): Promise<PronunciationResponsePayload>;
  speech(
    file: Express.Multer.File,
    language: string,
    requestId?: string,
    userId?: string
  ): Promise<SpeechResponsePayload>;
  generateStudyPlan(
    profile: any,
    baselineSkills?: any,
    requestId?: string,
    userId?: string
  ): Promise<any>;
  getRecommendations(
    profile: any,
    progress: any,
    mistakes: any[],
    vocab: string[],
    requestId?: string,
    userId?: string
  ): Promise<any>;
  analyzeSession(
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
  ): Promise<any>;
  evaluateBaseline(
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
  ): Promise<any>;
  conversationalAssessmentNext(
    payload: {
      history: Array<{ role: string; content: string }>;
      turnCount: number;
      userMessage: string;
      targetLevel?: string;
    },
    requestId?: string,
    userId?: string
  ): Promise<any>;
}

