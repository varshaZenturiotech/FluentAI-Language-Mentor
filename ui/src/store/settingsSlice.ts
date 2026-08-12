import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppSettings } from '../types/settings';

const initialState: AppSettings = {
  theme: 'light',
  audioEnabled: true,
  autoPlayAudio: true,
  voiceSpeed: '1.0x',
  voiceGender: 'Female',
  nativeLanguage: 'Malayalam',
  learningLanguage: 'English',
  emailNotifications: true,
  dailyReminder: true,
  showMalayalamTranslations: true,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettings: (state, action: PayloadAction<Partial<AppSettings>>) => {
      return { ...state, ...action.payload };
    },
    resetSettings: () => initialState,
  },
});

export const { updateSettings, resetSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
