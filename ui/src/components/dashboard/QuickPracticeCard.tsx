import React from 'react';
import { Card } from '../common/Card';
import { Mic, BookOpen, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const QuickPracticeCard: React.FC = () => {
  const quickActions = [
    {
      title: 'Start Conversation',
      subtitle: 'Talk directly with AI Mentor',
      icon: <Mic className="w-6 h-6 text-indigo-600" />,
      bg: 'bg-indigo-50 border-indigo-100',
      link: '/conversation',
      badge: 'Interactive Voice',
    },
    {
      title: 'Practice Vocabulary',
      subtitle: 'Master 10 new words with Malayalam context',
      icon: <BookOpen className="w-6 h-6 text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-100',
      link: '/progress',
      badge: '184 Words',
    },
    {
      title: 'Grammar Review',
      subtitle: 'Fix past tenses & prepositions',
      icon: <ShieldCheck className="w-6 h-6 text-amber-600" />,
      bg: 'bg-amber-50 border-amber-100',
      link: '/progress',
      badge: '92% Accuracy',
    },
    {
      title: 'Speaking Time Challenge',
      subtitle: 'Log 15 minutes of uninterrupted speech',
      icon: <Clock className="w-6 h-6 text-blue-600" />,
      bg: 'bg-blue-50 border-blue-100',
      link: '/conversation',
      badge: '145 Mins Total',
    },
  ];

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-900">Quick Practice</h2>
        <span className="text-xs font-semibold text-indigo-600">Select Mode</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, idx) => (
          <Link key={idx} to={action.link}>
            <Card variant="glass" hoverEffect className="p-5 rounded-3xl h-full flex flex-col justify-between border border-white/90">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 rounded-2xl ${action.bg} border shadow-sm`}>{action.icon}</div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {action.badge}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">{action.title}</h3>
                <p className="text-xs text-slate-500 mt-1 font-normal leading-relaxed">{action.subtitle}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                <span>Start Session</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
