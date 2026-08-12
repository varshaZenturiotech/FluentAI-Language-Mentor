import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile } from '../types/user';

const initialState: UserProfile = {
  id: 'user_12345',
  name: 'Rahul',
  email: 'rahul.@fluentai.app',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  nativeLanguage: 'Malayalam',
  learningLanguage: 'English',
  level: 'Intermediate',
  currentStreakDays: 12,
  totalXp: 2450,
  speakingTimeMinutes: 145,
  vocabularyCount: 184,
  grammarAccuracy: 92,
  achievements: [
    {
      id: 'ach_1',
      title: '7-Day Streak Master',
      description: 'Practiced speaking every day for 7 consecutive days.',
      iconName: 'Flame',
      progress: 100,
      isUnlocked: true,
      unlockedAt: 'July 28, 2026',
    },
    {
      id: 'ach_2',
      title: 'Vocabulary Master',
      description: 'Learned and retained 150+ new vocabulary words.',
      iconName: 'BookOpen',
      progress: 100,
      isUnlocked: true,
      unlockedAt: 'July 30, 2026',
    },
    {
      id: 'ach_3',
      title: 'Fluent Conversationalist',
      description: 'Completed 60 minutes of real-time AI voice dialogue.',
      iconName: 'Mic',
      progress: 100,
      isUnlocked: true,
      unlockedAt: 'August 1, 2026',
    },
    {
      id: 'ach_4',
      title: 'Grammar Perfectionist',
      description: 'Achieved 90%+ grammar accuracy across 10 lessons.',
      iconName: 'Award',
      progress: 92,
      isUnlocked: true,
      unlockedAt: 'August 1, 2026',
    },
    {
      id: 'ach_5',
      title: 'Speed Talker',
      description: 'Reach 30 minutes of continuous voice conversation in a single day.',
      iconName: 'Zap',
      progress: 65,
      isUnlocked: false,
    },
  ],
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateUserProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      return { ...state, ...action.payload };
    },
    incrementXp: (state, action: PayloadAction<number>) => {
      state.totalXp += action.payload;
    },
    incrementStreak: (state) => {
      state.currentStreakDays += 1;
    },
  },
});

export const { updateUserProfile, incrementXp, incrementStreak } = userSlice.actions;
export default userSlice.reducer;
