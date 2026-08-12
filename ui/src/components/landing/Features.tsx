import React from 'react';
import { Card } from '../common/Card';
import {
  Mic,
  ShieldCheck,
  BookOpen,
  Volume2,
  Globe2,
  Sparkles,
  TrendingUp,
  BrainCircuit,
} from 'lucide-react';

export const Features: React.FC = () => {
  const featureList = [
    {
      icon: <Mic className="w-6 h-6 text-indigo-600" />,
      title: 'Voice Conversation',
      description: 'Engage in natural, real-time spoken dialogue with your AI mentor anytime without fear of judgment.',
      bg: 'bg-indigo-50',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
      title: 'Real-time Grammar Correction',
      description: 'Receive instant, friendly corrections on tense, prepositions, and articles as you speak.',
      bg: 'bg-blue-50',
    },
    {
      icon: <BookOpen className="w-6 h-6 text-emerald-600" />,
      title: 'Vocabulary Builder',
      description: 'Learn context-aware English words paired with clear Malayalam translations and usage examples.',
      bg: 'bg-emerald-50',
    },
    {
      icon: <Volume2 className="w-6 h-6 text-sky-600" />,
      title: 'Pronunciation Coach',
      description: 'Fine-tune phonetic accuracy with audio feedback tailored for South Asian / Malayalam native speakers.',
      bg: 'bg-sky-50',
    },
    {
      icon: <Globe2 className="w-6 h-6 text-purple-600" />,
      title: 'Native Language Teaching',
      description: 'Bilingual explanations in Malayalam bridge complex English concepts effortlessly.',
      bg: 'bg-purple-50',
    },
    {
      icon: <BrainCircuit className="w-6 h-6 text-indigo-600" />,
      title: 'AI Mentor',
      description: 'An empathetic, patient AI companion that adapts to your career, hobbies, and speaking confidence.',
      bg: 'bg-indigo-50',
    },
    {
      icon: <Sparkles className="w-6 h-6 text-amber-600" />,
      title: 'Personalized Learning',
      description: 'Custom conversation scenarios based on job interviews, daily routines, travel, and business emails.',
      bg: 'bg-amber-50',
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-rose-600" />,
      title: 'Daily Progress',
      description: 'Track your Speaking XP, daily streaks, grammar accuracy scores, and fluency mastery charts.',
      bg: 'bg-rose-50',
    },
  ];

  return (
    <section className="py-20 relative overflow-hidden" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-700 mb-3 border border-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Powered by Conversational AI
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Everything You Need to Become <span className="gradient-text">Truly Fluent</span>
          </h2>
          <p className="mt-4 text-base md:text-lg text-slate-600 font-medium">
            Designed from the ground up for Malayalam speakers aiming to speak English confidently at work, abroad, and in daily life.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureList.map((feat, index) => (
            <Card key={index} variant="glass" hoverEffect className="flex flex-col justify-between p-6 rounded-3xl">
              <div>
                <div className={`w-12 h-12 rounded-2xl ${feat.bg} flex items-center justify-center mb-5 shadow-sm`}>
                  {feat.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">{feat.description}</p>
              </div>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
};
