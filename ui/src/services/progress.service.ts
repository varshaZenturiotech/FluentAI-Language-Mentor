import { ProgressStats } from '../types/progress';
import { delay } from './apiClient';

const MOCK_PROGRESS_STATS: ProgressStats = {
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

export const progressService = {
  async getProgressStats(): Promise<ProgressStats> {
    await delay(500);
    return MOCK_PROGRESS_STATS;
  },

  async addXp(amount: number): Promise<{ newTotalXp: number }> {
    await delay(200);
    return { newTotalXp: MOCK_PROGRESS_STATS.weeklyXp + amount };
  },
};
