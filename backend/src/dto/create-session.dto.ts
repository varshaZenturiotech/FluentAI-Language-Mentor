/**
 * Data Transfer Object for POST /api/v1/conversations.
 * Represents the validated request body when creating a new conversation session.
 */
export interface CreateSessionDto {
  title: string;
  topic?: string;
  lessonType?: string;
  language?: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}
