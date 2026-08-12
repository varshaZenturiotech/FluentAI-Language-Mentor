export interface FeedbackDto {
  sessionId: string;
  transcript: string;
  conversationHistory?: Array<{
    role: 'USER' | 'ASSISTANT';
    content: string;
  }>;
  targetLanguage: string;
  proficiencyLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}
