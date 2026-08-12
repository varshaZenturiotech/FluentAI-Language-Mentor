import apiClient from './axios';

export interface LearningProfile {
  id?: string;
  userId?: string;
  ageGroup: string;
  occupation?: string | null;
  englishLevel: string;
  nativeLanguage: string;
  dailyGoal: number;
  goals: string[];
  interests: string[];
  onboardingCompleted?: boolean;
  baselineSkills?: {
    grammar: number;
    vocabulary: number;
    reading: number;
    speaking: number;
    listening: number;
    writing: number;
    pronunciation: number;
    fluency: number;
    completed?: boolean;
    actualGrammar?: number;
    actualVocabulary?: number;
    actualReading?: number;
    actualListening?: number;
    actualWriting?: number;
    actualSpeaking?: number;
    actualPronunciation?: number;
    actualFluency?: number;
    actualLevel?: string;
    actualScore?: number;
    actualStrengths?: string[];
    actualWeaknesses?: string[];
  };
}

export interface LearningProfileResponse {
  onboardingCompleted: boolean;
  profile: LearningProfile | null;
}

export const learningProfileApi = {
  async getProfile(): Promise<LearningProfileResponse> {
    const response = await apiClient.get('/learning-profile');
    return response.data.data;
  },

  async createProfile(data: LearningProfile): Promise<LearningProfile> {
    const response = await apiClient.post('/learning-profile', data);
    return response.data.data;
  },

  async updateProfile(data: LearningProfile): Promise<LearningProfile> {
    const response = await apiClient.put('/learning-profile', data);
    return response.data.data;
  },

  async submitBaselineAssessment(formData: FormData): Promise<any> {
    const response = await apiClient.post('/learning-profile/baseline-assessment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
};
