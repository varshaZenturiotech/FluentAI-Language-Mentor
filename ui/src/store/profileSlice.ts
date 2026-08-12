import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile } from '../types/user';

export interface ProfileState extends UserProfile {
  isLoading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  id: '',
  name: '',
  email: '',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fluentai',
  nativeLanguage: 'Malayalam',
  learningLanguage: 'English',
  level: 'Beginner',
  currentStreakDays: 0,
  totalXp: 0,
  speakingTimeMinutes: 0,
  vocabularyCount: 0,
  grammarAccuracy: 0,
  achievements: [],
  isLoading: false,
  error: null,
};

export const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      return {
        ...state,
        ...action.payload,
        isLoading: false,
        error: null,
      };
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      return {
        ...state,
        ...action.payload,
        isLoading: false,
        error: null,
      };
    },
    incrementXp: (state, action: PayloadAction<number>) => {
      state.totalXp += action.payload;
    },
    incrementStreak: (state) => {
      state.currentStreakDays += 1;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearProfile: () => {
      return initialState;
    },
  },
});

export const {
  setProfile,
  updateProfile,
  incrementXp,
  incrementStreak,
  setLoading,
  setError,
  clearProfile,
} = profileSlice.actions;

export default profileSlice.reducer;
