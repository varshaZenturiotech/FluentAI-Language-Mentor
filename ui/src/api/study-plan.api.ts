import axiosInstance from './axios';

export interface StudyPlanDay {
  id: string;
  studyPlanId: string;
  dayNumber: number;
  weekNumber: number;
  title: string;
  estimatedMinutes: number;
  lessonType: string;
  lessonContent: string;
  status: 'LOCKED' | 'AVAILABLE' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

export type ObjectiveMasteryStatus = 'MASTERED' | 'PROFICIENT' | 'PRACTICING' | 'NOT_STARTED';

export interface ObjectiveMasteryRecord {
  id: string;
  objective: string;
  masteryScore: number;
  accuracy: number;
  attemptsCount: number;
  lastPracticed: string;
  masteryStatus: ObjectiveMasteryStatus;
}

export interface StudyPlan {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  durationWeeks: number;
  weeksMetadata: string | null;
  planVersion: number;
  /** All ObjectiveMastery records for this user, embedded by the backend in a single query. */
  objectiveMasteries: ObjectiveMasteryRecord[];
  /** The mastery score threshold used to derive masteryStatus — from the server constant. */
  objectiveMasteryThreshold: number;
  createdAt: string;
  updatedAt: string;
  days: StudyPlanDay[];
}

export interface LearningProgressData {
  lessonsCompleted: number;
  conversationsCompleted: number;
  vocabularyLearned: number;
  grammarTopicsCompleted: number;
  listeningSessions: number;
  pronunciationSessions: number;
  quizzesCompleted: number;
  studyMinutes: number;
  streak: number;
  completionPercentage: number;
  currentLevel: string;
}

export interface DailyLogData {
  id: string;
  userId: string;
  date: string;
  minutesStudied: number;
  completedLessons: number;
  completedTasks: number;
}

export interface ProgressResponse {
  progress: LearningProgressData;
  logs: DailyLogData[];
}

export interface AIRecommendation {
  focus: string;
  reason: string;
  vocabulary: string[];
}

export const studyPlanApi = {
  getStudyPlan: async (): Promise<StudyPlan> => {
    const response = await axiosInstance.get('/study-plan');
    return response.data.data;
  },

  generateStudyPlan: async (): Promise<{ planId: string; durationWeeks: number; plan: StudyPlan }> => {
    const response = await axiosInstance.post('/study-plan/generate');
    return response.data;
  },

  completeDay: async (dayId: string): Promise<StudyPlanDay> => {
    const response = await axiosInstance.put(`/study-plan/day/${dayId}/complete`);
    return response.data.data;
  },

  startLesson: async (dayId: string): Promise<{ lessonSession: any; conversationSession: any }> => {
    const response = await axiosInstance.post(`/study-plan/day/${dayId}/start`);
    return response.data.data;
  },

  getRecommendations: async (): Promise<AIRecommendation> => {
    const response = await axiosInstance.get('/study-plan/recommendations');
    return response.data.data;
  },

  getProgress: async (): Promise<ProgressResponse> => {
    const response = await axiosInstance.get('/study-plan/progress');
    return response.data.data;
  },

  getDashboard: async (): Promise<any> => {
    const response = await axiosInstance.get('/dashboard');
    return response.data.data;
  },
};
