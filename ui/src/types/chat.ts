export interface GrammarCorrection {
  originalText: string;
  correctedText: string;
  explanation: string;
  ruleCategory: 'Tense' | 'Preposition' | 'Article' | 'Vocabulary' | 'Pronunciation' | 'Grammar';
  malayalamExplanation?: string;
}

export interface VocabularyItem {
  id: string;
  word: string;
  phonetic: string;
  meaning: string;
  malayalamMeaning: string;
  example: string;
  partOfSpeech: string;
  masteryPercentage: number;
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  malayalamTranslation?: string;
  timestamp: string;
  audioUrl?: string;
  grammarCorrections?: GrammarCorrection[];
  newVocabulary?: VocabularyItem[];
  pronunciationScore?: number; // 0 - 100
}

export interface ConversationSession {
  id: string;
  title: string;
  topic: string;
  date: string;
  durationSeconds: number;
  messageCount: number;
  grammarScore: number;
  xpEarned: number;
}

export interface ConversationState {
  currentSessionId: string | null;
  messages: Message[];
  activeTopic: string;
  isAiResponding: boolean;
  activeVocabulary: VocabularyItem[];
  recentCorrections: GrammarCorrection[];
}
