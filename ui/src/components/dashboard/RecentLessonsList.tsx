import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Briefcase, Coffee, MessageSquare, Mic, Play, CheckCircle2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RecentLessonsList: React.FC = () => {
  const lessons = [
    {
      id: 'l1',
      title: 'Job Interview Confidence',
      category: 'Business English',
      duration: '15 mins',
      xp: '+100 XP',
      icon: <Briefcase className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50 border-indigo-100',
      completed: true,
    },
    {
      id: 'l2',
      title: 'Casual Coffee Shop Small Talk',
      category: 'Socializing',
      duration: '10 mins',
      xp: '+80 XP',
      icon: <Coffee className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50 border-amber-100',
      completed: false,
    },
    {
      id: 'l3',
      title: 'Expressing Polite Disagreement',
      category: 'Advanced Communication',
      duration: '12 mins',
      xp: '+120 XP',
      icon: <MessageSquare className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50 border-blue-100',
      completed: false,
    },
    {
      id: 'l4',
      title: 'Malayalam Accent & Silent Vowels',
      category: 'Pronunciation',
      duration: '8 mins',
      xp: '+90 XP',
      icon: <Mic className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-100',
      completed: false,
    },
  ];

  return (
    <Card variant="glass" className="p-6 rounded-3xl border border-white/90 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg">Recommended AI Lessons</h3>
          <p className="text-xs text-slate-500 font-medium">Bilingual micro-lessons tailored for your skill level</p>
        </div>
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100">
          4 Available
        </span>
      </div>

      <div className="space-y-3">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="flex items-center justify-between p-4 rounded-2xl bg-white/80 border border-slate-200/60 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className={`p-3 rounded-2xl ${lesson.bg} border shadow-sm`}>{lesson.icon}</div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{lesson.title}</h4>
                  {lesson.completed && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-0.5">
                  <span>{lesson.category}</span>
                  <span>•</span>
                  <span>{lesson.duration}</span>
                  <span>•</span>
                  <span className="text-indigo-600 font-bold flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3 text-amber-500" /> {lesson.xp}
                  </span>
                </div>
              </div>
            </div>

            <Link to="/conversation">
              <Button
                size="sm"
                variant={lesson.completed ? 'outline' : 'primary'}
                leftIcon={!lesson.completed ? <Play className="w-3.5 h-3.5 fill-current" /> : undefined}
              >
                {lesson.completed ? 'Review' : 'Start'}
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </Card>
  );
};
