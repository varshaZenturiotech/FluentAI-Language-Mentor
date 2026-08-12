import React from 'react';
import { Card } from '../common/Card';
import { useAppSelector } from '../../store';
import { TrendingUp, Award, Calendar } from 'lucide-react';

export const WeeklyProgressChart: React.FC = () => {
  const dailyProgress = useAppSelector((state) => state.progress.dailyProgress);
  const maxXP = Math.max(...dailyProgress.map((d) => d.xp), 200);

  return (
    <Card variant="glass" className="p-6 rounded-3xl border border-white/90 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-slate-900 text-lg">Weekly Activity</h3>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
              <TrendingUp className="w-3 h-3" /> +15% vs Last Week
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">XP earned per day from voice dialogues & lessons</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1.5 rounded-xl">
          <Calendar className="w-3.5 h-3.5" />
          <span>This Week</span>
        </div>
      </div>

      {/* Bar Graph Graphic */}
      <div className="pt-6 pb-2 px-2 flex items-end justify-between gap-3 h-48 border-b border-slate-100">
        {dailyProgress.map((item, index) => {
          const heightPercent = Math.round((item.xp / maxXP) * 100);
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2 group relative">
              {/* Tooltip on Hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-9 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg pointer-events-none z-10 whitespace-nowrap shadow-lg">
                {item.xp} XP ({item.speakingMinutes} mins)
              </div>

              {/* Bar */}
              <div className="w-full bg-slate-100/80 rounded-2xl h-36 flex items-end p-1 relative overflow-hidden">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full bg-gradient-to-t from-indigo-600 via-blue-500 to-sky-400 rounded-xl transition-all duration-700 group-hover:from-indigo-700 group-hover:to-sky-300 shadow-md"
                />
              </div>

              {/* Label Day */}
              <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">
                {item.day}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend Footer */}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500 font-semibold">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-indigo-600 inline-block" />
            <span>XP Points</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-sky-400 inline-block" />
            <span>Voice Minutes</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-indigo-600 font-bold">
          <Award className="w-4 h-4" />
          <span>Weekly Target Met!</span>
        </div>
      </div>
    </Card>
  );
};
