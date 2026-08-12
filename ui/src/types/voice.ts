export type MicState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';
export type VoiceConnectionStatus = 'Connected' | 'Listening...' | 'Processing...' | 'Speaking...' | 'Disconnected';

export interface VoiceState {
  micState: MicState;
  connectionStatus: VoiceConnectionStatus;
  isMuted: boolean;
  audioLevel: number; // 0 to 100 for visual wave dynamics
  speechErrorMessage: string | null;
}
