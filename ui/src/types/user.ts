export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  unlockedAt?: string;
  progress: number; // 0 to 100
  isUnlocked: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  nativeLanguage: string;
  learningLanguage: string;
  level: string;
  currentStreakDays: number;
  totalXp: number;
  speakingTimeMinutes: number;
  vocabularyCount: number;
  grammarAccuracy: number;
  achievements: Achievement[];
}
