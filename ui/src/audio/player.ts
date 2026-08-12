export class AudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private currentUrl: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
    }
  }

  play(blob: Blob, onEnded?: () => void): void {
    if (!this.audio) return;

    this.stop();

    this.currentUrl = URL.createObjectURL(blob);
    this.audio.src = this.currentUrl;

    this.audio.onended = () => {
      if (onEnded) {
        onEnded();
      }
      this.cleanupUrl();
    };

    this.audio.play().catch((err) => {
      console.error('AudioPlayer play error:', err);
    });
  }

  pause(): void {
    if (this.audio) {
      this.audio.pause();
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.cleanupUrl();
    }
  }

  private cleanupUrl(): void {
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = null;
    }
  }
}
