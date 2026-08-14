import apiClient from './axios';

export interface ChatRequest {
  sessionId: string;
  message: string;
  language: string;
}

export interface ChatResponse {
  reply: string;
  provider: string;
  model: string;
  lessonComplete?: boolean;
  completedObjectives?: string[];
}

export interface TranslateRequest {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
}

export interface TranslateResponse {
  translated_text: string;
  detected_source_language?: string;
}

export interface FeedbackRequest {
  sessionId: string;
  transcript: string;
  conversationHistory?: Array<{
    role: 'USER' | 'ASSISTANT';
    content: string;
  }>;
  targetLanguage: string;
  proficiencyLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

export interface FeedbackResponse {
  reply_text: string;
  corrected_text: string | null;
  feedback: string | null;
  corrections: Array<{
    original: string;
    corrected: string;
    explanation: string;
    grammar_rule: string;
  }>;
  emotion: string;
  blend_shapes: Record<string, number>;
}

export interface PronunciationRequest {
  sessionId: string;
  audioUrl: string;
  referenceText: string;
}

export interface PronunciationResponse {
  overall_score: number;
  accuracy_score: number;
  fluency_score: number;
  completeness_score: number;
  words: Array<{
    word: string;
    score: number;
    phonemes: Array<{
      phoneme: string;
      score: number;
    }>;
  }>;
}

export interface SpeechRequest {
  audioUrl: string;
  language: string;
}

export interface SpeechResponse {
  transcript: string;
  confidence: number;
}

export const aiApi = {
  async chat(payload: ChatRequest): Promise<ChatResponse> {
    const response = await apiClient.post('/ai/chat', payload);
    return response.data.data;
  },

  async translate(payload: TranslateRequest): Promise<TranslateResponse> {
    const response = await apiClient.post('/ai/translate', payload);
    return response.data.data;
  },

  async feedback(payload: FeedbackRequest): Promise<FeedbackResponse> {
    const response = await apiClient.post('/ai/feedback', payload);
    return response.data.data;
  },

  async pronunciation(payload: PronunciationRequest): Promise<PronunciationResponse> {
    const response = await apiClient.post('/ai/pronunciation', payload);
    return response.data.data;
  },

  async speech(file: Blob, language: string): Promise<SpeechResponse> {
    const formData = new FormData();
    formData.append('file', file, 'recording.wav');
    formData.append('language', language);
    const response = await apiClient.post('/ai/speech', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
};
