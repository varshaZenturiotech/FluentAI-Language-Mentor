import React from 'react';

export const Loader: React.FC<{ size?: 'sm' | 'md' | 'lg'; text?: string }> = ({ size = 'md', text }) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-3">
      <div className="relative flex items-center justify-center">
        <div className={`${sizeMap[size]} rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin`} />
        <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-sm animate-pulse" />
      </div>
      {text && <p className="text-xs font-semibold text-slate-500 animate-pulse">{text}</p>}
    </div>
  );
};
