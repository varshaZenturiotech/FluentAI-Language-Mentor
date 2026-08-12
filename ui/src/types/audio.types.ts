export interface VoiceRecorderState {
  isRecording: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  mimeType: string | null;
  fileSize: number | null;
  error: string | null;
}
