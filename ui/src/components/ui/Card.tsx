import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'white' | 'gradient' | 'bordered';
  hoverEffect?: boolean;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'glass',
  hoverEffect = false,
  glow = false,
  children,
  ...props
}) => {
  const baseStyles = 'rounded-3xl p-6 transition-all duration-300 relative';

  const variants = {
    glass: 'glass-card',
    white: 'bg-white border border-slate-100 shadow-xl shadow-indigo-950/5',
    gradient: 'bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 text-white shadow-xl shadow-indigo-500/20',
    bordered: 'bg-white/90 border-2 border-indigo-100 shadow-sm',
  };

  return (
    <div
      className={cn(
        baseStyles,
        variants[variant],
        hoverEffect && 'glass-card-hover cursor-pointer',
        glow && 'shadow-indigo-500/20 shadow-2xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
