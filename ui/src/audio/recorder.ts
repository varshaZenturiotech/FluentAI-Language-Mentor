export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];

  // Supported mime types to check in order of preference
  private static readonly PREFERRED_MIME_TYPES = [
    'audio/webm',
    'audio/mp4',
    'audio/ogg',
  ];

  static getSupportedMimeType(): string {
    for (const mimeType of this.PREFERRED_MIME_TYPES) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }
    return '';
  }

  async start(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Browser unsupported: getUserMedia is not supported in this browser.');
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Permission denied: Access to microphone was denied.');
      }
      throw new Error(`Microphone unavailable: ${err.message || 'Failed to acquire audio stream.'}`);
    }

    const mimeType = AudioRecorder.getSupportedMimeType();
    if (!mimeType) {
      this.stopStream();
      throw new Error('Browser unsupported: No supported audio recording MIME type found.');
    }

    try {
      this.chunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.start(10); // Capture data in small slices
    } catch (err: any) {
      this.stopStream();
      throw new Error(`Recording failed: Failed to start MediaRecorder. ${err.message || ''}`);
    }
  }

  stop(): Promise<{ blob: Blob; mimeType: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('Recording failed: Recorder is not active.'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        try {
          const mimeType = this.mediaRecorder?.mimeType || AudioRecorder.getSupportedMimeType();
          const blob = new Blob(this.chunks, { type: mimeType });
          
          if (blob.size === 0) {
            reject(new Error('Empty recording: No audio data was captured.'));
            return;
          }

          resolve({ blob, mimeType });
        } catch (err: any) {
          reject(new Error(`Recording failed: ${err.message || 'Failed to build audio Blob.'}`));
        } finally {
          this.cleanup();
        }
      };

      this.mediaRecorder.stop();
    });
  }

  cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  private stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
      this.stream = null;
    }
  }

  private cleanup(): void {
    this.stopStream();
    this.mediaRecorder = null;
    this.chunks = [];
  }
}
