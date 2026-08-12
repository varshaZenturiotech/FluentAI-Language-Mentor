export interface ChatRequestPayload {
  sessionId: string;
  message: string;
  language: string;
  history?: { role: string; content: string }[];
  lessonContext?: any;
  learnerProfile?: any;
  learningMemory?: any;
}

export interface ChatResponsePayload {
  reply: string;
  provider: string;
  model: string;
}

export interface TranslateRequestPayload {
  text: string;
  source_language?: string;
  target_language: string;
}

export interface TranslateResponsePayload {
  translated_text: string;
  detected_source_language?: string;
}

export interface ConverseRequestPayload {
  session_id: string;
  user_id: string;
  transcript: string;
  conversation_history: { role: 'USER' | 'ASSISTANT'; content: string }[];
  target_language: string;
  proficiency_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

export interface ConverseResponsePayload {
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

export interface PronunciationRequestPayload {
  session_id: string;
  user_id: string;
  audio_url: string;
  reference_text: string;
}

export interface PronunciationResponsePayload {
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

export interface SpeechRequestPayload {
  audio_url: string;
  language: string;
}

export interface SpeechResponsePayload {
  transcript: string;
  confidence: number;
}
