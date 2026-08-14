import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { AnimatedMicrophone } from '../components/conversation/AnimatedMicrophone';
import { VoiceStatusPanel } from '../components/conversation/VoiceStatusPanel';
import { ChatBubble } from '../components/conversation/ChatBubble';
import { MessageInput } from '../components/conversation/MessageInput';
import { MentorCanvas3D } from '../components/3d/MentorCanvas3D';
import { addMessage, setActiveTopic, setSessionId, setMessages, setIsAiResponding } from '../store/conversationSlice';
import { Button } from '../components/common/Button';
import { CONVERSATION_TOPICS } from '../utils/constants';
import { conversationApi } from '../api/conversation.api';
import { aiApi } from '../api/ai.api';
import { learningApi } from '../api/learning.api';
import { studyPlanApi } from '../api/study-plan.api';
import { Sparkles, MessageSquare, Box, RefreshCw, Volume2, ShieldCheck, AlertCircle } from 'lucide-react';

export const ConversationPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const querySessionId = searchParams.get('sessionId');
  const queryDayId = searchParams.get('dayId');

  // Lesson context passed from Study Plan when the user clicks Start on a lesson card.
  const lessonTaskName = searchParams.get('taskName');
  const lessonTaskType = searchParams.get('taskType');
  const lessonDayNumber = searchParams.get('dayNumber');
  const lessonDayTitle = searchParams.get('dayTitle');
  const lessonWeekNumber = searchParams.get('weekNumber');
  // Whether we arrived from an explicit Study-Plan lesson launch
  const isStudyPlanLesson = !!(querySessionId && lessonDayTitle);

  const messages = useAppSelector((state) => state.conversation.messages);
  const activeTopic = useAppSelector((state) => state.conversation.activeTopic);
  const isAiResponding = useAppSelector((state) => state.conversation.isAiResponding);
  const stateSessionId = useAppSelector((state) => state.conversation.currentSessionId);

  const [show3dCanvas, setShow3dCanvas] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  const isInitializingRef = useRef(false);
  const lastInitializedSessionIdRef = useRef<string | null>(null);

  const {
    micState,
    connectionStatus,
    startListening,
    stopListeningAndSend,
  } = useVoiceRecorder();

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load existing messages or automatically initialize AI lesson greeting
  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      const activeSessionId = querySessionId || stateSessionId;
      if (!activeSessionId) return;

      if (querySessionId) {
        dispatch(setSessionId(querySessionId));
      }

      // Reset initialization flag when switching to a different session
      if (lastInitializedSessionIdRef.current !== activeSessionId) {
        isInitializingRef.current = false;
        lastInitializedSessionIdRef.current = activeSessionId;
      }

      try {
        setInitError(null);
        console.log(`[CONVERSATION_INIT] Fetching messages for sessionId: ${activeSessionId}`);
        const fetchedMessages = await conversationApi.getMessages(activeSessionId);

        if (!isMounted) return;

        if (fetchedMessages.length > 0) {
          console.log(`[CONVERSATION_INIT] Loaded ${fetchedMessages.length} existing messages`);
          dispatch(setMessages(fetchedMessages));
          return;
        }

        // If no existing messages, call backend startLesson to trigger AI-initiated greeting
        if (queryDayId && !isInitializingRef.current) {
          isInitializingRef.current = true;
          console.log(`[CONVERSATION_INIT] Initializing AI lesson session for dayId: ${queryDayId}`);
          dispatch(setIsAiResponding(true));

          try {
            await studyPlanApi.startLesson(queryDayId);
            if (!isMounted) return;

            const updatedMessages = await conversationApi.getMessages(activeSessionId);
            if (updatedMessages.length > 0) {
              dispatch(setMessages(updatedMessages));
            }
          } catch (initErr: any) {
            console.error('[CONVERSATION_INIT] Failed to initialize lesson session:', initErr);
            if (isMounted) {
              setInitError(initErr.message || 'Failed to initialize lesson session.');
            }
          } finally {
            if (isMounted) {
              dispatch(setIsAiResponding(false));
            }
          }
        }
      } catch (err: any) {
        console.error('[CONVERSATION_INIT] Failed to load session messages:', err);
        if (isMounted) {
          setInitError(err.message || 'Failed to load session messages.');
        }
      }
    };

    initSession();

    return () => {
      isMounted = false;
    };
  }, [querySessionId, stateSessionId, dispatch, lessonTaskName, lessonTaskType]);

  // Auto-scroll chat panel to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiResponding]);

  const pollFinalizationStatus = async (activeSessionId: string) => {
    setIsEnding(true);
    setErrorMessage(null);

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 20) {
        clearInterval(interval);
        setIsEnding(false);
        setErrorMessage('Finalization analysis timed out.');
        return;
      }

      try {
        const res = await learningApi.getSessionStatus(activeSessionId);
        if (res.success && res.data) {
          clearInterval(interval);
          setSummaryData(res.data);
          setShowSummaryModal(true);
          setIsEnding(false);
        }
      } catch (err) {
        console.warn('Polling status error:', err);
      }
    }, 1500);
  };

  const handleMicClick = async () => {
    if (micState === 'idle' || micState === 'error') {
      startListening();
    } else if (micState === 'listening') {
      const res = await stopListeningAndSend();
      if (res?.lessonComplete) {
        console.log('[AUTO_COMPLETION] AI lesson complete flag received via voice. Polling status...');
        const activeSessionId = querySessionId || stateSessionId;
        if (activeSessionId) pollFinalizationStatus(activeSessionId);
      }
    }
  };

  const handleSendMessage = async (text: string) => {
    const res = await stopListeningAndSend(text);
    if (res?.lessonComplete) {
      console.log('[AUTO_COMPLETION] AI lesson complete flag received via chat. Polling status...');
      const activeSessionId = querySessionId || stateSessionId;
      if (activeSessionId) pollFinalizationStatus(activeSessionId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      
      {/* Study-Plan Lesson Context Banner — shown when navigated from a lesson Start button */}
      {isStudyPlanLesson && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0">
              {lessonWeekNumber ? `W${lessonWeekNumber}` : 'AI'}
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest">
                {lessonDayNumber ? `Day ${lessonDayNumber}` : 'Study Plan'} &nbsp;•&nbsp; {lessonTaskType || 'Lesson'}
              </p>
              <p className="text-sm font-black text-indigo-900 leading-tight">
                {lessonTaskName || lessonDayTitle}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/study-plan')}
            className="text-xs font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors"
          >
            ← Back to Study Plan
          </button>
        </div>
      )}
      
      {/* Top Header & Topic Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 rounded-3xl border border-white/90 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 flex items-center justify-center text-white font-black">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">AI Voice Conversation Studio</h1>
              <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Live Session
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Native Language: Malayalam • Learning: English</p>
          </div>
        </div>

        {/* Action Controls & Topic Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {querySessionId && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-xs">
              <span className={`w-2 h-2 rounded-full ${summaryData ? 'bg-emerald-500' : 'bg-emerald-500 animate-pulse'}`} />
              <span className="text-xs font-extrabold text-emerald-900">
                {summaryData ? 'Lesson Complete' : 'Mentor Guiding Lesson'}
              </span>
            </div>
          )}

          {/* Topic Select */}
          {!querySessionId && (
            <select
              value={activeTopic}
              onChange={(e) => dispatch(setActiveTopic(e.target.value))}
              className="bg-white border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
            >
              {CONVERSATION_TOPICS.map((topic) => (
                <option key={topic.id} value={topic.title}>
                  Topic: {topic.title}
                </option>
              ))}
            </select>
          )}

          {/* 3D AI Mentor Avatar Toggle (R3F Prepare) */}
          <Button
            size="sm"
            variant={show3dCanvas ? 'primary' : 'outline'}
            onClick={() => setShow3dCanvas(!show3dCanvas)}
            leftIcon={<Box className="w-4 h-4" />}
          >
            {show3dCanvas ? 'Hide 3D Mentor' : '3D Mentor Canvas'}
          </Button>
        </div>
      </div>

      {/* Main Grid: Interactive Mic & Conversation Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* CENTER / LEFT PANEL: Animated Microphone Studio */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 sm:p-8 rounded-[36px] border border-white/90 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
            
            {/* Background Ambient Blur */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-300/20 blur-3xl rounded-full pointer-events-none" />

            {/* Optional 3D AI Mentor Canvas (React Three Fiber) */}
            {show3dCanvas && (
              <div className="w-full mb-4">
                <MentorCanvas3D micState={micState} className="w-full h-44 border border-indigo-100/60 shadow-sm" />
              </div>
            )}

            {/* Center Animated Glowing Microphone */}
            <AnimatedMicrophone micState={micState} onClick={handleMicClick} />

            {/* Below Mic Voice Status Panel & Instruction */}
            <VoiceStatusPanel status={connectionStatus} micState={micState} />

            {/* Mic Action Quick Trigger Pill */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button
                variant={micState === 'listening' ? 'danger' : 'primary'}
                size="md"
                onClick={handleMicClick}
                className="shadow-lg px-6 rounded-2xl"
              >
                {micState === 'listening' ? 'Finish Speaking' : micState === 'thinking' ? 'AI Responding...' : 'Tap Mic to Speak'}
              </Button>
            </div>
          </div>

          {/* Quick Tips & Grammar Focus Box */}
          <div className="glass-card p-5 rounded-3xl border border-indigo-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Real-Time AI Feedback Highlights</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/80 p-3 rounded-2xl border border-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">Grammar Score</span>
                  <span className="text-slate-500">92% High Accuracy</span>
                </div>
              </div>
              <div className="bg-white/80 p-3 rounded-2xl border border-slate-100 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">Malayalam Translation</span>
                  <span className="text-slate-500">Bilingual Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Live Conversation Feed & Input Bar */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card p-4 sm:p-6 rounded-[36px] border border-white/90 shadow-2xl flex flex-col h-[560px] justify-between">
            
            {/* Conversation Feed Scroll Area */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 scroll-smooth">
              {/* Initialization Error Banner with Retry button */}
              {initError && (
                <div className="p-4 mb-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{initError}</span>
                  </div>
                  <button
                    onClick={() => {
                      isInitializingRef.current = false;
                      lastInitializedSessionIdRef.current = null;
                      setInitError(null);
                      const activeSessionId = querySessionId || stateSessionId;
                      if (activeSessionId) {
                        dispatch(setIsAiResponding(true));
                        aiApi
                          .chat({
                            sessionId: activeSessionId,
                            message: 'Hello! I am ready to start my lesson.',
                            language: 'en',
                          })
                          .then(() => conversationApi.getMessages(activeSessionId))
                          .then((msgs) => dispatch(setMessages(msgs)))
                          .catch((err) => setInitError(err.message || 'Retry failed.'))
                          .finally(() => dispatch(setIsAiResponding(false)));
                      }
                    }}
                    className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors shrink-0"
                  >
                    Retry Lesson Init
                  </button>
                </div>
              )}

              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}

              {/* AI Thinking Indicator Bubble */}
              {isAiResponding && (
                <div className="flex items-center gap-3 my-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold animate-pulse">
                    AI
                  </div>
                  <div className="glass-card px-4 py-3 rounded-3xl text-xs font-semibold text-indigo-700 flex items-center gap-2 shadow-sm">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>AI Mentor is crafting feedback in English & Malayalam...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Bottom Message & Voice Input */}
            <div className="pt-4 border-t border-slate-100">
              <MessageInput
                onSendMessage={handleSendMessage}
                onMicClick={handleMicClick}
                isListening={micState === 'listening'}
                disabled={isAiResponding}
              />
            </div>

          </div>
        </div>

      </div>

      {/* Summary Modal overlay */}
      {showSummaryModal && summaryData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-2xl bg-white/95 border border-white/20 rounded-[32px] shadow-2xl p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[90vh]">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center text-white ${
                summaryData.lessonCompletionPercentage >= 80 && messages.filter((m) => m.sender === 'user').length >= 4
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-br from-amber-500 to-orange-400'
              }`}>
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                {summaryData.lessonCompletionPercentage >= 80 && messages.filter((m) => m.sender === 'user').length >= 4
                  ? 'Lesson Completed Successfully!'
                  : 'Lesson Completed (Objectives Incomplete)'}
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                {summaryData.lessonCompletionPercentage >= 80 && messages.filter((m) => m.sender === 'user').length >= 4
                  ? `Congratulations! You've achieved today's lesson objectives.`
                  : `Keep practicing! To complete the lesson, speak at least 4 turns and address the core objectives.`}
              </p>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <span className="text-xs text-slate-500 font-bold block mb-1">Grammar</span>
                <span className="text-xl font-extrabold text-indigo-600">{summaryData.grammarScore}%</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <span className="text-xs text-slate-500 font-bold block mb-1">Vocabulary</span>
                <span className="text-xl font-extrabold text-blue-600">{summaryData.vocabularyScore}%</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <span className="text-xs text-slate-500 font-bold block mb-1">Fluency</span>
                <span className="text-xl font-extrabold text-purple-600">{summaryData.fluencyScore}%</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <span className="text-xs text-slate-500 font-bold block mb-1">XP Earned</span>
                <span className="text-xl font-extrabold text-emerald-600">+{summaryData.lessonCompletionPercentage >= 80 && messages.filter((m) => m.sender === 'user').length >= 4 ? 20 : 0} XP</span>
              </div>
            </div>

            {/* Interactive turns progress */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-bold block">Speaking Turns</span>
                <span className="text-sm font-semibold text-slate-700">{messages.filter((m) => m.sender === 'user').length} / 4 turns</span>
              </div>
              <div className="w-2/3 bg-slate-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${messages.filter((m) => m.sender === 'user').length >= 4 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min((messages.filter((m) => m.sender === 'user').length / 4) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* AI Recommendation / Feedback */}
            {summaryData.recommendations && (
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">AI Mentor Analysis & Recommendations</h3>
                <p className="text-xs text-indigo-800 leading-relaxed font-medium">
                  {(() => {
                    try {
                      const recs = JSON.parse(summaryData.recommendations);
                      return recs.focus || summaryData.recommendations;
                    } catch (e) {
                      return summaryData.recommendations;
                    }
                  })()}
                </p>
              </div>
            )}

            {/* Grammar Mistakes Breakdown */}
            {summaryData.weakTopics && JSON.parse(summaryData.weakTopics || '[]').length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Grammar Areas for Review</h3>
                <div className="flex flex-wrap gap-2">
                  {JSON.parse(summaryData.weakTopics || '[]').map((topic: string, idx: number) => (
                    <span key={idx} className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {!(summaryData.lessonCompletionPercentage >= 80 && messages.filter((m) => m.sender === 'user').length >= 4) && (
                <Button
                  variant="outline"
                  className="flex-1 rounded-2xl font-bold py-3 text-xs"
                  onClick={() => setShowSummaryModal(false)}
                >
                  Continue Practicing
                </Button>
              )}
              <Button
                variant="primary"
                className="flex-1 rounded-2xl font-bold py-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => {
                  setShowSummaryModal(false);
                  navigate('/study-plan');
                }}
              >
                Return to Study Plan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
