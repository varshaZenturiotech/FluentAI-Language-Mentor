import React from 'react';
import { useAppSelector } from '../../store';
import { Flame, Sparkles, Target, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';
import { Link } from 'react-router-dom';

export const GreetingBanner: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const totalXp = useAppSelector((state) => state.user.totalXp);
  const currentStreak = useAppSelector((state) => state.user.currentStreakDays);

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="gradient-bg rounded-[32px] p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden mb-8">
      {/* Background Soft Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side Greeting */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white border border-white/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Malayalam ➔ English Journey Active</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            {getGreetingTime()}, {user?.name || 'Rahul'}! 👋
          </h1>
          <p className="text-indigo-100 text-sm sm:text-base max-w-xl">
            You're doing great! Keep your daily streak going by starting a short 5-minute voice conversation with your AI mentor today.
          </p>
        </div>

        {/* Right Side Stats & Action */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center gap-3">
            <div className="p-2.5 bg-amber-400/20 rounded-xl text-amber-300">
              <Flame className="w-6 h-6 fill-amber-300" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-indigo-200 font-bold">Streak</span>
              <p className="text-xl font-black">{currentStreak} Days</p>
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-400/20 rounded-xl text-emerald-300">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-indigo-200 font-bold">Today's Goal</span>
              <p className="text-xl font-black">{totalXp} XP</p>
            </div>
          </div>

          <Link to="/conversation">
            <Button size="lg" variant="glass" className="font-extrabold text-indigo-900 shadow-md" rightIcon={<ArrowRight className="w-5 h-5 text-indigo-600" />}>
              Start Conversation
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
