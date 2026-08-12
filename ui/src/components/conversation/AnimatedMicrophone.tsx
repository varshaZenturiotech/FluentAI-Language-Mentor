import React from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Loader2, Sparkles, Volume2, AlertCircle } from 'lucide-react';
import { MicState } from '../../types/voice';

interface AnimatedMicrophoneProps {
  micState: MicState;
  onClick: () => void;
  audioLevel?: number;
}

export const AnimatedMicrophone: React.FC<AnimatedMicrophoneProps> = ({
  micState,
  onClick,
  audioLevel = 25,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center py-6 select-none">
      {/* Outer Soft Glowing Circles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Ring 1 - Ambient glow */}
        <motion.div
          animate={{
            scale: micState === 'listening' ? [1, 1.35, 1] : micState === 'speaking' ? [1, 1.25, 1] : 1,
            opacity: micState === 'idle' ? 0.3 : 0.6,
          }}
          transition={{
            duration: micState === 'listening' ? 1.8 : 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`w-56 h-56 rounded-full blur-2xl transition-colors duration-500 ${
            micState === 'listening'
              ? 'bg-blue-400/40'
              : micState === 'speaking'
              ? 'bg-emerald-400/40'
              : micState === 'thinking'
              ? 'bg-indigo-400/40'
              : micState === 'error'
              ? 'bg-rose-400/30'
              : 'bg-indigo-300/20'
          }`}
        />

        {/* Ring 2 - Audio wave reactivity */}
        {micState === 'listening' && (
          <motion.div
            animate={{
              scale: 1 + audioLevel / 120,
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{ duration: 0.2 }}
            className="w-48 h-48 rounded-full border-2 border-blue-400/50 bg-blue-500/10 backdrop-blur-sm"
          />
        )}

        {/* Thinking rotating ring */}
        {micState === 'thinking' && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="w-44 h-44 rounded-full border-4 border-transparent border-t-indigo-600 border-r-sky-400"
          />
        )}

        {/* Speaking Pulsing Ring */}
        {micState === 'speaking' && (
          <motion.div
            animate={{ scale: [1, 1.18, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="w-44 h-44 rounded-full border-2 border-emerald-400/60 bg-emerald-500/10"
          />
        )}
      </div>

      {/* Main Microphone Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        onClick={onClick}
        className={`relative z-10 w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 cursor-pointer ${
          micState === 'listening'
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/40 ring-4 ring-blue-300 ring-offset-4 ring-offset-[#F8FBFF]'
            : micState === 'speaking'
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/40 ring-4 ring-emerald-300 ring-offset-4 ring-offset-[#F8FBFF]'
            : micState === 'thinking'
            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-indigo-500/40'
            : micState === 'error'
            ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/40 border-4 border-rose-300'
            : 'bg-white border-4 border-indigo-100 text-indigo-600 shadow-indigo-500/15 hover:border-indigo-300 hover:shadow-indigo-500/25'
        }`}
        id="animated-microphone-button"
      >
        {micState === 'idle' && <Mic className="w-12 h-12 stroke-[2]" />}
        {micState === 'listening' && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="flex items-center justify-center"
          >
            <Mic className="w-12 h-12 stroke-[2.2]" />
          </motion.div>
        )}
        {micState === 'thinking' && <Loader2 className="w-12 h-12 animate-spin stroke-[2.2]" />}
        {micState === 'speaking' && <Volume2 className="w-12 h-12 animate-bounce stroke-[2.2]" />}
        {micState === 'error' && <MicOff className="w-12 h-12 stroke-[2]" />}

        {/* Corner Badge Icon */}
        <div className="absolute -top-1 -right-1 bg-white p-1.5 rounded-full shadow-md text-indigo-600 border border-indigo-100">
          {micState === 'listening' ? (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          ) : micState === 'speaking' ? (
            <Sparkles className="w-4 h-4 text-emerald-500 animate-spin-slow" />
          ) : micState === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          ) : (
            <Sparkles className="w-4 h-4 text-indigo-500" />
          )}
        </div>
      </motion.button>

      {/* Dynamic Voice Soundwave Equalizer Bars */}
      {(micState === 'listening' || micState === 'speaking') && (
        <div className="relative z-10 flex items-center gap-1.5 mt-5 h-8">
          {[40, 75, 50, 90, 60, 100, 45, 80, 55, 95, 30].map((height, idx) => (
            <motion.div
              key={idx}
              animate={{
                height: [
                  `${Math.max(10, height * 0.3)}px`,
                  `${Math.min(36, height * 0.4 + (audioLevel * 0.3))}px`,
                  `${Math.max(8, height * 0.2)}px`,
                ],
              }}
              transition={{
                duration: 0.4 + (idx % 3) * 0.1,
                repeat: Infinity,
                repeatType: 'mirror',
              }}
              className={`w-1.5 rounded-full ${
                micState === 'listening' ? 'bg-blue-500' : 'bg-emerald-500'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
