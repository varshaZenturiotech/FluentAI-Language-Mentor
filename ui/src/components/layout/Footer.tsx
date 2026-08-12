import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white/80 border-t border-slate-200/60 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 flex items-center justify-center text-white font-black text-lg">
                F
              </div>
              <span className="text-xl font-black text-slate-900">
                Fluent<span className="gradient-text">AI</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed">
              Empowering Malayalam native speakers to master spoken English with real-time AI voice mentorship and instant grammar feedback.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Malayalam ➔ English Active</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Platform</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-600">
              <li><Link to="/conversation" className="hover:text-indigo-600 transition-colors">Voice Conversation</Link></li>
              <li><Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Personal Dashboard</Link></li>
              <li><Link to="/progress" className="hover:text-indigo-600 transition-colors">Progress Tracking</Link></li>
              <li><Link to="/profile" className="hover:text-indigo-600 transition-colors">Achievements & Level</Link></li>
            </ul>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Features</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-600">
              <li><span>AI Grammar Correction</span></li>
              <li><span>Vocabulary Builder</span></li>
              <li><span>Pronunciation Coach</span></li>
              <li><span>Bilingual Malayalam Explanations</span></li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Support</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-600">
              <li><Link to="/settings" className="hover:text-indigo-600 transition-colors">Settings & Audio</Link></li>
              <li><span>Privacy Policy</span></li>
              <li><span>Terms of Service</span></li>
              <li><span>Contact Support</span></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <p>© {new Date().getFullYear()} FluentAI Platform. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for English Learners</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
