import React, { useState, useRef, useEffect } from 'react';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { AudioPlayer } from '../../audio/player';
import { Mic, Square, X, Play, RotateCcw, AlertCircle, Volume2 } from 'lucide-react';

interface VoiceRecorderProps {
  onAudioReady?: (blob: Blob) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onAudioReady }) => {
  const {
    isRecording,
    duration,
    audioBlob,
    fileSize,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    resetRecording,
  } = useVoiceRecorder();

  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<AudioPlayer | null>(null);

  // Initialize AudioPlayer on mount
  useEffect(() => {
    playerRef.current = new AudioPlayer();
    return () => {
      playerRef.current?.stop();
    };
  }, []);

  // Whenever a new blob is recorded, notify parent if callback exists
  useEffect(() => {
    if (audioBlob && onAudioReady) {
      onAudioReady(audioBlob);
    }
  }, [audioBlob, onAudioReady]);

  const handlePlayPause = () => {
    if (!audioBlob || !playerRef.current) return;

    if (isPlaying) {
      playerRef.current.stop();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playerRef.current.play(audioBlob, () => {
        setIsPlaying(false);
      });
    }
  };

  // Format elapsed time (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to format file size in KB or MB
  const formatSize = (bytes: number | null): string => {
    if (bytes === null) return '';
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl max-w-sm w-full mx-auto shadow-2xl transition-all duration-300">
      {/* Title / Status */}
      <h3 className="text-slate-200 text-sm font-semibold mb-6 tracking-wide uppercase">
        {isRecording ? 'Recording Voice' : audioBlob ? 'Voice Preview' : 'Voice Recorder'}
      </h3>

      {/* Recording Display */}
      <div className="relative flex items-center justify-center w-32 h-32 mb-6">
        {isRecording && (
          <>
            {/* Pulsing ring animations */}
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-red-500/10 animate-pulse" />
          </>
        )}

        <button
          onClick={isRecording ? () => stopRecording() : startRecording}
          disabled={!!audioBlob}
          className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer ${
            isRecording
              ? 'bg-red-500 text-white shadow-red-500/30 border border-red-400 hover:bg-red-600'
              : audioBlob
              ? 'bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white shadow-indigo-600/30 border border-indigo-500 hover:bg-indigo-700 hover:scale-105 active:scale-95'
          }`}
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          {isRecording ? (
            <Square className="w-10 h-10 fill-current" />
          ) : (
            <Mic className="w-10 h-10" />
          )}
        </button>
      </div>

      {/* Timer / File Specs */}
      <div className="text-center mb-6">
        {isRecording ? (
          <div className="flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 font-mono text-2xl font-bold tracking-wider">
              {formatTime(duration)}
            </span>
          </div>
        ) : audioBlob ? (
          <div className="text-slate-300 font-medium space-y-1">
            <div className="text-lg font-mono">{formatTime(duration)}</div>
            <div className="text-xs text-slate-500">
              {formatSize(fileSize)} | {audioBlob.type.split(';')[0]}
            </div>
          </div>
        ) : (
          <span className="text-slate-500 text-sm">Tap microphone to record</span>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-4 w-full justify-center">
        {/* Cancel Button */}
        {isRecording && (
          <button
            onClick={cancelRecording}
            className="flex items-center justify-center w-12 h-12 rounded-full border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors shadow-md cursor-pointer"
            title="Cancel Recording"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Playback Control */}
        {audioBlob && (
          <>
            <button
              onClick={resetRecording}
              className="flex items-center justify-center w-12 h-12 rounded-full border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors shadow-md cursor-pointer"
              title="Reset Recorder"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={handlePlayPause}
              className={`flex items-center justify-center w-16 h-16 rounded-full border shadow-lg transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700'
                  : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700 hover:scale-105'
              }`}
              title={isPlaying ? 'Pause' : 'Play Preview'}
            >
              {isPlaying ? (
                <Volume2 className="w-6 h-6 animate-pulse" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5" />
              )}
            </button>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 flex items-start gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs w-full">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-normal">{error}</span>
        </div>
      )}
    </div>
  );
};
