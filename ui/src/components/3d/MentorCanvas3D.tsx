import React from 'react';
import { MentorCharacter, MentorCharacterState } from '../mentor/MentorCharacter';

export const MentorCanvas3D: React.FC<{ micState?: string; className?: string }> = ({
  micState = 'idle',
  className = 'w-full h-48',
}) => {
  const validState: MentorCharacterState = ['idle', 'listening', 'thinking', 'speaking'].includes(micState)
    ? (micState as MentorCharacterState)
    : 'idle';

  return (
    <MentorCharacter
      state={validState}
      className={`rounded-3xl border border-indigo-100/60 shadow-sm ${className}`}
    />
  );
};
