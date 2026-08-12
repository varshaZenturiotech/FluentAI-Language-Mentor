import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '../store';
import { authApi } from '../api/auth.api';
import { setUser, setToken, setLoading, setError, logoutUser } from '../store/authSlice';
import { LoginCredentials, RegisterPayload } from '../types/auth';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading, error, token } = useAppSelector((state) => state.auth);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      try {
        const result = await authApi.login(credentials);
        dispatch(setUser(result.user));
        dispatch(setToken(result.accessToken));
        return result;
      } catch (err: any) {
        let errMsg = err.message || 'Login failed';
        if (err.data?.errors && Array.isArray(err.data.errors)) {
          errMsg = `${errMsg}: ${err.data.errors.map((e: any) => e.message).join(', ')}`;
        }
        dispatch(setError(errMsg));
        throw err;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      try {
        const userResult = await authApi.register(payload);
        return userResult;
      } catch (err: any) {
        let errMsg = err.message || 'Registration failed';
        if (err.data?.errors && Array.isArray(err.data.errors)) {
          errMsg = `${errMsg}: ${err.data.errors.map((e: any) => e.message).join(', ')}`;
        }
        dispatch(setError(errMsg));
        throw err;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout request failed', err);
    } finally {
      queryClient.clear();
      dispatch({ type: 'RESET_APP' });
      dispatch(logoutUser());
      dispatch(setLoading(false));
      navigate('/login');
    }
  }, [dispatch, queryClient, navigate]);

  const fetchCurrentUser = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const currentUser = await authApi.getCurrentUser();
      dispatch(setUser(currentUser));
      return currentUser;
    } catch (err: any) {
      dispatch(logoutUser());
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    token,
    login,
    register,
    logout,
    fetchCurrentUser,
  };
};
