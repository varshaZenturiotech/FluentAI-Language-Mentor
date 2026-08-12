export interface LearningProfileDto {
  ageGroup: string;
  occupation?: string;
  englishLevel: string;
  nativeLanguage: string;
  dailyGoal: number;
  goals: string[];
  interests: string[];
  baselineSkills?: {
    grammar: number;
    vocabulary: number;
    reading: number;
    speaking: number;
    listening: number;
    writing: number;
    pronunciation: number;
    fluency: number;
  };
}
