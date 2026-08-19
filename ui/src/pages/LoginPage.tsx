import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { learningProfileApi } from '../api/learning-profile.api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('rahul@fluentai.app');
  const [password, setPassword] = useState('password123');

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    try {
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
      // Error handled by hook state
    }
  };


  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        
        {/* Top Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-indigo-600 to-sky-500 flex items-center justify-center text-white font-black text-2xl mx-auto shadow-lg shadow-indigo-500/25">
            F
          </div>
          <h1 className="text-3xl font-black text-slate-900">Welcome Back</h1>
          <p className="text-sm text-slate-500 font-medium">
            Continue your Malayalam ➔ English speaking journey
          </p>
        </div>

        {/* Login Glass Card */}
        <Card variant="glass" glow className="p-8 rounded-3xl border border-white/90 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-xs font-semibold">
                {error}
              </div>
            )}

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
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4 text-slate-400" />}
              required
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span>Remember me</span>
              </label>
              <a href="#" className="font-semibold text-indigo-600 hover:underline">Forgot password?</a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full justify-center py-3.5"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Sign In to FluentAI
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-indigo-600 hover:underline">
              Create a free account
            </Link>
          </div>
        </Card>

        {/* Demo Credentials Quick Pill */}
        <div className="mt-4 p-3 bg-indigo-50/80 rounded-2xl border border-indigo-100 text-center text-xs text-indigo-900 font-semibold flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Demo Account loaded automatically for instant access!</span>
        </div>

      </div>
    </div>
  );
};
