import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { learningProfileApi } from '../api/learning-profile.api';
import {
  BookOpen,
  Award,
  ChevronRight,
  Play,
  Volume2,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Mic,
  Square,
  PenTool,
  Loader,
  AlertCircle,
  Check,
  Zap,
  RotateCcw,
  StopCircle
} from 'lucide-react';

// ─── Self-contained voice recorder for the assessment ───────────────────────
// Uses MediaRecorder directly — no Redux, no transcription, no AI calls.
interface AssessmentVoiceRecorderProps {
  onAudioReady: (blob: Blob | null) => void;
}

const AssessmentVoiceRecorder: React.FC<AssessmentVoiceRecorderProps> = ({ onAudioReady }) => {
  const [status, setStatus] = useState<'idle' | 'recording' | 'recorded'>('idle');
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.onended = () => setIsPlaying(false);
    return () => {
      audioRef.current?.pause();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg';
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(url);
        setStatus('recorded');
        onAudioReady(blob);
      };

      mr.start(250);
      setStatus('recording');
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err: any) {
      setError(err.message?.includes('Permission')
        ? 'Microphone access denied. Please allow microphone access in your browser settings.'
        : 'Could not start recording. Please check your microphone.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    mediaRecorderRef.current?.stop();
  };

  const resetRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    audioRef.current?.pause();
    setIsPlaying(false);
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
    setStatus('idle');
    setDuration(0);
    setError(null);
    onAudioReady(null);
  };

  const togglePlayback = () => {
    if (!audioUrl || !audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(() => setError('Playback failed.'));
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-slate-900/60 backdrop-blur-md border border-slate-700 rounded-2xl w-full shadow-xl">
      <h3 className="text-slate-200 text-xs font-bold uppercase tracking-widest mb-5">
        {status === 'recording' ? '● Recording…' : status === 'recorded' ? '✓ Recording Ready' : 'Voice Recorder'}
      </h3>

      {/* Big mic / stop button */}
      <div className="relative flex items-center justify-center w-28 h-28 mb-5">
        {status === 'recording' && (
          <>
            <div className="absolute inset-0 rounded-full bg-red-500/25 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-red-500/15 animate-pulse" />
          </>
        )}
        <button
          onClick={status === 'recording' ? stopRecording : status === 'idle' ? startRecording : undefined}
          disabled={status === 'recorded'}
          className={`relative z-10 w-22 h-22 w-[88px] h-[88px] rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
            status === 'recording'
              ? 'bg-red-500 text-white hover:bg-red-600 border border-red-400 cursor-pointer'
              : status === 'recorded'
              ? 'bg-slate-700 border border-slate-600 text-slate-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95 border border-indigo-500 cursor-pointer shadow-indigo-600/30'
          }`}
          title={status === 'recording' ? 'Stop' : 'Start Recording'}
        >
          {status === 'recording' ? (
            <Square className="w-9 h-9 fill-current" />
          ) : (
            <Mic className="w-9 h-9" />
          )}
        </button>
      </div>

      {/* Timer */}
      <div className="text-center mb-5 h-10 flex items-center justify-center">
        {status === 'recording' && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 font-mono text-2xl font-bold tracking-widest">{formatTime(duration)}</span>
          </div>
        )}
        {status === 'recorded' && (
          <span className="text-slate-300 font-mono text-xl font-semibold">{formatTime(duration)}</span>
        )}
        {status === 'idle' && (
          <span className="text-slate-500 text-sm">Tap the mic to start</span>
        )}
      </div>

      {/* Playback + reset controls (shown after recording) */}
      {status === 'recorded' && (
        <div className="flex items-center gap-4">
          <button
            onClick={resetRecording}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Re-record"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={togglePlayback}
            className={`flex items-center justify-center w-14 h-14 rounded-full border shadow-lg transition-all cursor-pointer ${
              isPlaying
                ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700'
                : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700 hover:scale-105'
            }`}
            title={isPlaying ? 'Stop Playback' : 'Preview Recording'}
          >
            {isPlaying ? (
              <Volume2 className="w-6 h-6 animate-pulse" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs w-full">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// Hardcoded multiple choice questions
const GRAMMAR_VOCAB_QUESTIONS = [
  {
    id: 'g1',
    type: 'grammar',
    question: 'If I ______ you, I would have gone to the party.',
    options: ['am', 'were', 'had been', 'would be'],
    correctIndex: 2 // had been (Third conditional: If I had been you, I would have gone)
  },
  {
    id: 'g2',
    type: 'grammar',
    question: 'By next month, she ______ here for five years.',
    options: ['works', 'is working', 'has worked', 'will have worked'],
    correctIndex: 3 // will have worked (Future perfect)
  },
  {
    id: 'g3',
    type: 'grammar',
    question: 'Hardly ______ finished my dinner when the bell rang.',
    options: ['I had', 'had I', 'did I', 'I did'],
    correctIndex: 1 // had I (Inversion after negative adverbial)
  },
  {
    id: 'v1',
    type: 'vocabulary',
    question: 'Her explanation was so ______ that everyone understood immediately.',
    options: ['ambiguous', 'lucid', 'tedious', 'complex'],
    correctIndex: 1 // lucid
  },
  {
    id: 'v2',
    type: 'vocabulary',
    question: 'The company plans to ______ its operations into global markets next year.',
    options: ['expend', 'expand', 'expire', 'elicit'],
    correctIndex: 1 // expand
  },
  {
    id: 'v3',
    type: 'vocabulary',
    question: 'The detective was able to ______ the truth from the suspect after hours of interviewing.',
    options: ['elicit', 'illicit', 'allocate', 'advocate'],
    correctIndex: 0 // elicit
  }
];

const READING_PASSAGE = "Artificial Intelligence has transformed the way modern businesses operate. By automating routine tasks and analyzing massive datasets, AI enables organizations to significantly increase operational efficiency and make precise, data-driven decisions. However, the widespread adoption of AI also raises critical ethical concerns regarding potential job displacement and the security of sensitive personal data.";

const READING_QUESTIONS = [
  {
    id: 'r1',
    question: 'What is a major benefit of AI mentioned in the passage?',
    options: [
      'It eliminates the need for managers.',
      'It increases operational efficiency and enables data-driven decisions.',
      'It guarantees the security of all personal data.',
      'It completely removes the necessity for business strategies.'
    ],
    correctIndex: 1
  },
  {
    id: 'r2',
    question: 'Which of the following ethical issues is explicitly raised in the passage?',
    options: [
      'The high cost of maintaining AI servers.',
      'A lack of technical training for employees.',
      'Job displacement and data security risks.',
      'Reduced interest in manual craftsmanship.'
    ],
    correctIndex: 2
  }
];

const LISTENING_PASSAGE = "Welcome to FluentAI. We are committed to helping you master the English language. Today, we will discuss the importance of active listening in professional settings. Active listening requires full concentration on what is being said rather than just passively hearing the message. By focusing entirely, you can respond accurately and build stronger professional connections.";

const LISTENING_QUESTIONS = [
  {
    id: 'l1',
    question: 'According to the speaker, what does active listening require?',
    options: [
      'Taking detailed notes of every word.',
      'Full concentration on what is being said.',
      'Nodding your head constantly to show agreement.',
      'Speaking more than the other person.'
    ],
    correctIndex: 1
  },
  {
    id: 'l2',
    question: 'What is the primary purpose of FluentAI mentioned in the audio?',
    options: [
      'To build automated writing correctors.',
      'To help you master the English language.',
      'To record corporate business meetings.',
      'To translate spoken text into multiple languages.'
    ],
    correctIndex: 1
  }
];

export const BaselineAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(0); // 0: Intro, 1: Gram/Vocab, 2: Reading, 3: Listening, 4: Writing, 5: Speaking, 6: Submitting, 7: Results
  
  // MCQ state
  const [gvAnswers, setGvAnswers] = useState<Record<string, number>>({});
  const [readingAnswers, setReadingAnswers] = useState<Record<string, number>>({});
  const [listeningAnswers, setListeningAnswers] = useState<Record<string, number>>({});
  
  // Text & Audio state
  const [writingText, setWritingText] = useState<string>('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  // Audio playback state
  const [isListeningAudioPlaying, setIsListeningAudioPlaying] = useState<boolean>(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Submission & Results
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Stop TTS voice synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlayListeningAudio = () => {
    if (isListeningAudioPlaying) {
      window.speechSynthesis.cancel();
      setIsListeningAudioPlaying(false);
      return;
    }

    setIsListeningAudioPlaying(true);
    const utterance = new SpeechSynthesisUtterance(LISTENING_PASSAGE);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // slightly slower for clarity
    
    utterance.onend = () => {
      setIsListeningAudioPlaying(false);
    };
    utterance.onerror = () => {
      setIsListeningAudioPlaying(false);
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleSkip = async () => {
    if (window.confirm("Are you sure you want to skip the baseline assessment? We will generate your study plan using your self-assessment slider ratings instead.")) {
      setIsSubmitting(true);
      setError(null);
      setStep(6);
      try {
        const formData = new FormData();
        formData.append('writingText', '');
        formData.append('mcGrammarScore', '0');
        formData.append('mcGrammarTotal', '0'); // indicates skip
        formData.append('mcVocabularyScore', '0');
        formData.append('mcVocabularyTotal', '0');
        formData.append('mcReadingScore', '0');
        formData.append('mcReadingTotal', '0');
        formData.append('mcListeningScore', '0');
        formData.append('mcListeningTotal', '0');
        formData.append('targetLevel', 'Intermediate');

        const data = await learningProfileApi.submitBaselineAssessment(formData);
        setResult(data);
        setStep(7);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to submit baseline skip request.');
        setStep(0);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmitWithConfirm = () => {
    if (!audioBlob) {
      const confirmed = window.confirm(
        "You haven't recorded a voice audio. Do you want to submit the assessment using only written metrics? Speaking and fluency scores will default."
      );
      if (!confirmed) return;
    }
    handleSubmit();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setStep(6);

    try {
      // Calculate MCQ Scores
      let grammarScore = 0;
      let grammarTotal = 0;
      let vocabScore = 0;
      let vocabTotal = 0;

      GRAMMAR_VOCAB_QUESTIONS.forEach((q) => {
        const answer = gvAnswers[q.id];
        const isCorrect = answer === q.correctIndex;
        if (q.type === 'grammar') {
          grammarTotal++;
          if (isCorrect) grammarScore++;
        } else {
          vocabTotal++;
          if (isCorrect) vocabScore++;
        }
      });

      let readingScore = 0;
      READING_QUESTIONS.forEach((q) => {
        if (readingAnswers[q.id] === q.correctIndex) {
          readingScore++;
        }
      });

      let listeningScore = 0;
      LISTENING_QUESTIONS.forEach((q) => {
        if (listeningAnswers[q.id] === q.correctIndex) {
          listeningScore++;
        }
      });

      // Prepare FormData
      const formData = new FormData();
      formData.append('writingText', writingText);
      formData.append('mcGrammarScore', grammarScore.toString());
      formData.append('mcGrammarTotal', grammarTotal.toString());
      formData.append('mcVocabularyScore', vocabScore.toString());
      formData.append('mcVocabularyTotal', vocabTotal.toString());
      formData.append('mcReadingScore', readingScore.toString());
      formData.append('mcReadingTotal', READING_QUESTIONS.length.toString());
      formData.append('mcListeningScore', listeningScore.toString());
      formData.append('mcListeningTotal', LISTENING_QUESTIONS.length.toString());
      formData.append('targetLevel', 'Intermediate');

      if (audioBlob) {
        formData.append('file', audioBlob, 'speaking.wav');
      }

      const evalData = await learningProfileApi.submitBaselineAssessment(formData);
      setResult(evalData);
      setStep(7);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to grade your baseline assessment. Please check your network and try again.');
      setStep(5); // Go back to Speaking step so they can try re-submitting
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { label: 'Introduction', icon: Sparkles },
    { label: 'Grammar & Vocab', icon: BookOpen },
    { label: 'Reading', icon: BookOpen },
    { label: 'Listening', icon: Volume2 },
    { label: 'Writing', icon: PenTool },
    { label: 'Speaking', icon: Mic }
  ];

  return (
    <div className="min-h-screen py-12 px-4 flex flex-col items-center justify-start bg-slate-50 relative overflow-hidden">
      {/* Background shapes */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-100 rounded-full filter blur-3xl -z-10 opacity-70" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-100 rounded-full filter blur-3xl -z-10 opacity-70" />

      {/* Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100/60 px-3 py-1 rounded-full text-indigo-700 text-xs font-semibold mb-3">
          <Award className="w-3.5 h-3.5" /> FluentAI Performance Evaluator
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI Language Baseline Assessment</h1>
        <p className="text-slate-500 text-sm mt-1.5 max-w-md mx-auto">
          Measure your actual grammar, speaking, listening, and comprehension level in under 10 minutes.
        </p>
      </div>

      {/* Step Stepper Header (Only visible during active evaluation) */}
      {step > 0 && step < 6 && (
        <div className="w-full max-w-4xl mb-8 bg-white p-4 rounded-2xl border border-slate-200/50 shadow-sm">
          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            {stepsList.map((s, idx) => {
              const StepIcon = s.icon;
              const isActive = step === idx;
              const isCompleted = step > idx;

              return (
                <div key={idx} className="flex items-center gap-2 flex-1 min-w-[120px]">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isActive
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : idx}
                  </div>
                  <span
                    className={`text-xs font-bold transition-colors ${
                      isActive ? 'text-indigo-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                  {idx < stepsList.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto hidden sm:block" />
                  )}
                </div>
              );
            })}
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{ width: `${(step / (stepsList.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Glassmorphic Layout Container */}
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/80 shadow-xl transition-all duration-500 min-h-[400px] flex flex-col justify-between">
        
        {/* STEP 0: WELCOME & INTRO */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <Sparkles className="text-indigo-600 w-6 h-6" /> Welcome to your Baseline Assessment
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                To build your 8-week personalized roadmap, we need to assess your true starting point. 
                This assessment checks your proficiency levels across listening, speaking, grammar, reading, and writing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/40">
                <h3 className="font-extrabold text-slate-800 text-sm mb-1">🔍 Self-Assessment vs. Measured</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  We maintain your subjective ratings alongside objective scores to capture both confidence and true mastery.
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/40">
                <h3 className="font-extrabold text-slate-800 text-sm mb-1">⚡ Dynamic 8-Week Roadmap</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your baseline proficiency scores are directly injected into our LLM generator to optimize weak topics first.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex gap-3 text-indigo-800 text-xs">
              <HelpCircle className="w-5 h-5 shrink-0 text-indigo-600" />
              <div>
                <strong className="font-bold block mb-0.5">What is required?</strong>
                A working microphone (for speaking prompt), speaker/headphones (for listening), and about 5-10 minutes of uninterrupted study time.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <button
                onClick={() => setStep(1)}
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:scale-102 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
              >
                Start Assessment <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleSkip}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all cursor-pointer text-center"
              >
                Skip & Use Slider Estimates
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: GRAMMAR & VOCABULARY */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-800">Grammar & Vocabulary</h2>
              <p className="text-xs text-slate-500">Select the correct option to complete each sentence.</p>
            </div>

            <div className="space-y-6 max-h-[380px] overflow-y-auto pr-2">
              {GRAMMAR_VOCAB_QUESTIONS.map((q, qidx) => (
                <div key={q.id} className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/40">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    Question {qidx + 1} • {q.type}
                  </span>
                  <p className="text-sm font-semibold text-slate-800">{q.question}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {q.options.map((opt, oidx) => (
                      <button
                        key={oidx}
                        onClick={() => setGvAnswers((prev) => ({ ...prev, [q.id]: oidx }))}
                        className={`text-left text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
                          gvAnswers[q.id] === oidx
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button
                onClick={() => setStep(0)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={Object.keys(gvAnswers).length < GRAMMAR_VOCAB_QUESTIONS.length}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold transition-all hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: READING COMPREHENSION */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-800">Reading Comprehension</h2>
              <p className="text-xs text-slate-500">Read the passage below and answer the questions.</p>
            </div>

            <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl leading-relaxed text-xs border border-slate-800 italic shadow-inner">
              "{READING_PASSAGE}"
            </div>

            <div className="space-y-6 overflow-y-auto pr-1">
              {READING_QUESTIONS.map((q, qidx) => (
                <div key={q.id} className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/40">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    Comprehension Q{qidx + 1}
                  </span>
                  <p className="text-sm font-semibold text-slate-800">{q.question}</p>
                  <div className="space-y-2 mt-2">
                    {q.options.map((opt, oidx) => (
                      <button
                        key={oidx}
                        onClick={() => setReadingAnswers((prev) => ({ ...prev, [q.id]: oidx }))}
                        className={`text-left text-xs font-semibold px-4 py-2.5 rounded-xl border w-full transition-all cursor-pointer ${
                          readingAnswers[q.id] === oidx
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all cursor-pointer"
              >
                Back
              </button>
              <div className="flex items-center gap-3">
                {Object.keys(readingAnswers).length < READING_QUESTIONS.length && (
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                    {Object.keys(readingAnswers).length}/{READING_QUESTIONS.length} answered
                  </span>
                )}
                <button
                  onClick={() => setStep(3)}
                  disabled={Object.keys(readingAnswers).length < READING_QUESTIONS.length}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold transition-all hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: LISTENING COMPREHENSION */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-800">Listening Comprehension</h2>
              <p className="text-xs text-slate-500">Play the audio passage, then answer the questions based on what you hear.</p>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200/50">
              <button
                onClick={handlePlayListeningAudio}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer ${
                  isListeningAudioPlaying
                    ? 'bg-red-500 text-white shadow-red-500/20'
                    : 'bg-indigo-600 text-white shadow-indigo-600/25 hover:bg-indigo-700 hover:scale-105'
                }`}
              >
                {isListeningAudioPlaying ? (
                  <Loader className="w-8 h-8 animate-spin" />
                ) : (
                  <Play className="w-8 h-8 fill-current ml-1" />
                )}
              </button>
              <span className="text-xs font-bold text-slate-500 mt-3.5">
                {isListeningAudioPlaying ? 'Playing speech passage... Listen closely.' : 'Click to Play Audio'}
              </span>
            </div>

            <div className="space-y-6 overflow-y-auto pr-1">
              {LISTENING_QUESTIONS.map((q, qidx) => (
                <div key={q.id} className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/40">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    Listening Q{qidx + 1}
                  </span>
                  <p className="text-sm font-semibold text-slate-800">{q.question}</p>
                  <div className="space-y-2 mt-2">
                    {q.options.map((opt, oidx) => (
                      <button
                        key={oidx}
                        onClick={() => setListeningAnswers((prev) => ({ ...prev, [q.id]: oidx }))}
                        className={`text-left text-xs font-semibold px-4 py-2.5 rounded-xl border w-full transition-all cursor-pointer ${
                          listeningAnswers[q.id] === oidx
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button
                onClick={() => {
                  window.speechSynthesis.cancel();
                  setIsListeningAudioPlaying(false);
                  setStep(2);
                }}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all cursor-pointer"
              >
                Back
              </button>
              <div className="flex items-center gap-3">
                {Object.keys(listeningAnswers).length < LISTENING_QUESTIONS.length && (
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                    {Object.keys(listeningAnswers).length}/{LISTENING_QUESTIONS.length} answered
                  </span>
                )}
                <button
                  onClick={() => {
                    window.speechSynthesis.cancel();
                    setIsListeningAudioPlaying(false);
                    setStep(4);
                  }}
                  disabled={Object.keys(listeningAnswers).length < LISTENING_QUESTIONS.length}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold transition-all hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: WRITING ASSESSMENT */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-800">Writing Skills Evaluation</h2>
              <p className="text-xs text-slate-500">Provide a short written paragraph responding to the prompt below.</p>
            </div>

            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
              <h3 className="font-extrabold text-slate-800 text-sm mb-1.5">📝 Writing Prompt</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Describe a challenge you faced at work or school, how you overcame it, and what you learned from the experience. Write at least 30-50 words.
              </p>
            </div>

            <div className="space-y-1">
              <textarea
                value={writingText}
                onChange={(e) => setWritingText(e.target.value)}
                placeholder="Type your response here..."
                rows={5}
                className="w-full text-sm p-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold px-1">
                <span>Min: 30 words recommended</span>
                <span>Word Count: {writingText.trim() === '' ? 0 : writingText.trim().split(/\s+/).length}</span>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => setStep(5)}
                disabled={writingText.trim().split(/\s+/).filter(Boolean).length < 15}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold transition-all hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: SPEAKING SKILLS */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-800">Speaking & Pronunciation</h2>
              <p className="text-xs text-slate-500">Record yourself reading the paragraph out loud to measure speech parameters.</p>
            </div>

            <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl leading-relaxed text-xs border border-slate-800 italic shadow-inner">
              "Continuous learning is the key to personal and professional growth. Every day presents an opportunity to acquire new knowledge, refine skills, and expand perspectives. By embracing challenges as learning opportunities, we can adapt to a rapidly changing world and achieve our highest potential."
            </div>

            {/* Self-contained assessment recorder */}
            <AssessmentVoiceRecorder onAudioReady={(blob) => setAudioBlob(blob)} />

            {error && (
              <div className="p-3 bg-red-50 text-red-500 text-xs rounded-xl flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-4 flex justify-between items-center">
              <button
                onClick={() => setStep(4)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleSubmitWithConfirm}
                className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold transition-all hover:bg-indigo-700 cursor-pointer shadow-lg shadow-indigo-600/10 flex items-center gap-1.5"
              >
                Submit Assessment <CheckCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: SUBMITTING / AI EVALUATION LOAD SCREEN */}
        {step === 6 && (
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <Sparkles className="w-8 h-8 text-indigo-500 absolute inset-0 m-auto animate-pulse" />
            </div>
            
            <div className="text-center space-y-2 max-w-sm">
              <h3 className="text-lg font-black text-slate-800">Analyzing Performance Metrics...</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our AI language model is evaluating grammatical syntax, vocabulary variety, writing structure, and audio coherence to assign your CEFR starting baseline levels.
              </p>
            </div>
          </div>
        )}

        {/* STEP 7: COMPLETED REPORT / RESULTS DASHBOARD */}
        {step === 7 && result && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-500/20 mb-4 animate-scale-up">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">Assessment Complete!</h2>
              <p className="text-slate-500 text-xs mt-1">Your baseline levels have been computed successfully.</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/50">
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-3 mb-4">
                <span className="text-xs text-slate-500 font-bold">CEFR MEASURED LEVEL</span>
                <span className="text-indigo-600 text-xl font-black">{result.overallLevel || result.level || 'Intermediate'}</span>
              </div>

              {/* Skills breakdown */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Grammar', value: result.grammar?.score ?? 50, lvl: result.grammar?.level ?? 'A2' },
                  { name: 'Vocabulary', value: result.vocabulary?.score ?? 50, lvl: result.vocabulary?.level ?? 'A2' },
                  { name: 'Reading', value: result.reading?.score ?? 50, lvl: result.reading?.level ?? 'A2' },
                  { name: 'Listening', value: result.listening?.score ?? 50, lvl: result.listening?.level ?? 'A2' },
                  { name: 'Writing', value: result.writing?.score ?? 50, lvl: result.writing?.level ?? 'A2' },
                  { name: 'Speaking', value: result.speaking?.score ?? 50, lvl: result.speaking?.level ?? 'A2' },
                  { name: 'Fluency', value: result.fluency?.score ?? 50, lvl: result.fluency?.level ?? 'A2' },
                ].map((s) => (
                  <div key={s.name} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                      <span>{s.name}</span>
                      <span className="text-indigo-600">{s.lvl} ({s.value}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${s.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/60">
                <h4 className="text-xs font-black text-emerald-800 flex items-center gap-1.5 mb-2">
                  <Check className="w-3.5 h-3.5" /> Core Strengths
                </h4>
                <ul className="text-[11px] text-emerald-700 space-y-1 font-semibold">
                  {result.strengths && result.strengths.length > 0 ? (
                    result.strengths.map((str: string, idx: number) => <li key={idx}>• {str}</li>)
                  ) : (
                    <li>• Good vocabulary range</li>
                  )}
                </ul>
              </div>

              <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/60">
                <h4 className="text-xs font-black text-rose-800 flex items-center gap-1.5 mb-2">
                  <Zap className="w-3.5 h-3.5" /> Weaknesses
                </h4>
                <ul className="text-[11px] text-rose-700 space-y-1 font-semibold">
                  {result.weaknesses && result.weaknesses.length > 0 ? (
                    result.weaknesses.map((w: string, idx: number) => <li key={idx}>• {w}</li>)
                  ) : (
                    <li>• Pronunciation clarity</li>
                  )}
                </ul>
              </div>
            </div>

            {/* CTA — branch on whether onboarding is still needed */}
            {result.nextStep === 'COMPLETE_ONBOARDING' ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-amber-800">Your baseline assessment has been saved successfully.</p>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      Please complete your onboarding to create your learner profile and continue to your personalized 8-week study plan. Your assessment results will be preserved exactly as measured — you will not need to repeat the assessment.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/learning-onboarding')}
                  className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 transition-all cursor-pointer text-center inline-flex items-center justify-center gap-2"
                >
                  Complete Onboarding <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/study-plan')}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 transition-all cursor-pointer text-center inline-flex items-center justify-center gap-2"
              >
                Go to my AI Study Plan <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
