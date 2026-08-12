import React from 'react';
import { Flame, Clock, Award, ShieldCheck, Zap } from 'lucide-react';
import { Card } from '../common/Card';

export const ProgressPreview: React.FC = () => {
  return (
    <section className="py-20 relative overflow-hidden" id="progress-preview">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-700 mb-3 border border-indigo-200">
            Real-Time Analytics
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Visualize Your Journey to <span className="gradient-text">Fluency</span>
          </h2>
          <p className="mt-3 text-slate-600 font-medium text-base">
            Gamified stats and interactive milestones keep you motivated every single day.
          </p>
        </div>

        {/* Dashboard Preview Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          
          {/* Card 1: XP */}
          <Card variant="glass" hoverEffect className="p-6 rounded-3xl border-indigo-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-extrabold uppercase text-slate-400">Total XP</span>
              <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-500">
                <Zap className="w-5 h-5 fill-amber-500" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900">2,450 XP</h3>
              <p className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                <span>+450 XP</span> this week
              </p>
            </div>
          </Card>

          {/* Card 2: Streak */}
          <Card variant="glass" hoverEffect className="p-6 rounded-3xl border-indigo-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-extrabold uppercase text-slate-400">Current Streak</span>
              <div className="p-2.5 bg-orange-50 rounded-2xl text-orange-500">
                <Flame className="w-5 h-5 fill-orange-500" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900">12 Days</h3>
              <p className="text-xs font-semibold text-slate-500 mt-1">Best: 18 days streak</p>
            </div>
          </Card>

          {/* Card 3: Vocabulary */}
          <Card variant="glass" hoverEffect className="p-6 rounded-3xl border-indigo-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-extrabold uppercase text-slate-400">Vocabulary</span>
              <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900">184 Words</h3>
              <p className="text-xs font-semibold text-indigo-600 mt-1">Mastered with Malayalam context</p>
            </div>
          </Card>

          {/* Card 4: Grammar Score */}
          <Card variant="glass" hoverEffect className="p-6 rounded-3xl border-indigo-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-extrabold uppercase text-slate-400">Grammar Score</span>
              <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900">92%</h3>
              <p className="text-xs font-semibold text-emerald-600 mt-1">High Accuracy Level</p>
            </div>
          </Card>

          {/* Card 5: Speaking Time */}
          <Card variant="glass" hoverEffect className="p-6 rounded-3xl border-indigo-100 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-extrabold uppercase text-slate-400">Speaking Time</span>
              <div className="p-2.5 bg-blue-50 rounded-2xl text-blue-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900">145 Mins</h3>
              <p className="text-xs font-semibold text-blue-600 mt-1">Spoken AI dialogue</p>
            </div>
          </Card>

        </div>

      </div>
    </section>
  );
};
