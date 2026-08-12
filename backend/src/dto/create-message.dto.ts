/**
 * Data Transfer Object for POST /api/v1/conversations/:sessionId/messages.
 * Represents the validated request body when creating a new message.
 */
export interface CreateMessageDto {
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  translatedText?: string;
  correctedText?: string;
  feedback?: string;
  audioUrl?: string;
  translatedContent?: string;
}
