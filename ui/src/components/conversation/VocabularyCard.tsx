import React, { useState } from 'react';
import { VocabularyItem } from '../../types/chat';
import { Volume2, BookMarked, Sparkles } from 'lucide-react';

interface VocabularyCardProps {
  item: VocabularyItem;
}

export const VocabularyCard: React.FC<VocabularyCardProps> = ({ item }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleAudio = () => {
    setIsPlaying(true);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(item.word);
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlaying(false), 1000);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md border border-indigo-100/90 rounded-2xl p-4 shadow-md hover:shadow-indigo-500/10 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              {item.partOfSpeech}
            </span>
            <span className="text-xs text-slate-400 font-mono">{item.phonetic}</span>
          </div>
          <h4 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
            {item.word}
            <button
              onClick={handleAudio}
              className={`p-1.5 rounded-full transition-colors ${
                isPlaying ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
              }`}
              title="Listen to pronunciation"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </h4>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{item.masteryPercentage}% Mastery</span>
        </div>
      </div>

      <div className="mt-3 space-y-2 text-xs md:text-sm">
        <p className="text-slate-700 font-medium">
          <strong className="text-slate-900">Meaning: </strong> {item.meaning}
        </p>

        {item.malayalamMeaning && (
          <p className="text-indigo-900 bg-indigo-50/70 px-3 py-1.5 rounded-xl border border-indigo-100 font-medium">
            <span className="font-semibold text-indigo-700">മലയാളം: </span>
            {item.malayalamMeaning}
          </p>
        )}

        <div className="pt-2 border-t border-slate-100 text-slate-600 italic">
          <span className="font-semibold not-italic text-slate-700 flex items-center gap-1 text-xs mb-0.5">
            <BookMarked className="w-3.5 h-3.5 text-indigo-500" /> Usage Example:
          </span>
          "{item.example}"
        </div>
      </div>
    </div>
  );
};
