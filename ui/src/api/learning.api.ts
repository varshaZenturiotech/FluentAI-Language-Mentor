import apiClient from './axios';
import { VocabularyItem, GrammarCorrection } from '../types/chat';
import { Achievement } from '../types/user';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  xpReward: number;
}

export interface ProgressLog {
  id: string;
  lessonId: string;
  completedAt: string;
  xpEarned: number;
}

export const learningApi = {
  async getTodayXp(): Promise<{ xp: number }> {
    const response = await apiClient.get('/learning/today-xp');
    return response.data.data;
  },

  async getVocabulary(): Promise<VocabularyItem[]> {
    const response = await apiClient.get('/learning/vocabulary');
    return response.data.data;
  },

  async createVocabulary(payload: Partial<VocabularyItem>): Promise<VocabularyItem> {
    const response = await apiClient.post('/learning/vocabulary', payload);
    return response.data.data;
  },

  async updateVocabulary(id: string, payload: Partial<VocabularyItem>): Promise<VocabularyItem> {
    const response = await apiClient.put(`/learning/vocabulary/${id}`, payload);
    return response.data.data;
  },

  async deleteVocabulary(id: string): Promise<void> {
    await apiClient.delete(`/learning/vocabulary/${id}`);
  },

  async getGrammarMistakes(): Promise<GrammarCorrection[]> {
    const response = await apiClient.get('/learning/grammar');
    return response.data.data;
  },

  async createGrammarMistake(payload: Partial<GrammarCorrection>): Promise<GrammarCorrection> {
    const response = await apiClient.post('/learning/grammar', payload);
    return response.data.data;
  },

  async getLessons(): Promise<Lesson[]> {
    const response = await apiClient.get('/learning/lessons');
    return response.data.data;
  },

  async getProgress(): Promise<ProgressLog[]> {
    const response = await apiClient.get('/learning/progress');
    return response.data.data;
  },

  async completeLesson(lessonId: string, xpEarned: number): Promise<ProgressLog> {
    const response = await apiClient.post('/learning/progress', { lessonId, xpEarned });
    return response.data.data;
  },

  async getAchievements(): Promise<Achievement[]> {
    const response = await apiClient.get('/learning/achievements');
    return response.data.data;
  },

  async getLearningAnalytics(): Promise<any> {
    const response = await apiClient.get('/learning-analytics');
    return response.data.data;
  },

  async getXpHistory(): Promise<any> {
    const response = await apiClient.get('/xp');
    return response.data.data;
  },

  async getStreakDetails(): Promise<any> {
    const response = await apiClient.get('/streak');
    return response.data.data;
  },

  async getVocabularyProgress(): Promise<any> {
    const response = await apiClient.get('/vocabulary-progress');
    return response.data.data;
  },

  async getGrammarProgress(): Promise<any> {
    const response = await apiClient.get('/grammar-progress');
    return response.data.data;
  },

  async analyzeSession(sessionId: string, studyPlanDayId?: string | null): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/learning/analyze', { sessionId, studyPlanDayId });
    return response.data;
  },

  async getSessionStatus(sessionId: string): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.get(`/learning/sessions/${sessionId}`);
    return response.data;
  },
};
