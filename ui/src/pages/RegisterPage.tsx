import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { User, Mail, Lock, Languages, Sparkles, ArrowRight } from 'lucide-react';

import { learningProfileApi } from '../api/learning-profile.api';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, login, isLoading, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('Malayalam');
  const [learningLanguage, setLearningLanguage] = useState('English');
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    try {
      await register({
        name: name || 'Learner',
        email: email || 'user@fluentai.app',
        password,
        nativeLanguage: 'ml',
        learningLanguage: 'en',
        level: level.toUpperCase() as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
      });
      // Automate login on signup
      await login({ email, password });
      try {
        const profileRes = await learningProfileApi.getProfile();
        if (profileRes && profileRes.onboardingCompleted === false) {
          navigate('/learning-onboarding');
          return;
        }
      } catch (profileErr) {
        console.error('Failed to fetch learning profile:', profileErr);
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      console.error(err);
    }
  };


  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        
        <div className="text-center space-y-2 mb-8">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-indigo-600 to-sky-500 flex items-center justify-center text-white font-black text-2xl mx-auto shadow-lg shadow-indigo-500/25">
            F
          </div>
          <h1 className="text-3xl font-black text-slate-900">Start Learning Free</h1>
          <p className="text-sm text-slate-500 font-medium">
            Create your account to start voice practice with AI Mentor
          </p>
        </div>

        <Card variant="glass" glow className="p-8 rounded-3xl border border-white/90 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-xs font-semibold">
                {error}
              </div>
            )}
            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Nair"
              icon={<User className="w-4 h-4 text-slate-400" />}
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon={<Mail className="w-4 h-4 text-slate-400" />}
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create password (min 8 characters)"
              icon={<Lock className="w-4 h-4 text-slate-400" />}
              required
            />

            {/* Language Pair Select */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Native Language
                </label>
                <div className="flex items-center gap-2 p-3 bg-white/90 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800">
                  <Languages className="w-4 h-4 text-indigo-600" />
                  <span>Malayalam (മലയാളം)</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Target Language
                </label>
                <div className="flex items-center gap-2 p-3 bg-white/90 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>English (Spoken)</span>
                </div>
              </div>
            </div>

            {/* Current Level */}
            <div className="space-y-1 pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Current English Speaking Confidence
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all border ${
                      level === lvl
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white/80 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full justify-center py-3.5 mt-4"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Get Started Free
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-indigo-600 hover:underline">
              Log in
            </Link>
          </div>
        </Card>

      </div>
    </div>
  );
};
