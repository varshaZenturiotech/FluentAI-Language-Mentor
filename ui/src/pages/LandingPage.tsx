import React from 'react';
import { Hero } from '../components/landing/Hero';
import { Features } from '../components/landing/Features';
import { HowItWorks } from '../components/landing/HowItWorks';
import { WhyFluentAI } from '../components/landing/WhyFluentAI';
import { ProgressPreview } from '../components/landing/ProgressPreview';
import { Testimonials } from '../components/landing/Testimonials';
import { Button } from '../components/common/Button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-12">
      <Hero />
      <Features />
      <HowItWorks />
      <WhyFluentAI />
      <ProgressPreview />
      <Testimonials />

      {/* Bottom CTA Banner */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="gradient-bg rounded-[36px] p-8 sm:p-14 text-white text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold bg-white/20 backdrop-blur-md text-white border border-white/30">
              <Sparkles className="w-4 h-4 text-amber-300" /> Start Free Today • No Credit Card Required
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Ready to Speak English with Absolute Confidence?
            </h2>
            <p className="text-indigo-100 text-base sm:text-lg font-normal max-w-2xl mx-auto">
              Join thousands of Malayalam speakers building fluency through real-time voice conversations with AI.
            </p>
            <div className="pt-2 flex justify-center">
              <Link to="/register">
                <Button size="lg" variant="glass" className="font-extrabold text-indigo-900 px-8 py-4 text-lg shadow-xl" rightIcon={<ArrowRight className="w-6 h-6 text-indigo-600" />}>
                  Start Learning Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
