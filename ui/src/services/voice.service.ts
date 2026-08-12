import { MicState, VoiceConnectionStatus } from '../types/voice';
import { delay } from './apiClient';

export const voiceService = {
  async connectVoiceSession(): Promise<{ connected: boolean; status: VoiceConnectionStatus }> {
    await delay(600);
    return { connected: true, status: 'Connected' };
  },

  async startListening(): Promise<MicState> {
    await delay(300);
    return 'listening';
  },

  async processAudioInput(audioBlob?: Blob): Promise<{ recognizedText: string; micState: MicState }> {
    console.log('Processing audio input...', audioBlob);
    await delay(1000);
    return {
      recognizedText: 'I would like to improve my pronunciation for international business meetings.',
      micState: 'thinking',
    };
  },

  async synthesizeSpeech(text: string): Promise<{ audioUrl: string }> {
    console.log('Synthesizing speech for:', text);
    await delay(500);
    return {
      audioUrl: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg', // mock audio resource
    };
  },
};
