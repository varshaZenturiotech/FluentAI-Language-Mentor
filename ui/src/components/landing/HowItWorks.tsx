import React from 'react';
import { Languages, Mic, ShieldCheck, Repeat, Award } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Choose Language',
      desc: 'Select Malayalam as native language & English as learning goal.',
      icon: <Languages className="w-6 h-6 text-indigo-600" />,
      color: 'from-indigo-500 to-blue-500',
    },
    {
      num: '02',
      title: 'Start Speaking',
      desc: 'Tap the animated microphone and talk about your day or topics.',
      icon: <Mic className="w-6 h-6 text-blue-600" />,
      color: 'from-blue-500 to-sky-500',
    },
    {
      num: '03',
      title: 'AI Corrects',
      desc: 'Receive instant grammar, tense, & phonetic feedback.',
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      num: '04',
      title: 'Practice Daily',
      desc: 'Review vocabulary, complete micro-lessons & earn Speaking XP.',
      icon: <Repeat className="w-6 h-6 text-purple-600" />,
      color: 'from-purple-500 to-indigo-500',
    },
    {
      num: '05',
      title: 'Become Fluent',
      desc: 'Speak English naturally and confidently in any situation.',
      icon: <Award className="w-6 h-6 text-amber-600" />,
      color: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-transparent via-indigo-50/40 to-transparent" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-blue-100 text-blue-700 mb-3 border border-blue-200">
            5 Simple Steps
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            How <span className="gradient-text">FluentAI</span> Works
          </h2>
          <p className="mt-3 text-slate-600 font-medium text-base">
            A frictionless learning path engineered for rapid spoken English mastery.
          </p>
        </div>

        {/* Timeline Desktop & Mobile Responsive Grid */}
        <div className="relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-200 via-emerald-200 to-amber-200 -translate-y-1/2 z-0" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="glass-card glass-card-hover rounded-3xl p-6 flex flex-col items-center text-center relative border border-white/90 shadow-lg"
              >
                {/* Number Badge */}
                <span className={`w-8 h-8 rounded-full bg-gradient-to-r ${step.color} text-white font-black text-xs flex items-center justify-center mb-4 shadow-md`}>
                  {step.num}
                </span>

                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-4">
                  {step.icon}
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
