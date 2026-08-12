/**
 * DTO for marking a lesson as completed (POST /api/v1/learning/progress).
 */
export interface CreateProgressDto {
  lessonId: string;
  score: number;
}
