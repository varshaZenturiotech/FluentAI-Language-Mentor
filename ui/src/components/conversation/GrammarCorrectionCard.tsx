import React from 'react';
import { GrammarCorrection } from '../../types/chat';
import { Sparkles, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface GrammarCorrectionCardProps {
  correction: GrammarCorrection;
}

export const GrammarCorrectionCard: React.FC<GrammarCorrectionCardProps> = ({ correction }) => {
  return (
    <div className="mt-3 bg-gradient-to-r from-amber-50/90 to-orange-50/90 backdrop-blur-md border border-amber-200/80 rounded-2xl p-4 shadow-sm text-slate-800">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs uppercase tracking-wide">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>AI Grammar Correction ({correction.ruleCategory})</span>
        </div>
        <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
          Instant Feedback
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm">
        <div className="flex items-start gap-2 bg-rose-50/80 p-2.5 rounded-xl border border-rose-200/60">
          <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-400 text-[10px] block uppercase font-bold">Original</span>
            <span className="line-through text-rose-700 font-medium">{correction.originalText}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/60">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-400 text-[10px] block uppercase font-bold">Suggested</span>
            <span className="text-emerald-800 font-bold">{correction.correctedText}</span>
          </div>
        </div>
      </div>

      <p className="mt-2.5 text-xs text-slate-700 leading-relaxed font-medium bg-white/70 p-2.5 rounded-xl border border-amber-100">
        <strong className="text-amber-900">Why? </strong>
        {correction.explanation}
      </p>

      {correction.malayalamExplanation && (
        <div className="mt-2 text-xs text-indigo-900 bg-indigo-50/80 p-2 rounded-xl border border-indigo-100 font-medium flex items-center gap-2">
          <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>{correction.malayalamExplanation}</span>
        </div>
      )}
    </div>
  );
};
