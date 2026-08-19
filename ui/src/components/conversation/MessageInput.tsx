import React, { useState } from 'react';
import { Send, Mic } from 'lucide-react';
import { Button } from '../common/Button';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  onMicClick: () => void;
  isListening?: boolean;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onMicClick,
  isListening = false,
  disabled = false,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!inputText.trim() || disabled) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="glass-card p-2 md:p-3 rounded-3xl border border-indigo-100 shadow-xl shadow-indigo-950/5 flex items-center gap-2">
        {/* Mic Toggle Button */}
        <button
          type="button"
          onClick={onMicClick}
          className={`p-3 rounded-2xl transition-all duration-300 flex items-center justify-center shrink-0 cursor-pointer ${
            isListening
              ? 'bg-blue-600 text-white animate-pulse shadow-md shadow-blue-500/30'
              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700'
          }`}
          title={isListening ? 'Stop listening' : 'Start speaking with microphone'}
          id="conversation-mic-trigger"
        >
          <Mic className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isListening ? 'Listening to your speech...' : 'Type a response or ask a grammar question in English...'}
          disabled={disabled}
          className="flex-1 bg-transparent px-3 py-2 text-sm md:text-base text-slate-800 placeholder-slate-400 focus:outline-none"
        />

        {/* Send Button */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!inputText.trim() || disabled}
          className="rounded-2xl shrink-0"
          rightIcon={<Send className="w-4 h-4" />}
        >
          <span className="hidden sm:inline">Send</span>
        </Button>
      </div>
    </form>
  );
};
