import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TranslateResponse, FeedbackResponse, PronunciationResponse, SpeechResponse } from '../api/ai.api';

export interface AiState {
  translation: TranslateResponse | null;
  feedback: FeedbackResponse | null;
  pronunciation: PronunciationResponse | null;
  speech: SpeechResponse | null;
  loadingStates: {
    chat: boolean;
    translate: boolean;
    feedback: boolean;
    pronunciation: boolean;
    speech: boolean;
  };
  error: string | null;
}

const initialState: AiState = {
  translation: null,
  feedback: null,
  pronunciation: null,
  speech: null,
  loadingStates: {
    chat: false,
    translate: false,
    feedback: false,
    pronunciation: false,
    speech: false,
  },
  error: null,
};

export const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setTranslation: (state, action: PayloadAction<TranslateResponse | null>) => {
      state.translation = action.payload;
    },
    setFeedback: (state, action: PayloadAction<FeedbackResponse | null>) => {
      state.feedback = action.payload;
    },
    setPronunciation: (state, action: PayloadAction<PronunciationResponse | null>) => {
      state.pronunciation = action.payload;
    },
    setSpeech: (state, action: PayloadAction<SpeechResponse | null>) => {
      state.speech = action.payload;
    },
    setAiLoading: (
      state,
      action: PayloadAction<{ key: keyof AiState['loadingStates']; value: boolean }>
    ) => {
      state.loadingStates[action.payload.key] = action.payload.value;
    },
    setAiError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearAiState: () => {
      return initialState;
    },
  },
});

export const {
  setTranslation,
  setFeedback,
  setPronunciation,
  setSpeech,
  setAiLoading,
  setAiError,
  clearAiState,
} = aiSlice.actions;

export default aiSlice.reducer;
