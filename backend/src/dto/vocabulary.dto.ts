/**
 * DTO for creating a new vocabulary entry (POST /api/v1/learning/vocabulary).
 */
export interface CreateVocabularyDto {
  word: string;
  meaning: string;
  example?: string;
  language: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

/**
 * DTO for updating a vocabulary entry (PUT /api/v1/learning/vocabulary/:id).
 * All fields are optional for partial updates.
 */
export interface UpdateVocabularyDto {
  word?: string;
  meaning?: string;
  example?: string;
  language?: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  mastered?: boolean;
  reviewCount?: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
}
