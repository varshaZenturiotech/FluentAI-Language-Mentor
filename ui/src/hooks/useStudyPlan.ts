import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '../store';
import { studyPlanApi } from '../api/study-plan.api';

// Stale time of 60 seconds prevents duplicate requests when DashboardPage and
// StudyPlanPage both call useStudyPlan() in the same browsing session.
const STALE_TIME_MS = 60 * 1000;

export const useStudyPlan = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);

  // Guard: queries must not fire until the session has been restored.
  const isReady = isInitialized && isAuthenticated;

  const studyPlanQuery = useQuery({
    queryKey: ['studyPlan'],
    queryFn: studyPlanApi.getStudyPlan,
    enabled: isReady,
    staleTime: STALE_TIME_MS,
    retry: false,
  });

  const progressQuery = useQuery({
    queryKey: ['learningProgress'],
    queryFn: studyPlanApi.getProgress,
    enabled: isReady,
    staleTime: STALE_TIME_MS,
    retry: 1,
  });

  const recommendationsQuery = useQuery({
    queryKey: ['aiRecommendations'],
    queryFn: studyPlanApi.getRecommendations,
    enabled: isReady,
    staleTime: STALE_TIME_MS,
    // Do not retry on failure — the AI Gateway call is expensive and the
    // service-level fallback in the gateway already handles provider errors.
    retry: false,
  });

  const dashboardQuery = useQuery({
    queryKey: ['dashboardData'],
    queryFn: studyPlanApi.getDashboard,
    enabled: isReady,
    staleTime: STALE_TIME_MS,
    retry: 1,
  });

  const generatePlanMutation = useMutation({
    mutationFn: studyPlanApi.generateStudyPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyPlan'] });
      queryClient.invalidateQueries({ queryKey: ['learningProgress'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
  });

  const completeDayMutation = useMutation({
    mutationFn: (dayId: string) => studyPlanApi.completeDay(dayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyPlan'] });
      queryClient.invalidateQueries({ queryKey: ['learningProgress'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
  });

  const startLessonMutation = useMutation({
    mutationFn: (dayId: string) => studyPlanApi.startLesson(dayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyPlan'] });
      queryClient.invalidateQueries({ queryKey: ['learningProgress'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
  });

  return {
    studyPlan: studyPlanQuery.data,
    isLoadingPlan: studyPlanQuery.isLoading,
    planError: studyPlanQuery.error,
    refetchPlan: studyPlanQuery.refetch,

    progress: progressQuery.data,
    isLoadingProgress: progressQuery.isLoading,
    refetchProgress: progressQuery.refetch,

    recommendations: recommendationsQuery.data,
    isLoadingRecommendations: recommendationsQuery.isLoading,
    refetchRecommendations: recommendationsQuery.refetch,

    dashboardData: dashboardQuery.data,
    isLoadingDashboard: dashboardQuery.isLoading,
    refetchDashboard: dashboardQuery.refetch,

    generatePlan: generatePlanMutation.mutateAsync,
    isGeneratingPlan: generatePlanMutation.isPending,

    completeDay: completeDayMutation.mutateAsync,
    isCompletingDay: completeDayMutation.isPending,

    startLesson: startLessonMutation.mutateAsync,
    isStartingLesson: startLessonMutation.isPending,
  };
};
