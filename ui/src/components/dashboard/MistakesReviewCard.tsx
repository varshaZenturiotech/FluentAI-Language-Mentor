import React from 'react';
import { Card } from '../common/Card';
import { useAppSelector } from '../../store';
import { ShieldAlert, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';
import { Link } from 'react-router-dom';

export const MistakesReviewCard: React.FC = () => {
  const mistakes = useAppSelector((state) => state.progress.recentMistakes);

  return (
    <Card variant="glass" className="p-6 rounded-3xl border border-white/90 shadow-xl mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-100 rounded-xl text-amber-700">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">Review Recent Mistakes</h3>
            <p className="text-xs text-slate-500 font-medium">Clear these points to boost your grammar score to 95%</p>
          </div>
        </div>
        <Link to="/conversation">
          <Button size="sm" variant="outline" rightIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Practice Mistakes
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mistakes.map((m) => (
          <div key={m.id} className="bg-white/80 p-4 rounded-2xl border border-amber-200/60 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-800">
              <span className="bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">{m.category}</span>
              <span className="text-slate-400 font-normal">{m.date}</span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="text-slate-400 line-through">"{m.phrase}"</div>
              <div className="text-emerald-700 font-extrabold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>"{m.correction}"</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
