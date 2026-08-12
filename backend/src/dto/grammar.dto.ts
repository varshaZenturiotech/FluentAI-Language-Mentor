/**
 * DTO for creating a grammar mistake record (POST /api/v1/learning/grammar).
 */
export interface CreateGrammarDto {
  sentence: string;
  correctSentence: string;
  explanation?: string;
  grammarRule?: string;
  mistakeType?: string;
}
