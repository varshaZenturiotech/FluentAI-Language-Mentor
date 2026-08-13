import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '../types/auth';

export interface ExtendedAuthState extends AuthState {
  token: string | null;
  isInitialized: boolean;
}

const initialState: ExtendedAuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: !localStorage.getItem('accessToken'),
  error: null,
  token: localStorage.getItem('accessToken') || null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isInitialized = true;
      state.error = null;
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    logoutUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.token = null;
      state.isInitialized = true;
      state.error = null;
    },
  },
});

export const { setUser, setToken, setLoading, setError, setInitialized, logoutUser } = authSlice.actions;
export default authSlice.reducer;
