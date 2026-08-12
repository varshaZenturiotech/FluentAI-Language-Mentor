import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProgressStats } from '../types/progress';

const initialState: ProgressStats = {
  speakingTimeMinutes: 145,
  grammarAccuracy: 92,
  vocabularyLearned: 184,
  currentStreak: 12,
  weeklyXp: 850,
  dailyProgress: [
    { day: 'Mon', xp: 120, speakingMinutes: 20 },
    { day: 'Tue', xp: 150, speakingMinutes: 25 },
    { day: 'Wed', xp: 90, speakingMinutes: 15 },
    { day: 'Thu', xp: 210, speakingMinutes: 35 },
    { day: 'Fri', xp: 180, speakingMinutes: 30 },
    { day: 'Sat', xp: 60, speakingMinutes: 10 },
    { day: 'Sun', xp: 140, speakingMinutes: 22 },
  ],
  skills: {
    pronunciation: 88,
    grammar: 92,
    fluency: 84,
    vocabulary: 90,
    listening: 95,
  },
  recentMistakes: [
    {
      id: 'm1',
      phrase: 'I am agree with you',
      correction: 'I agree with you',
      date: 'Today',
      category: 'Verb Usage',
    },
    {
      id: 'm2',
      phrase: 'Discuss about project',
      correction: 'Discuss the project',
      date: 'Yesterday',
      category: 'Preposition',
    },
    {
      id: 'm3',
      phrase: 'He don\'t know',
      correction: 'He doesn\'t know',
      date: '3 days ago',
      category: 'Subject-Verb Agreement',
    },
  ],
};

export const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    setProgressData: (state, action: PayloadAction<ProgressStats>) => {
      return { ...state, ...action.payload };
    },
    addSpeakingTime: (state, action: PayloadAction<number>) => {
      state.speakingTimeMinutes += action.payload;
    },
  },
});

export const { setProgressData, addSpeakingTime } = progressSlice.actions;
export default progressSlice.reducer;
