import React, { useState } from 'react';
import { Message } from '../../types/chat';
import { GrammarCorrectionCard } from './GrammarCorrectionCard';
import { VocabularyCard } from './VocabularyCard';
import { Volume2, Languages, Bot, User, Sparkles } from 'lucide-react';
import { sanitizeForTTS } from '../../utils/ttsSanitizer';

interface ChatBubbleProps {
  message: Message;
  isPlaying?: boolean;
  onPlayAudio?: (message: Message) => void;
}

export const FormattedMarkdownText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.*?)\*\*|__(.*?)__|`([^`]+)`|\*(.*?)\*|_(.*?)_)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex));
    }

    if (match[2] || match[3]) {
      const content = match[2] || match[3];
      parts.push(<strong key={matchIndex} className="font-semibold text-indigo-950">{content}</strong>);
    } else if (match[4]) {
      parts.push(<code key={matchIndex} className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-indigo-700">{match[4]}</code>);
    } else if (match[5] || match[6]) {
      const content = match[5] || match[6];
      parts.push(<em key={matchIndex} className="italic">{content}</em>);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts.length > 0 ? parts : text}</>;
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isPlaying, onPlayAudio }) => {
  const isUser = message.sender === 'user';
  const [showTranslation, setShowTranslation] = useState(false);
  const [internalIsPlaying, setInternalIsPlaying] = useState(false);

  const isPlayingAudio = isPlaying !== undefined ? isPlaying : internalIsPlaying;

  const handlePlayAudio = () => {
    if (onPlayAudio) {
      onPlayAudio(message);
    } else {
      setInternalIsPlaying(true);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const textToSpeak = sanitizeForTTS(message.text);
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 0.95;
        utterance.onend = () => setInternalIsPlaying(false);
        utterance.onerror = () => setInternalIsPlaying(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => setInternalIsPlaying(false), 1500);
      }
    }
  };

  return (
    <div className={`flex gap-3 my-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar Icon */}
      <div
        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
          isUser
            ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white'
            : 'bg-gradient-to-br from-sky-400 to-indigo-600 text-white ring-2 ring-indigo-200'
        }`}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      {/* Bubble Container */}
      <div className={`max-w-[85%] md:max-w-[75%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Header Sender Info */}
        <div className={`flex items-center gap-2 text-xs font-semibold text-slate-500 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span>{isUser ? 'You' : 'FluentAI Mentor'}</span>
          <span>•</span>
          <span>{message.timestamp}</span>
        </div>

        {/* Message Content */}
        <div
          className={`p-4 rounded-3xl shadow-sm leading-relaxed text-sm md:text-base relative ${
            isUser
              ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none'
              : 'glass-card text-slate-800 rounded-tl-none border-slate-200/80'
          }`}
        >
          <p className="font-medium whitespace-pre-wrap">
            <FormattedMarkdownText text={message.text} />
          </p>

          {/* Controls Bar for AI Message */}
          {!isUser && (
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100/80 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayAudio}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all ${
                    isPlayingAudio ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isPlayingAudio ? 'Speaking...' : 'Listen'}</span>
                </button>

                {message.malayalamTranslation && (
                  <button
                    onClick={() => setShowTranslation(!showTranslation)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                  >
                    <Languages className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{showTranslation ? 'Hide Malayalam' : 'Translate to Malayalam'}</span>
                  </button>
                )}
              </div>

              {message.pronunciationScore && (
                <div className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  <Sparkles className="w-3 h-3" />
                  <span>{message.pronunciationScore}% Pronunciation</span>
                </div>
              )}
            </div>
          )}

          {/* Malayalam Translation Box */}
          {showTranslation && message.malayalamTranslation && (
            <div className="mt-3 p-3 bg-indigo-50/90 rounded-2xl border border-indigo-100 text-indigo-950 font-medium text-xs md:text-sm animate-fadeIn">
              <span className="font-bold text-indigo-700 block mb-1">മലയാളം വിവർത്തനം:</span>
              {message.malayalamTranslation}
            </div>
          )}
        </div>

        {/* Grammar Correction Callout */}
        {message.grammarCorrections && message.grammarCorrections.length > 0 && (
          <div className="w-full">
            {message.grammarCorrections.map((corr, idx) => (
              <GrammarCorrectionCard key={idx} correction={corr} />
            ))}
          </div>
        )}

        {/* New Vocabulary Card */}
        {message.newVocabulary && message.newVocabulary.length > 0 && (
          <div className="w-full space-y-2 mt-2">
            {message.newVocabulary.map((vocab) => (
              <VocabularyCard key={vocab.id} item={vocab} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
