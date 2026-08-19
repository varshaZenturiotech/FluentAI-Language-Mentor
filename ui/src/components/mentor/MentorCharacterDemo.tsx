import React, { useState } from 'react';
import { MentorCharacter, MentorCharacterState } from './MentorCharacter';
import { Button } from '../common/Button';
import { Box, Eye, Mic, Brain, Volume2 } from 'lucide-react';

/**
 * Developer Testing & Playground component for the 3D Mentor Character.
 *
 * Allows manually toggling between 'idle', 'listening', 'thinking', and 'speaking' states
 * and enabling OrbitControls for 3D model inspection.
 */
export const MentorCharacterDemo: React.FC = () => {
  const [characterState, setCharacterState] = useState<MentorCharacterState>('idle');
  const [enableControls, setEnableControls] = useState<boolean>(false);

  const states: { id: MentorCharacterState; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'idle', label: 'Idle', icon: <Eye className="w-4 h-4" />, color: 'bg-indigo-600' },
    { id: 'listening', label: 'Listening', icon: <Mic className="w-4 h-4" />, color: 'bg-blue-600' },
    { id: 'thinking', label: 'Thinking', icon: <Brain className="w-4 h-4" />, color: 'bg-purple-600' },
    { id: 'speaking', label: 'Speaking', icon: <Volume2 className="w-4 h-4" />, color: 'bg-emerald-600' },
  ];

  return (
    <div className="glass-card p-6 rounded-3xl border border-white/90 shadow-xl max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">3D Mentor Character Playground</h2>
            <p className="text-xs text-slate-500 font-medium">Interactive test suite for R3F 3D mentor model</p>
          </div>
        </div>
        <button
          onClick={() => setEnableControls(!enableControls)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            enableControls
              ? 'bg-amber-50 text-amber-700 border-amber-300'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          {enableControls ? 'OrbitControls: ON' : 'OrbitControls: OFF'}
        </button>
      </div>

      {/* 3D Model Display Container */}
      <div className="bg-gradient-to-b from-slate-900/90 to-slate-950 rounded-2xl border border-slate-800 shadow-inner relative overflow-hidden h-80">
        <MentorCharacter
          state={characterState}
          enableControls={enableControls}
          className="w-full h-full"
        />
      </div>

      {/* State Switcher Buttons */}
      <div className="space-y-2">
        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
          Test Mentor State
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {states.map((st) => (
            <Button
              key={st.id}
              size="sm"
              variant={characterState === st.id ? 'primary' : 'outline'}
              onClick={() => setCharacterState(st.id)}
              leftIcon={st.icon}
              className={`rounded-xl text-xs font-bold justify-center ${
                characterState === st.id ? st.color : ''
              }`}
            >
              {st.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
