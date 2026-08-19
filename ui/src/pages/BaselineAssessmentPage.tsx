import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MentorCanvas3D } from '../components/3d/MentorCanvas3D';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { learningProfileApi } from '../api/learning-profile.api';
import { Message } from '../types/chat';
import { Button } from '../components/common/Button';
import {
  Sparkles,
  Bot,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Volume2,
  Mic,
  Send,
  MessageSquare,
  Square
} from 'lucide-react';
import { sanitizeForTTS } from '../utils/ttsSanitizer';

const INITIAL_AI_GREETING =
  "Hi! Before we build your personalized learning plan, I'd like to get to know your English proficiency. We'll just have a short, natural conversation. There are no right or wrong answers, so speak naturally. Tell me a little about yourself.";

function splitTextForSpeech(text: string): string[] {
  if (!text || text.trim().length === 0) return [];
  const rawParagraphs = text.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];

  for (const para of rawParagraphs) {
    if (para.length <= 600) {
      chunks.push(para);
    } else {
      const sentences = para.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [para];
      let currentChunk = '';
      for (const sentence of sentences) {
        if ((currentChunk + sentence).length <= 600) {
          currentChunk += sentence;
        } else {
          if (currentChunk.trim()) chunks.push(currentChunk.trim());
          currentChunk = sentence;
        }
      }
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
    }
  }
  return chunks.length > 0 ? chunks : [text];
}

