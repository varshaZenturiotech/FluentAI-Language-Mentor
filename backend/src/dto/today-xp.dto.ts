/**
 * Response shape for GET /api/v1/learning/today-xp.
 */
export interface TodayXpResult {
  todayXP: number;
  currentStreak: number;
  weeklyXP: number;
  monthlyXP: number;
  totalXP: number;
}
