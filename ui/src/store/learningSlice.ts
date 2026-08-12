import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProgressStats, DailyXP, SkillBreakdown } from '../types/progress';
import { Lesson, ProgressLog } from '../api/learning.api';
import { Achievement } from '../types/user';

export interface LearningState extends ProgressStats {
  lessons: Lesson[];
  progressLogs: ProgressLog[];
  achievements: Achievement[];
  todayXp: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: LearningState = {
  speakingTimeMinutes: 0,
  grammarAccuracy: 0,
  vocabularyLearned: 0,
  currentStreak: 0,
  weeklyXp: 0,
  dailyProgress: [],
  skills: {
    pronunciation: 0,
    grammar: 0,
    fluency: 0,
    vocabulary: 0,
    listening: 0,
  },
  recentMistakes: [],
  lessons: [],
  progressLogs: [],
  achievements: [],
  todayXp: 0,
  isLoading: false,
  error: null,
};

export const learningSlice = createSlice({
  name: 'learning',
  initialState,
  reducers: {
    setLearningStats: (state, action: PayloadAction<Partial<ProgressStats>>) => {
      return {
        ...state,
        ...action.payload,
        isLoading: false,
        error: null,
      };
    },
    setLessons: (state, action: PayloadAction<Lesson[]>) => {
      state.lessons = action.payload;
    },
    setProgressLogs: (state, action: PayloadAction<ProgressLog[]>) => {
      state.progressLogs = action.payload;
    },
    setAchievements: (state, action: PayloadAction<Achievement[]>) => {
      state.achievements = action.payload;
    },
    setTodayXp: (state, action: PayloadAction<number>) => {
      state.todayXp = action.payload;
    },
    addXp: (state, action: PayloadAction<number>) => {
      state.weeklyXp += action.payload;
      state.todayXp += action.payload;
    },
    addSpeakingMinutes: (state, action: PayloadAction<number>) => {
      state.speakingTimeMinutes += action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearLearning: () => {
      return initialState;
    },
  },
});

export const {
  setLearningStats,
  setLessons,
  setProgressLogs,
  setAchievements,
  setTodayXp,
  addXp,
  addSpeakingMinutes,
  setLoading,
  setError,
  clearLearning,
} = learningSlice.actions;

export default learningSlice.reducer;
