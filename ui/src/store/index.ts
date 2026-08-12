import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './authSlice';
import conversationReducer from './conversationSlice';
import profileReducer from './profileSlice';
import learningReducer from './learningSlice';
import aiReducer from './aiSlice';
import settingsReducer from './settingsSlice';
import voiceReducer from './voiceSlice';

const appReducer = combineReducers({
  auth: authReducer,
  conversation: conversationReducer,
  profile: profileReducer,
  user: profileReducer, // Alias for backward compatibility
  learning: learningReducer,
  progress: learningReducer, // Alias for backward compatibility
  ai: aiReducer,
  settings: settingsReducer,
  voice: voiceReducer,
});

const rootReducer = (state: any, action: any) => {
  if (action.type === 'RESET_APP') {
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
