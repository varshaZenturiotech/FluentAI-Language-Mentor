import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles, Mic, Volume2, Flame, Award, ShieldCheck } from 'lucide-react';
import { Button } from '../common/Button';
import { Link } from 'react-router-dom';

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32">
      {/* Background Soft Cloud Elements & Blur Gradients */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[90vw] max-w-7xl h-[500px] bg-gradient-to-r from-blue-200/40 via-indigo-200/30 to-sky-200/50 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      {/* Floating Cloud Graphic Elements */}
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-20 left-6 w-32 h-16 bg-white/40 backdrop-blur-xl rounded-full border border-white/60 shadow-lg pointer-events-none hidden lg:block -z-10"
      />
      <motion.div
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-40 right-10 w-44 h-20 bg-white/50 backdrop-blur-xl rounded-full border border-white/70 shadow-xl pointer-events-none hidden lg:block -z-10"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Text Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 space-y-6 text-center lg:text-left"
          >
            {/* Soft Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold bg-white/80 border border-indigo-100 text-indigo-700 shadow-sm backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Tailored for Malayalam Speakers Learning English</span>
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Learn English Naturally with Your Personal{' '}
              <span className="gradient-text">AI Mentor</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Practice speaking with AI. Improve pronunciation with real-time feedback. Build unstoppable confidence through natural conversations.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link to="/register">
                <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Start Learning Free
                </Button>
              </Link>
              <Link to="/conversation">
                <Button size="lg" variant="glass" leftIcon={<Play className="w-5 h-5 text-indigo-600" />}>
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Feature Highlights Trust Pills */}
            <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-semibold border-t border-slate-200/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Instant Grammar Correction</span>
              </div>
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-blue-500" />
                <span>Real-Time Voice AI</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Malayalam Explanations</span>
              </div>
            </div>
          </motion.div>

          {/* Right Side AI Conversation Preview Card with Floating Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-6 relative"
          >
            {/* Main AI Conversation Preview Glass Card */}
            <div className="glass-card rounded-[32px] p-6 md:p-8 shadow-2xl border-white/90 relative z-10 space-y-6">
              
              {/* Card Header: AI Mentor Status */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                      AI
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">FluentAI Mentor</h3>
                    <p className="text-xs text-slate-500 font-medium">Native English Accent • Malayalam Support</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Voice Active</span>
                </div>
              </div>

              {/* Conversation Bubbles Preview */}
              <div className="space-y-4 text-xs sm:text-sm">
                {/* AI Bubble */}
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-slate-800 font-medium max-w-[85%] leading-relaxed">
                    <p>Namaskaram! Let's practice introducing yourself in a corporate English meeting. What is your profession?</p>
                    <div className="mt-2 pt-2 border-t border-indigo-100/80 text-[11px] text-indigo-900 font-medium">
                      <span className="font-bold text-indigo-700">Malayalam: </span> കോർപ്പറേറ്റ് മീറ്റിംഗിൽ സ്വയം പരിചയപ്പെടുത്തുന്നത് പരിശീലിക്കാം.
                    </div>
                  </div>
                </div>

                {/* User Bubble */}
                <div className="flex items-start gap-3 flex-row-reverse">
                  <div className="p-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-medium max-w-[85%] shadow-md">
                    I am work as software developer and I manage client calls.
                  </div>
                </div>

                {/* Grammar Correction Callout Bubble */}
                <div className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-slate-800 text-xs space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between text-amber-900 font-bold">
                    <span>✨ Real-Time Grammar Correction</span>
                    <span className="text-[10px] bg-amber-200/80 px-2 py-0.5 rounded-full">Tense Correction</span>
                  </div>
                  <p className="text-slate-700">
                    Say <strong className="text-emerald-700 font-bold">"I work as a software developer"</strong> instead of <em>"I am work"</em>.
                  </p>
                </div>
              </div>

              {/* Bottom Interactive Voice Trigger Bar Preview */}
              <div className="pt-2 flex items-center justify-between bg-slate-50/80 p-3 rounded-2xl border border-slate-200/60">
                <div className="flex items-center gap-3">
                  <button className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md animate-pulse">
                    <Mic className="w-5 h-5" />
                  </button>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Listening to your speech...</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[12, 24, 16, 28, 14, 20].map((h, i) => (
                        <div key={i} className="w-1 bg-indigo-500 rounded-full animate-bounce" style={{ height: `${h}px`, animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <Volume2 className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
            </div>

            {/* Modern Floating Card 1: Speaking XP */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-6 -left-6 z-20 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                <Flame className="w-6 h-6 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Speaking XP</span>
                <p className="text-lg font-black text-slate-900">+450 XP Today</p>
              </div>
            </motion.div>

            {/* Modern Floating Card 2: Vocabulary Learned */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-6 -right-6 z-20 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Vocabulary Mastery</span>
                <p className="text-base font-black text-slate-900">184 Words Retained</p>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </section>
  );
};
