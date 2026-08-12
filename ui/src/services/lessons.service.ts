import { delay } from './apiClient';

export interface Lesson {
  id: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  durationMinutes: number;
  xpReward: number;
  description: string;
  icon: string;
  completed: boolean;
}

const MOCK_LESSONS: Lesson[] = [
  {
    id: 'l1',
    title: 'Job Interview Confidence',
    category: 'Business English',
    difficulty: 'Intermediate',
    durationMinutes: 15,
    xpReward: 100,
    description: 'Master answering behavioral interview questions in English without hesitating.',
    icon: 'Briefcase',
    completed: true,
  },
  {
    id: 'l2',
    title: 'Casual Small Talk',
    category: 'Socializing',
    difficulty: 'Beginner',
    durationMinutes: 10,
    xpReward: 80,
    description: 'Learn how to start friendly conversations at coffee shops and networking events.',
    icon: 'Coffee',
    completed: false,
  },
  {
    id: 'l3',
    title: 'Expressing Disagreement Politely',
    category: 'Communication',
    difficulty: 'Advanced',
    durationMinutes: 12,
    xpReward: 120,
    description: 'Use diplomatic phrasing to express differing opinions constructively.',
    icon: 'MessageSquare',
    completed: false,
  },
  {
    id: 'l4',
    title: 'Pronunciation: Silent Letters & Vowels',
    category: 'Phonetics',
    difficulty: 'Intermediate',
    durationMinutes: 8,
    xpReward: 90,
    description: 'Target common pronunciation pitfalls for Malayalam native speakers.',
    icon: 'Mic',
    completed: false,
  },
];

export const lessonsService = {
  async getLessons(): Promise<Lesson[]> {
    await delay(400);
    return MOCK_LESSONS;
  },

  async startLesson(id: string): Promise<Lesson> {
    await delay(300);
    const lesson = MOCK_LESSONS.find((l) => l.id === id);
    if (!lesson) throw new Error('Lesson not found');
    return lesson;
  },
};
