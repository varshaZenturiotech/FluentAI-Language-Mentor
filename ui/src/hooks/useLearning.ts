import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { learningApi, Lesson, ProgressLog } from '../api/learning.api';
import {
  setLearningStats,
  setLessons,
  setProgressLogs,
  setAchievements,
  setTodayXp,
  addXp,
  setError,
} from '../store/learningSlice';
import { VocabularyItem, GrammarCorrection } from '../types/chat';
import { Achievement } from '../types/user';

export const useLearning = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  // Retrieve current Redux learning state (handles backwards-compatibility with state.progress)
  const learningState = useAppSelector((state) => state.learning);
  const { isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);

  // Queries
  const { data: todayXpData, isLoading: isLoadingXp } = useQuery<{ xp: number }>({
    queryKey: ['today-xp'],
    queryFn: learningApi.getTodayXp,
    enabled: isInitialized && isAuthenticated,
    retry: 1,
  });

  const { data: vocabData, isLoading: isLoadingVocab } = useQuery<VocabularyItem[]>({
    queryKey: ['vocabulary'],
    queryFn: learningApi.getVocabulary,
    enabled: isInitialized && isAuthenticated,
    retry: 1,
  });

  const { data: grammarData, isLoading: isLoadingGrammar } = useQuery<GrammarCorrection[]>({
    queryKey: ['grammar-mistakes'],
    queryFn: learningApi.getGrammarMistakes,
    enabled: isInitialized && isAuthenticated,
    retry: 1,
  });

  const { data: lessonsData, isLoading: isLoadingLessons } = useQuery<Lesson[]>({
    queryKey: ['lessons'],
    queryFn: learningApi.getLessons,
    enabled: isInitialized && isAuthenticated,
    retry: 1,
  });

  const { data: progressLogsData, isLoading: isLoadingProgress } = useQuery<ProgressLog[]>({
    queryKey: ['progress-logs'],
    queryFn: learningApi.getProgress,
    enabled: isInitialized && isAuthenticated,
    retry: 1,
  });

  const { data: achievementsData, isLoading: isLoadingAchievements } = useQuery<Achievement[]>({
    queryKey: ['achievements'],
    queryFn: learningApi.getAchievements,
    enabled: isInitialized && isAuthenticated,
    retry: 1,
  });

  // Keep Redux store in sync with TanStack query caching
  useEffect(() => {
    if (todayXpData !== undefined) {
      dispatch(setTodayXp(todayXpData.xp));
    }
  }, [todayXpData, dispatch]);

  useEffect(() => {
    if (vocabData !== undefined && grammarData !== undefined) {
      dispatch(
        setLearningStats({
          vocabularyLearned: vocabData.length,
          recentMistakes: grammarData as any[],
        })
      );
    }
  }, [vocabData, grammarData, dispatch]);

  useEffect(() => {
    if (lessonsData !== undefined) {
      dispatch(setLessons(lessonsData));
    }
  }, [lessonsData, dispatch]);

  useEffect(() => {
    if (progressLogsData !== undefined) {
      dispatch(setProgressLogs(progressLogsData));
    }
  }, [progressLogsData, dispatch]);

  useEffect(() => {
    if (achievementsData !== undefined) {
      dispatch(setAchievements(achievementsData));
    }
  }, [achievementsData, dispatch]);

  // Mutations
  const completeLessonMutation = useMutation<ProgressLog, any, { lessonId: string; xpEarned: number }>({
    mutationFn: ({ lessonId, xpEarned }) => learningApi.completeLesson(lessonId, xpEarned),
    onSuccess: (log) => {
      queryClient.invalidateQueries({ queryKey: ['progress-logs'] });
      queryClient.invalidateQueries({ queryKey: ['today-xp'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      dispatch(addXp(log.xpEarned));
    },
    onError: (err) => {
      dispatch(setError(err.message || 'Failed to submit lesson progress'));
    },
  });

  const addVocabMutation = useMutation<VocabularyItem, any, Partial<VocabularyItem>>({
    mutationFn: learningApi.createVocabulary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
    },
  });

  const updateVocabMutation = useMutation<VocabularyItem, any, { id: string; payload: Partial<VocabularyItem> }>({
    mutationFn: ({ id, payload }) => learningApi.updateVocabulary(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
    },
  });

  const deleteVocabMutation = useMutation<void, any, string>({
    mutationFn: learningApi.deleteVocabulary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
    },
  });

  return {
    ...learningState,
    vocabulary: vocabData || [],
    grammarMistakes: grammarData || [],
    isLoading:
      isLoadingXp ||
      isLoadingVocab ||
      isLoadingGrammar ||
      isLoadingLessons ||
      isLoadingProgress ||
      isLoadingAchievements ||
      completeLessonMutation.isPending ||
      addVocabMutation.isPending ||
      updateVocabMutation.isPending ||
      deleteVocabMutation.isPending,
    completeLesson: completeLessonMutation.mutateAsync,
    addVocabulary: addVocabMutation.mutateAsync,
    updateVocabulary: updateVocabMutation.mutateAsync,
    deleteVocabulary: deleteVocabMutation.mutateAsync,
  };
};
