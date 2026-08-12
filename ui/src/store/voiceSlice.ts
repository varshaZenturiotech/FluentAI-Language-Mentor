import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VoiceState, MicState, VoiceConnectionStatus } from '../types/voice';

const initialState: VoiceState = {
  micState: 'idle',
  connectionStatus: 'Connected',
  isMuted: false,
  audioLevel: 15,
  speechErrorMessage: null,
};

export const voiceSlice = createSlice({
  name: 'voice',
  initialState,
  reducers: {
    setMicState: (state, action: PayloadAction<MicState>) => {
      state.micState = action.payload;
      switch (action.payload) {
        case 'listening':
          state.connectionStatus = 'Listening...';
          break;
        case 'thinking':
          state.connectionStatus = 'Processing...';
          break;
        case 'speaking':
          state.connectionStatus = 'Speaking...';
          break;
        case 'error':
          state.connectionStatus = 'Disconnected';
          break;
        case 'idle':
        default:
          state.connectionStatus = 'Connected';
          break;
      }
    },
    setConnectionStatus: (state, action: PayloadAction<VoiceConnectionStatus>) => {
      state.connectionStatus = action.payload;
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
    setAudioLevel: (state, action: PayloadAction<number>) => {
      state.audioLevel = action.payload;
    },
    setVoiceError: (state, action: PayloadAction<string | null>) => {
      state.speechErrorMessage = action.payload;
      if (action.payload) {
        state.micState = 'error';
        state.connectionStatus = 'Disconnected';
      }
    },
  },
});

export const {
  setMicState,
  setConnectionStatus,
  toggleMute,
  setAudioLevel,
  setVoiceError,
} = voiceSlice.actions;

export default voiceSlice.reducer;
