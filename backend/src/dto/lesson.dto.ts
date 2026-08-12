/**
 * Query parameters for GET /api/v1/learning/lessons.
 */
export interface LessonQueryDto {
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  language?: string;
  page?: number;
  limit?: number;
}
