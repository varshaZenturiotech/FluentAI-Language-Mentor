import React from 'react';
import { VoiceConnectionStatus, MicState } from '../../types/voice';
import { Activity, Radio, Cpu, Volume2, WifiOff } from 'lucide-react';

interface VoiceStatusPanelProps {
  status: VoiceConnectionStatus;
  micState: MicState;
}

export const VoiceStatusPanel: React.FC<VoiceStatusPanelProps> = ({ status, micState }) => {
  const getStatusConfig = () => {
    switch (micState) {
      case 'listening':
        return {
          label: 'Listening to your voice...',
          instruction: 'Speak naturally in English or Malayalam. Tap mic when done.',
          badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
          dotColor: 'bg-blue-500',
          icon: <Radio className="w-4 h-4 text-blue-600 animate-pulse" />,
        };
      case 'thinking':
        return {
          label: 'AI Mentor is processing response...',
          instruction: 'Analyzing grammar, vocabulary, and context...',
          badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
          dotColor: 'bg-indigo-500',
          icon: <Cpu className="w-4 h-4 text-indigo-600 animate-spin" />,
        };
      case 'speaking':
        return {
          label: 'AI Mentor is speaking...',
          instruction: 'Listen carefully to pronunciation and intonation.',
          badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          dotColor: 'bg-emerald-500',
          icon: <Volume2 className="w-4 h-4 text-emerald-600 animate-bounce" />,
        };
      case 'error':
        return {
          label: 'Voice connection error',
          instruction: 'Tap microphone to re-connect and try again.',
          badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
          dotColor: 'bg-rose-500',
          icon: <WifiOff className="w-4 h-4 text-rose-600" />,
        };
      case 'idle':
      default:
        return {
          label: 'AI Mentor Connected',
          instruction: 'Tap the microphone to start speaking with your AI Mentor.',
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
          dotColor: 'bg-emerald-500',
          icon: <Activity className="w-4 h-4 text-emerald-600" />,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex flex-col items-center justify-center space-y-2 my-2 text-center">
      <div
        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md transition-all duration-300 ${config.badgeColor}`}
      >
        <span className={`w-2 h-2 rounded-full ${config.dotColor} animate-pulse`} />
        {config.icon}
        <span>{status || config.label}</span>
      </div>
      <p className="text-xs md:text-sm text-slate-500 font-medium transition-all max-w-sm">
        {config.instruction}
      </p>
    </div>
  );
};
