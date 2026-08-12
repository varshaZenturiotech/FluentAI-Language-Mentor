import React from 'react';
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { Card } from '../common/Card';

export const WhyFluentAI: React.FC = () => {
  const featuresComparison = [
    {
      metric: 'Time to conversational fluency',
      traditional: '2 - 3 Years',
      fluentAi: '3 - 6 Months',
    },
    {
      metric: 'Speaking practice frequency',
      traditional: 'Limited (1-2 hrs/week)',
      fluentAi: 'Unlimited 24/7 Voice AI',
    },
    {
      metric: 'Fear of making mistakes',
      traditional: 'High (Judgment by peers/tutor)',
      fluentAi: 'Zero (Private AI Mentor)',
    },
    {
      metric: 'Grammar & Accent Corrections',
      traditional: 'Delayed / Infrequent feedback',
      fluentAi: 'Instant real-time AI feedback',
    },
    {
      metric: 'Malayalam Native Explanations',
      traditional: 'Rarely available',
      fluentAi: 'Full Malayalam bridge support',
    },
    {
      metric: 'Monthly Cost',
      traditional: '₹5,000 - ₹15,000 / mo',
      fluentAi: 'Fraction of traditional fees',
    },
  ];

  return (
    <section className="py-20 relative" id="why-fluentai">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-3 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> The Modern Choice
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Traditional Learning vs <span className="gradient-text">FluentAI</span>
          </h2>
          <p className="mt-3 text-slate-600 font-medium text-base">
            See how conversational AI transforms your journey from passive grammar memorization to natural speaking confidence.
          </p>
        </div>

        {/* Comparison Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Traditional Learning Card */}
          <div className="lg:col-span-5 bg-white/70 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
            <div className="flex items-center gap-3 pb-6 border-b border-slate-200/60">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                ✕
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Traditional Classes</h3>
                <p className="text-xs text-slate-500 font-medium">Textbooks, group coaching & passive learning</p>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {featuresComparison.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm">
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-400 text-[11px] block uppercase">{item.metric}</span>
                    <span className="font-medium text-slate-700">{item.traditional}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FluentAI Card */}
          <Card
            variant="glass"
            glow
            className="lg:col-span-7 rounded-3xl p-6 sm:p-8 border-2 border-indigo-200/80 shadow-2xl relative overflow-hidden bg-gradient-to-br from-white/95 via-indigo-50/50 to-white/95"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                  AI
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    FluentAI Way
                    <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                      Recommended
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">24/7 AI Voice Mentor tailored for Malayalam speakers</p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {featuresComparison.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm bg-white/80 p-3.5 rounded-2xl border border-indigo-100/80 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="font-semibold text-slate-500 text-[11px] uppercase">{item.metric}:</span>
                    <span className="font-extrabold text-indigo-950 text-sm md:text-base">{item.fluentAi}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>

      </div>
    </section>
  );
};