export const BaselineAssessmentPage: React.FC = () => {
  const navigate = useNavigate();

  // Full conversation history for API requests
  const [messages, setMessages] = useState<Message[]>([]);
  // Active mentor question displayed on screen
  const [currentQuestion, setCurrentQuestion] = useState<Message | null>(null);

  const [turnCount, setTurnCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isAssessmentCompleted, setIsAssessmentCompleted] = useState<boolean>(false);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio / TTS states & deduplication
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [finalSpeechFinished, setFinalSpeechFinished] = useState<boolean>(false);

  // Text input fallback toggle
  const [showTextInput, setShowTextInput] = useState<boolean>(false);
  const [typedMessage, setTypedMessage] = useState<string>('');

  // Refs for speech lifecycle & single-owner idempotency
  const sessionTimestampRef = useRef<number>(Date.now());
  const autoPlayedMessageIdsRef = useRef<Set<string>>(new Set());
  const activeSpeechMessageIdRef = useRef<string | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isFinalMessageRef = useRef<boolean>(false);
  const initialMsgRef = useRef<Message | null>(null);
  const hasSpokenInitialGreetingRef = useRef<boolean>(false);

  // Clean stale baseline auto-played items from sessionStorage on fresh page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith('baseline_auto_played_')) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (e) {
        // ignore storage errors
      }
    }
  }, []);

  const markMessageAsAutoPlayed = (msgId: string) => {
    if (!msgId) return;
    autoPlayedMessageIdsRef.current.add(msgId);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`baseline_auto_played_${msgId}`, 'true');
      } catch (e) {
        // ignore storage quota errors
      }
    }
  };

  // Voice recorder hook
  const {
    micState,
    audioBlob,
    isTranscribing,
    isThinking,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder();

  // Compute overall mentor state for 3D Canvas
  const effectiveMentorState = isSpeaking
    ? 'speaking'
    : isProcessing || isTranscribing || isThinking
    ? 'thinking'
    : micState === 'listening'
    ? 'listening'
    : 'idle';

  // Central Speech Synthesis / TTS player with chunking, voice readiness, and single-owner idempotency
  const speakMessage = (message: Message, isFinalTurn: boolean = false, isManualReplay: boolean = false) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('[Baseline TTS] SpeechSynthesis API unavailable in browser.');
      return;
    }

    if (!message || !message.id || !message.text || !message.text.trim()) {
      console.warn('[Baseline TTS] Refusing to speak empty or invalid message:', message?.id);
      return;
    }

    // Toggle off if manual click on already active message
    if (isManualReplay && playingMessageId === message.id) {
      console.log('[Baseline TTS] Stopping active playback for message:', message.id);
      window.speechSynthesis.cancel();
      activeSpeechMessageIdRef.current = null;
      activeUtteranceRef.current = null;
      setPlayingMessageId(null);
      setIsSpeaking(false);
      return;
    }

    // Idempotency guard for automatic playback
    if (!isManualReplay) {
      if (autoPlayedMessageIdsRef.current.has(message.id)) {
        console.log('[Baseline TTS] Skipping already auto-played message:', message.id);
        return;
      }
      if (typeof window !== 'undefined' && sessionStorage.getItem(`baseline_auto_played_${message.id}`) === 'true') {
        console.log('[Baseline TTS] Skipping message auto-played in sessionStorage:', message.id);
        return;
      }
      if (activeSpeechMessageIdRef.current === message.id) {
        console.log('[Baseline TTS] Speech already active for message:', message.id);
        return;
      }
    }

    // Cancel previous speech safely before starting new utterance
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }

    if (isFinalTurn) {
      isFinalMessageRef.current = true;
    }

    activeSpeechMessageIdRef.current = message.id;

    const cleanText = sanitizeForTTS(message.text);
    const chunks = splitTextForSpeech(cleanText);

    if (chunks.length === 0) {
      setIsSpeaking(false);
      setPlayingMessageId(null);
      activeSpeechMessageIdRef.current = null;
      if (isFinalTurn) setFinalSpeechFinished(true);
      return;
    }

    let chunkIndex = 0;

    const speakNextChunk = () => {
      if (activeSpeechMessageIdRef.current !== message.id) {
        console.log('[Baseline TTS] Sequence cancelled or replaced for message:', message.id);
        return;
      }

      if (chunkIndex >= chunks.length) {
        setIsSpeaking(false);
        setPlayingMessageId(null);
        activeSpeechMessageIdRef.current = null;
        if (isFinalMessageRef.current) {
          setFinalSpeechFinished(true);
        }
        return;
      }

      const chunkText = chunks[chunkIndex];
      chunkIndex++;

      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      // Select preferred English voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferredVoice = voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Google') ||
              v.name.includes('Natural') ||
              v.name.includes('Samantha') ||
              v.name.includes('Daniel') ||
              v.name.includes('David'))
        ) || voices.find((v) => v.lang.startsWith('en'));
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      activeUtteranceRef.current = utterance;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setPlayingMessageId(message.id);
        if (!isManualReplay) {
          markMessageAsAutoPlayed(message.id);
        }
        if (message.id.startsWith('init-greeting')) {
          hasSpokenInitialGreetingRef.current = true;
        }
        console.log('[Baseline TTS] Utterance onstart fired for message:', message.id);
      };

      utterance.onend = () => {
        console.log('[Baseline TTS] Utterance onend fired for message chunk');
        speakNextChunk();
      };

      utterance.onerror = (e: any) => {
        if (e.error === 'interrupted' || e.error === 'canceled') {
          return;
        }
        console.error('[Baseline TTS] Speech chunk error:', e);
        setIsSpeaking(false);
        setPlayingMessageId(null);
        activeSpeechMessageIdRef.current = null;
        if (isFinalMessageRef.current) {
          setFinalSpeechFinished(true);
        }
      };

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utterance);
    };

    // Voice loading readiness (Case A vs Case B) with guaranteed fallback
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      console.log('[Baseline TTS] Voice list empty on load, attaching onvoiceschanged listener with fallback...');
      let hasRun = false;
      const runSpeak = () => {
        if (hasRun) return;
        hasRun = true;
        window.speechSynthesis.onvoiceschanged = null;
        console.log('[Baseline TTS] Executing speakNextChunk after voice readiness check');
        speakNextChunk();
      };

      window.speechSynthesis.onvoiceschanged = runSpeak;
      setTimeout(runSpeak, 250);
    } else {
      speakNextChunk();
    }
  };

  // Initial greeting message creation (first-class AI message)
  useEffect(() => {
    if (!initialMsgRef.current) {
      const initialMsg: Message = {
        id: `init-greeting-${sessionTimestampRef.current}`,
        sender: 'ai',
        text: INITIAL_AI_GREETING,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      initialMsgRef.current = initialMsg;
      setMessages([initialMsg]);
      setCurrentQuestion(initialMsg);
    }
  }, []);

  // Single authoritative reactive coordinator for automatically speaking AI messages
  useEffect(() => {
    if (messages.length === 0) return;

    const aiMessages = messages.filter(
      (m) => m.sender === 'ai' && m.text && m.text.trim().length > 0
    );
    if (aiMessages.length === 0) return;

    const latestAiMessage = aiMessages[aiMessages.length - 1];

    if (autoPlayedMessageIdsRef.current.has(latestAiMessage.id)) {
      return;
    }

    if (
      typeof window !== 'undefined' &&
      sessionStorage.getItem(`baseline_auto_played_${latestAiMessage.id}`) === 'true'
    ) {
      return;
    }

    if (micState === 'listening') {
      console.log('[Baseline TTS] Skipping auto-play while microphone is active');
      return;
    }

    console.log('[Baseline TTS] Single coordinator detected unspoken AI message:', latestAiMessage.id);
    const isFinalTurn = isAssessmentCompleted && latestAiMessage.id === messages[messages.length - 1]?.id;
    speakMessage(latestAiMessage, isFinalTurn, false);
  }, [messages, isAssessmentCompleted, micState]);

  // Clean up active speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Cancel active speech when user begins microphone recording
  useEffect(() => {
    if (micState === 'listening') {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      activeSpeechMessageIdRef.current = null;
      activeUtteranceRef.current = null;
      setPlayingMessageId(null);
      setIsSpeaking(false);
    }
  }, [micState]);

  // Core handler for submitting turn
  const submitTurn = async (textMessage: string, audioFileBlob?: Blob | null) => {
    if (isProcessing || isAssessmentCompleted) return;

    setErrorMessage(null);
    setIsProcessing(true);

    // Cancel active TTS when user submits response
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    const currentHistory = messages.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

    const tempUserMsgId = 'user-turn-' + Date.now();
    const displayUserText = textMessage || (audioFileBlob ? '[Voice message]' : '...');
    const userMsgObj: Message = {
      id: tempUserMsgId,
      sender: 'user',
      text: displayUserText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsgObj]);

    try {
      const formData = new FormData();
      formData.append('history', JSON.stringify(currentHistory));
      formData.append('turnCount', turnCount.toString());
      formData.append('userMessage', textMessage || '');
      formData.append('targetLevel', 'unknown');

      if (audioFileBlob) {
        const audioFile = new File([audioFileBlob], 'assessment_turn.webm', {
          type: audioFileBlob.type || 'audio/webm',
        });
        formData.append('file', audioFile);
      }

      const res = await learningProfileApi.submitConversationalTurn(formData);

      if (!res) {
        throw new Error('No response received from assessment service.');
      }

      if (res.resolvedUserMessage && textMessage !== res.resolvedUserMessage) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempUserMsgId ? { ...m, text: res.resolvedUserMessage } : m))
        );
      }

      const botMsgObj: Message = {
        id: 'bot-turn-' + Date.now(),
        sender: 'ai',
        text: res.message || "Thank you! Let me process your response.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setCurrentQuestion(botMsgObj);
      setTurnCount((prev) => prev + 1);

      const isCompleted = res.isCompleted === true;

      if (isCompleted) {
        setIsAssessmentCompleted(true);
        setAssessmentResult(res);
      }

      // Add to messages; single reactive coordinator handles TTS playback!
      setMessages((prev) => [...prev, botMsgObj]);
    } catch (err: any) {
      console.error('Error in conversational assessment turn:', err);
      setErrorMessage(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to send response. Please check your connection and try again.'
      );
    } finally {
      setIsProcessing(false);
      cancelRecording();
      setTypedMessage('');
    }
  };

  // Mic tap toggle handler
  const handleMicToggle = () => {
    if (isSpeaking || isProcessing || isTranscribing || isThinking) return;

    if (micState === 'listening') {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Auto-submit voice recording when audioBlob arrives from stopRecording
  useEffect(() => {
    if (audioBlob) {
      submitTurn('', audioBlob);
    }
  }, [audioBlob]);

  // Handle text fallback submit
  const handleTextSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!typedMessage.trim() || isProcessing || isSpeaking) return;
    submitTurn(typedMessage.trim(), null);
  };

  // Navigate downstream after completion
  const handleProceedDownstream = () => {
    if (assessmentResult?.nextStep === 'VIEW_STUDY_PLAN') {
      navigate('/study-plan');
    } else {
      navigate('/learning-onboarding');
    }
  };

  const showCompletionSummaryCard = isAssessmentCompleted && (finalSpeechFinished || !isSpeaking);

  // States for mic button styling & animations
  const isMicDisabled = isSpeaking || isProcessing || isTranscribing || isThinking;
  const isRecording = micState === 'listening';
  const isReadyToRecord = !isMicDisabled && !isRecording;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-sky-50/30 flex flex-col">
      {/* Header */}
      <header className="border-b border-indigo-100/80 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3 sm:px-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                FluentAI Mentor Baseline Assessment
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold">
                  Voice-First Assessment
                </span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Natural conversational assessment with your AI English Mentor.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="text-xs text-slate-600 rounded-xl"
            >
              Exit Assessment
            </Button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Assessment Metrics & Progress Info */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
          <div className="glass-card p-5 rounded-3xl border border-indigo-100/80 shadow-xl shadow-indigo-950/5 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">AI Mentor Assessment</h2>
                <p className="text-xs text-slate-500">Evaluating Fluency & Grammar</p>
              </div>
            </div>

            {/* Sidebar Stats Indicators */}
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Turns Completed</span>
                <span className="font-bold text-indigo-600 text-sm bg-indigo-50 px-2.5 py-0.5 rounded-full">
                  {turnCount} / 6+
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Assessment Mode</span>
                <span className="font-bold text-emerald-600 text-sm bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  Adaptive Dialog
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/40 flex items-start gap-3 text-xs text-emerald-800">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                Your responses are evaluated in real time across CEFR criteria to build your personalized study plan.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Unified Mentor Canvas & Mic Interactive Console */}
        <div className="lg:col-span-8 flex flex-col glass-card rounded-3xl border border-indigo-100/80 shadow-xl shadow-indigo-950/5 p-6 space-y-6 justify-between min-h-[620px]">
          
          {/* Top Error Alert */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <div className="flex-1">{errorMessage}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setErrorMessage(null)}
                className="text-xs text-red-600 border-red-300 rounded-xl"
              >
                Dismiss
              </Button>
            </div>
          )}

          {/* Assessment Completion Card */}
          {showCompletionSummaryCard ? (
            <div className="my-auto p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-850 to-slate-900 text-white shadow-2xl border border-indigo-500/30 text-center space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center ring-4 ring-emerald-500/30">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                  Assessment Complete!
                </h3>
                <p className="text-sm text-indigo-200 max-w-md mx-auto leading-relaxed">
                  Thank you! FluentAI has evaluated your responses and calculated your baseline CEFR metrics.
                  Your 8-week adaptive study plan is ready.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleProceedDownstream}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 shadow-lg shadow-indigo-500/30"
                >
                  {assessmentResult?.nextStep === 'VIEW_STUDY_PLAN'
                    ? 'Go to My AI Study Plan'
                    : 'Complete Onboarding'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Single Active Mentor Question Display Card */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    <Bot className="w-4 h-4" />
                    <span>Mentor Question • Turn {turnCount + 1}</span>
                  </div>

                  {currentQuestion && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => speakMessage(currentQuestion, false, true)}
                      className="text-xs text-indigo-600 hover:bg-indigo-50 rounded-xl flex items-center gap-1.5 font-semibold"
                    >
                      <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse text-emerald-500' : ''}`} />
                      <span>{isSpeaking ? 'Speaking...' : 'Listen Again'}</span>
                    </Button>
                  )}
                </div>

                {/* Question Text */}
                <div className="bg-white/90 rounded-2xl p-5 border border-slate-100 shadow-sm space-y-2 min-h-[90px] flex flex-col justify-center text-center sm:text-left">
                  {isProcessing ? (
                    <div className="flex items-center gap-3 text-slate-500 py-3 justify-center">
                      <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                      <span className="text-sm font-medium">Evaluating your response and formulating next question...</span>
                    </div>
                  ) : (
                    <p className="text-slate-800 text-lg font-medium leading-relaxed">
                      {currentQuestion?.text || INITIAL_AI_GREETING}
                    </p>
                  )}
                </div>
              </div>

              {/* UNIFIED INTERACTION CENTER: 3D Avatar Canvas Directly Paired with Mic */}
              <div className="relative bg-gradient-to-b from-indigo-50/40 via-sky-50/30 to-white p-4 sm:p-6 rounded-3xl border border-indigo-100/60 shadow-inner flex flex-col items-center justify-center space-y-4">
                
                {/* 3D Mentor Avatar Canvas (Unified Focal Point) */}
                <div className="relative w-full max-w-xs h-48 sm:h-52 rounded-2xl overflow-hidden shadow-sm">
                  <MentorCanvas3D micState={effectiveMentorState} className="w-full h-full rounded-2xl" />
                  
                  {/* Avatar Status Badge */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-md border border-indigo-100 flex items-center gap-2 text-xs font-semibold text-slate-700 pointer-events-none">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        effectiveMentorState === 'speaking'
                          ? 'bg-emerald-500 animate-ping'
                          : effectiveMentorState === 'thinking'
                          ? 'bg-amber-500 animate-pulse'
                          : effectiveMentorState === 'listening'
                          ? 'bg-sky-500 animate-pulse'
                          : 'bg-indigo-400'
                      }`}
                    />
                    <span>
                      {effectiveMentorState === 'speaking'
                        ? 'FluentAI Speaking...'
                        : effectiveMentorState === 'thinking'
                        ? 'Evaluating Response...'
                        : effectiveMentorState === 'listening'
                        ? 'Listening...'
                        : 'Mentor Ready'}
                    </span>
                  </div>
                </div>

                {/* Voice Status Pill */}
                <div className="text-xs font-semibold px-4 py-1.5 rounded-full border transition-all z-10">
                  {isSpeaking ? (
                    <span className="text-emerald-700 bg-emerald-50 border-emerald-200 px-3 py-1 rounded-full flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      FluentAI is speaking... Mic disabled until TTS finishes.
                    </span>
                  ) : isProcessing ? (
                    <span className="text-amber-700 bg-amber-50 border-amber-200 px-3 py-1 rounded-full flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                      Evaluating your response...
                    </span>
                  ) : isRecording ? (
                    <span className="text-sky-700 bg-sky-50 border-sky-200 px-3 py-1 rounded-full flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                      Recording spoken response... Tap mic or click Done when finished.
                    </span>
                  ) : (
                    <span className="text-indigo-700 bg-indigo-50 border-indigo-200 px-3 py-1 rounded-full flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Tap mic to start speaking your answer
                    </span>
                  )}
                </div>

                {/* Unified Mic Button Container with Keyframe Pulse Animations */}
                <div className="relative my-2 flex items-center justify-center">
                  
                  {/* STATE 2: Soft Inviting Concentric Pulse Rings (Idle / Ready to record) */}
                  {isReadyToRecord && (
                    <>
                      <div className="absolute w-24 h-24 rounded-full border-2 border-indigo-400/50 animate-mic-invite-1 pointer-events-none" />
                      <div className="absolute w-24 h-24 rounded-full border-2 border-sky-400/40 animate-mic-invite-2 pointer-events-none" />
                    </>
                  )}

                  {/* STATE 3: Energetic Recording Pulse Rings (Recording in progress) */}
                  {isRecording && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-sky-400/40 animate-mic-recording pointer-events-none" />
                      <div className="absolute -inset-4 rounded-full bg-sky-400/20 animate-ping pointer-events-none" />
                    </>
                  )}

                  <button
                    type="button"
                    onClick={handleMicToggle}
                    disabled={isMicDisabled}
                    className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-95 ${
                      isMicDisabled
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        : isRecording
                        ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white ring-4 ring-sky-300'
                        : 'bg-gradient-to-tr from-indigo-600 to-sky-500 text-white hover:shadow-indigo-500/40 hover:scale-105'
                    }`}
                    title={
                      isSpeaking
                        ? 'Mentor is speaking...'
                        : isRecording
                        ? 'Tap to stop & submit'
                        : 'Tap to start recording'
                    }
                  >
                    {isRecording ? (
                      <Square className="w-10 h-10 fill-current animate-pulse" />
                    ) : (
                      <Mic className="w-10 h-10" />
                    )}
                  </button>
                </div>

                {/* Recording Control Button (when recording) */}
                {isRecording && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => stopRecording()}
                    className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md font-bold text-xs flex items-center gap-2 z-10"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Done — Send Spoken Answer</span>
                  </Button>
                )}

                {/* Secondary Text Input Toggle */}
                <div className="pt-1 z-10">
                  <button
                    type="button"
                    onClick={() => setShowTextInput((prev) => !prev)}
                    className="text-xs text-slate-500 hover:text-indigo-600 font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{showTextInput ? 'Hide text fallback' : 'Type response instead'}</span>
                  </button>
                </div>

                {/* Expanded Text Input Fallback */}
                {showTextInput && (
                  <form onSubmit={handleTextSubmit} className="w-full max-w-md space-y-2 pt-2 animate-fadeIn z-10">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={typedMessage}
                        onChange={(e) => setTypedMessage(e.target.value)}
                        placeholder="Type your response here..."
                        disabled={isMicDisabled}
                        className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800 disabled:opacity-50"
                      />
                      <Button
                        type="submit"
                        disabled={!typedMessage.trim() || isMicDisabled}
                        isLoading={isProcessing}
                        size="md"
                        className="rounded-xl px-4"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}

          {/* Bottom Security Footer */}
          <div className="text-center text-[11px] text-slate-400 border-t border-slate-100 pt-3">
            FluentAI Baseline Engine • Evaluating Fluency, Grammar, and Vocabulary
          </div>
        </div>
      </main>
    </div>
  );
};
