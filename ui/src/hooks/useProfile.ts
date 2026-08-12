import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { profileApi } from '../api/profile.api';
import { setProfile, updateProfile, setLoading, setError } from '../store/profileSlice';
import { UserProfile } from '../types/user';

export const useProfile = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  // Retrieve current Redux profile state (handles backwards-compatibility with state.user)
  const profileState = useAppSelector((state) => state.profile);

  // TanStack Query for profile caching
  const {
    data: profileData,
    isLoading: isQueryLoading,
    error: queryError,
    refetch,
  } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    enabled: !!localStorage.getItem('accessToken'),
    retry: 1,
  });

  // Sync Redux store when fresh server state is retrieved
  useEffect(() => {
    if (profileData) {
      dispatch(setProfile(profileData));
    }
  }, [profileData, dispatch]);

  // Sync validation errors into Redux
  useEffect(() => {
    if (queryError) {
      dispatch(setError((queryError as any).message || 'Failed to load profile'));
    }
  }, [queryError, dispatch]);

  // Mutation for updating profile details
  const updateProfileMutation = useMutation<UserProfile, any, Partial<UserProfile>>({
    mutationFn: profileApi.updateProfile,
    onMutate: () => {
      dispatch(setLoading(true));
    },
    onSuccess: (updatedData) => {
      // Invalidate TanStack query cache
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      // Instantly dispatch to Redux store
      dispatch(updateProfile(updatedData));
    },
    onError: (err) => {
      dispatch(setError(err.message || 'Failed to update profile'));
    },
  });

  // Mutation for permanent account deletion
  const deleteAccountMutation = useMutation<void, any, void>({
    mutationFn: profileApi.deleteAccount,
    onSuccess: () => {
      queryClient.clear();
      localStorage.removeItem('accessToken');
      window.dispatchEvent(new Event('auth-logout'));
    },
  });

  return {
    profile: profileState,
    isLoading: isQueryLoading || updateProfileMutation.isPending || deleteAccountMutation.isPending,
    error: profileState.error,
    refetchProfile: refetch,
    updateProfile: updateProfileMutation.mutateAsync,
    deleteAccount: deleteAccountMutation.mutateAsync,
  };
};
