export interface DailyXP {
  day: string; // e.g. 'Mon', 'Tue'
  xp: number;
  speakingMinutes: number;
}

export interface SkillBreakdown {
  pronunciation: number;
  grammar: number;
  fluency: number;
  vocabulary: number;
  listening: number;
}

export interface ProgressStats {
  speakingTimeMinutes: number;
  grammarAccuracy: number; // percentage e.g. 92
  vocabularyLearned: number;
  currentStreak: number;
  weeklyXp: number;
  dailyProgress: DailyXP[];
  skills: SkillBreakdown;
  recentMistakes: {
    id: string;
    phrase: string;
    correction: string;
    date: string;
    category: string;
  }[];
}
