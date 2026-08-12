export type ThemeMode = 'light' | 'dark' | 'system';
export type VoiceSpeed = '0.75x' | '1.0x' | '1.25x' | '1.5x';
export type VoiceGender = 'Female' | 'Male' | 'Neutral';

export interface AppSettings {
  theme: ThemeMode;
  audioEnabled: boolean;
  autoPlayAudio: boolean;
  voiceSpeed: VoiceSpeed;
  voiceGender: VoiceGender;
  nativeLanguage: string;
  learningLanguage: string;
  emailNotifications: boolean;
  dailyReminder: boolean;
  showMalayalamTranslations: boolean;
}
