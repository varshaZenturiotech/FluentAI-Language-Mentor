import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studyPlanApi } from '../api/study-plan.api';

export const useStudyPlan = () => {
  const queryClient = useQueryClient();

  const studyPlanQuery = useQuery({
    queryKey: ['studyPlan'],
    queryFn: studyPlanApi.getStudyPlan,
    retry: false,
  });

  const progressQuery = useQuery({
    queryKey: ['learningProgress'],
    queryFn: studyPlanApi.getProgress,
  });

  const recommendationsQuery = useQuery({
    queryKey: ['aiRecommendations'],
    queryFn: studyPlanApi.getRecommendations,
  });

  const dashboardQuery = useQuery({
    queryKey: ['dashboardData'],
    queryFn: studyPlanApi.getDashboard,
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
