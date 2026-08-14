import React, { useState } from 'react';
import { useStudyPlan } from '../hooks/useStudyPlan';
import { useQuery } from '@tanstack/react-query';
import { learningProfileApi } from '../api/learning-profile.api';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Flame,
  Award,
  Zap,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  MessageSquare,
  Volume2,
  Compass,
  FileText,
  AlertCircle,
  Clock,
  Briefcase,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';

export const StudyPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    dashboardData,
    isLoadingDashboard,
    generatePlan,
    isGeneratingPlan,
    completeDay,
    isCompletingDay,
    startLesson,
    isStartingLesson,
    refetchDashboard
  } = useStudyPlan();

  // Fetch Onboarding Profile
  const { data: profileRes, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['learningProfile'],
    queryFn: learningProfileApi.getProfile
  });


  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({ 1: true });
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [startingDayId, setStartingDayId] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  if (isLoadingDashboard || isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading your personalized study plan...</p>
      </div>
    );
  }

  // Empty State - No Profile
  const profile = profileRes?.profile;
  if (!profile || !profile.onboardingCompleted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto shadow-md">
          <Layers className="w-10 h-10" />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Generate Your AI Study Plan</h2>
          <p className="text-slate-600 text-base max-w-md mx-auto">
            Complete your learning profile to generate a structured 8-week English curriculum tailored to your goals.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => navigate('/profile')}
          className="font-bold shadow-lg shadow-indigo-500/20"
          rightIcon={<ArrowRight className="w-5 h-5" />}
        >
          Complete Profile
        </Button>
      </div>
    );
  }

  const studyPlan = dashboardData?.studyPlan;

  // Empty State - Plan is generating or Baseline Assessment is pending
  if (!studyPlan) {
    const hasPendingAssessment = profile?.baselineSkills?.completed !== true;

    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        {hasPendingAssessment ? (
          <>
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto shadow-md">
              <Sparkles className="w-10 h-10 text-indigo-600 animate-pulse" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Complete Baseline Assessment</h2>
              <p className="text-slate-600 text-base max-w-md mx-auto">
                Before generating your personalized 8-week study plan, please complete the AI baseline language assessment to measure your actual proficiency.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => navigate('/baseline-assessment')}
              className="font-bold shadow-lg shadow-indigo-500/20"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Start AI Assessment
            </Button>
          </>
        ) : (
          dashboardData?.planGenerationStatus === 'failed' ? (
            <>
              <div className="p-4 bg-rose-50 text-rose-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto shadow-md">
                <AlertCircle className="w-10 h-10" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-slate-800">We couldn't generate your study plan right now.</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                  Your assessment and learner profile are safe.
                </p>
                {dashboardData?.planGenerationError && (
                  <p className="text-xs text-rose-500 font-mono mt-1">
                    {dashboardData.planGenerationError}
                  </p>
                )}
              </div>
              <Button
                size="md"
                onClick={async () => {
                  try {
                    await generatePlan();
                    refetchDashboard();
                  } catch (err) {
                    console.error('Retry generation failed:', err);
                  }
                }}
                isLoading={isGeneratingPlan}
                disabled={isGeneratingPlan}
              >
                Retry Generation
              </Button>
            </>
          ) : (
            <>
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto animate-pulse">
                <RefreshCw className="w-10 h-10 animate-spin" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-slate-800">Generating your personalized 8-week study plan...</h2>
                <p className="text-slate-500 max-w-sm mx-auto">Please wait while we orchestrate your custom roadmap.</p>
              </div>
              <Button
                size="md"
                variant="secondary"
                onClick={async () => {
                  try {
                    await generatePlan();
                    refetchDashboard();
                  } catch (err) {
                    console.error('Force generation failed:', err);
                  }
                }}
                isLoading={isGeneratingPlan}
                disabled={isGeneratingPlan}
              >
                Generate Study Plan
              </Button>
            </>
          )
        )}
      </div>
    );
  }

  const learningProgress = dashboardData?.learningProgress || {
    lessonsCompleted: 0,
    conversationsCompleted: 0,
    vocabularyLearned: 0,
    grammarTopicsCompleted: 0,
    listeningSessions: 0,
    pronunciationSessions: 0,
    quizzesCompleted: 0,
    studyMinutes: 0,
    streak: 0,
    completionPercentage: 0,
    currentLevel: 'BEGINNER'
  };

  const days = studyPlan.days || [];
  const completedDays = days.filter((d: any) => d.status === 'COMPLETED');
  const completedDaysCount = completedDays.length;

  const activeDay = days.find((d: any) => d.status === 'AVAILABLE');

  // Helper to expand weeks
  const toggleWeek = (weekNum: number) => {
    setExpandedWeeks((prev) => ({ ...prev, [weekNum]: !prev[weekNum] }));
  };

  const toggleDay = (dayId: string) => {
    setExpandedDays((prev) => ({ ...prev, [dayId]: !prev[dayId] }));
  };

  const handleRegenerate = async () => {
    try {
      await generatePlan();
      setShowRegenerateModal(false);
      refetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  // Group Days into Weeks dynamically based on study plan days length (usually 56 days / 8 weeks)
  const totalWeeksCount = Math.max(8, Math.ceil(days.length / 7));
  const weeksData: Record<number, any[]> = {};
  for (let w = 1; w <= totalWeeksCount; w++) {
    weeksData[w] = [];
  }
  days.forEach((day: any) => {
    const weekNum = Math.ceil(day.dayNumber / 7);
    if (weekNum >= 1 && weekNum <= totalWeeksCount) {
      weeksData[weekNum].push(day);
    }
  });

  // Calculate Week Status
  const getWeekStatus = (weekNum: number) => {
    const weekDays = weeksData[weekNum] || [];
    if (weekDays.every((d) => d.status === 'COMPLETED')) return 'COMPLETED';
    if (weekDays.some((d) => d.status === 'AVAILABLE' || d.status === 'COMPLETED')) return 'CURRENT';
    return 'LOCKED';
  };

  // Navigate tasks to modules.
  // On success: navigate to /conversation with full lesson context as URL params.
  // On failure: show inline error, do NOT navigate (progress must not change).
  const handleTaskStart = async (
    taskType: string,
    dayId: string,
    isTaskComplete: boolean,
    taskName?: string,
    day?: any
  ) => {
    if (startingDayId) return; // prevent concurrent starts
    setStartingDayId(dayId);
    setStartError(null);
    try {
      const result = await startLesson(dayId);
      const sessionId = result?.conversationSession?.id;
      if (!sessionId) {
        throw new Error('No session was created by the server.');
      }
      // Build URL with lesson context so ConversationPage can display a header.
      const params = new URLSearchParams({
        sessionId,
        dayId,
        ...(taskName ? { taskName } : {}),
        ...(taskType ? { taskType } : {}),
        ...(day?.dayNumber != null ? { dayNumber: String(day.dayNumber) } : {}),
        ...(day?.title ? { dayTitle: day.title } : {}),
        ...(day?.lessonContent ? { lessonContent: day.lessonContent } : {}),
        ...(day ? { weekNumber: String(Math.ceil(day.dayNumber / 7)) } : {}),
      });
      navigate(`/conversation?${params.toString()}`);
    } catch (err: any) {
      console.error('Failed to start lesson:', err);
      const message =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to start lesson. Please try again.';
      setStartError(message);
    } finally {
      setStartingDayId(null);
    }
  };

  // Dynamic Skill progress breakdown using real backend values
  const skillsList = [
    { name: 'Vocabulary', score: Math.min(100, Math.round((learningProgress.vocabularyLearned / 50) * 100)), color: 'bg-amber-500' },
    { name: 'Grammar', score: Math.min(100, Math.round((learningProgress.grammarTopicsCompleted / 5) * 100)), color: 'bg-emerald-500' },
    { name: 'Speaking', score: Math.min(100, Math.round((learningProgress.conversationsCompleted / 10) * 100)), color: 'bg-indigo-500' },
    { name: 'Listening', score: Math.min(100, Math.round((learningProgress.listeningSessions / 5) * 100)), color: 'bg-purple-500' },
    { name: 'Pronunciation', score: Math.min(100, Math.round((learningProgress.pronunciationSessions / 5) * 100)), color: 'bg-blue-500' },
    { name: 'Reading', score: Math.min(100, Math.round((learningProgress.lessonsCompleted / 10) * 100)), color: 'bg-rose-500' },
    { name: 'Writing', score: Math.min(100, Math.round((learningProgress.quizzesCompleted / 5) * 100)), color: 'bg-sky-500' }
  ];

  // Milestones grouped by week
  const milestones: Record<number, string[]> = {
    1: ['Greeting Conversations', 'Basic Vocabulary', 'Simple Grammar'],
    2: ['Business Meetings', 'Email Writing', 'Listening Practice'],
    3: ['Presentation Skills', 'Negotiation Dialogues', 'Client Call practice'],
    4: ['Complex Tenses', 'Fluency Building', 'Comprehensive Review'],
    5: ['Advanced Vocabulary', 'Colloquial Expressions', 'Persuasive Speech'],
    6: ['Cross-Cultural Idioms', 'Conflict Resolution', 'Active Listening'],
    7: ['Public Speaking', 'Summarizing Tech Reports', 'Debate Techniques'],
    8: ['Mastery Evaluation', 'Confidence Consolidation', 'AI Graduation Dialect']
  };

  // Estimated completion date computation based on plan length
  const startDate = studyPlan.createdAt ? new Date(studyPlan.createdAt) : new Date();
  const totalDays = days.length || 56;
  const completionDate = new Date(startDate.getTime() + totalDays * 24 * 60 * 60 * 1000);
  const formattedCompletionDate = completionDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Inline error banner shown when lesson start fails */}
      {startError && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span className="flex-1">{startError}</span>
          <button
            onClick={() => setStartError(null)}
            className="text-rose-400 hover:text-rose-600 font-bold text-xs px-2"
          >
            Dismiss
          </button>
        </div>
      )}
      {/* ================= HERO SECTION ================= */}
      <div className="gradient-bg rounded-[32px] p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold border border-white/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Curriculum Engine Active</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">My AI Study Plan</h1>
          <p className="text-indigo-100 text-sm sm:text-base max-w-xl">
            Personalized by AI using your goals, occupation, English level, native language and interests.
          </p>

          {/* Chips containing learner profile */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-extrabold text-white">
              💼 {profile.occupation || 'Learner'}
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-extrabold text-white">
              📊 Level: {profile.englishLevel}
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-extrabold text-white">
              🗣️ Native: {profile.nativeLanguage}
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-extrabold text-white">
              🎯 Goals: {profile.goals?.slice(0, 2).join(', ')}
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-extrabold text-white">
              🌟 Interests: {profile.interests?.slice(0, 2).join(', ')}
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-extrabold text-white">
              ⏱️ {profile.dailyGoal} min/day
            </span>
          </div>
        </div>
      </div>

      {/* ================= DUAL COLUMN GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Roadmap Details & Expandable Weeks */}
        <div className="lg:col-span-8 space-y-8">

          {/* Section 2: Roadmap Summary Card */}
          <Card variant="glass" className="p-6 sm:p-8 rounded-[24px] border border-white/90 shadow-xl space-y-6">
            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600" />
              Your Personalized Roadmap
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-wide">Occupation</span>
                <span className="text-slate-700 font-black">{profile.occupation || 'General'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-wide">Learning Goal</span>
                <span className="text-slate-700 font-black">{profile.goals?.[0] || 'Fluency'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-wide">Native Language</span>
                <span className="text-slate-700 font-black">{profile.nativeLanguage}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-wide">English Level</span>
                <span className="text-slate-700 font-black">{profile.englishLevel}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-wide">Daily Goal</span>
                <span className="text-slate-700 font-black">{profile.dailyGoal} Minutes</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-wide">Study Duration</span>
                <span className="text-slate-700 font-black">{totalWeeksCount} Weeks</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block uppercase tracking-wide">Estimated Completion</span>
                <span className="text-slate-700 font-black">{formattedCompletionDate}</span>
              </div>
            </div>
          </Card>

          {/* Section 4: Expandable Weekly Timeline */}
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Weekly Curriculum Timeline</h2>
            
            <div className="space-y-4">
              {(() => {
                const parsedWeeksMetadata = studyPlan.weeksMetadata ? JSON.parse(studyPlan.weeksMetadata) : null;

                return Array.from({ length: totalWeeksCount }, (_, i) => i + 1).map((weekNum) => {
                  const weekStatus = getWeekStatus(weekNum);
                  const isExpanded = !!expandedWeeks[weekNum];
                  const weekDays = weeksData[weekNum] || [];

                  // Calculate week progress
                  const completedWeekDays = weekDays.filter((d) => d.status === 'COMPLETED').length;
                  const weekProgressPct = Math.round((completedWeekDays / 7) * 100);

                  const weekMeta = parsedWeeksMetadata ? parsedWeeksMetadata.find((wm: any) => wm.weekNumber === weekNum) : null;
                  const weekTitle = weekMeta ? weekMeta.title : `Week ${weekNum} Core Study`;
                  const weekDesc = weekMeta ? weekMeta.description : 'Focus on theme topics and vocabulary consolidation.';
                  const weekSkills = weekMeta ? weekMeta.focusSkills : [];
                  const weekObjectives = weekMeta ? weekMeta.objectives : [];

                  const getObjectiveMastery = (obj: any) => {
                    const masteries = (studyPlan as any).objectiveMasteries;
                    if (!masteries?.length) return null;
                    return masteries.find((m: any) => {
                      const matchId = m.objective?.toLowerCase() === obj.id?.toLowerCase();
                      const matchDesc = m.objective?.toLowerCase() === obj.description?.toLowerCase();
                      return matchId || matchDesc;
                    });
                  };

                  return (
                    <div
                      key={weekNum}
                      className={`glass-card rounded-[24px] border overflow-hidden transition-all ${
                        weekStatus === 'LOCKED' ? 'opacity-80 border-slate-200/50' :
                        weekStatus === 'CURRENT' ? 'border-indigo-200 shadow-md shadow-indigo-100/50' :
                        'border-emerald-100'
                      }`}
                    >
                      {/* Header bar */}
                      <div
                        onClick={() => weekStatus !== 'LOCKED' && toggleWeek(weekNum)}
                        className={`p-5 flex items-center justify-between cursor-pointer select-none ${
                          weekStatus === 'LOCKED' ? 'bg-slate-50/50 cursor-not-allowed' : 'hover:bg-slate-50/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Status Icon */}
                          {weekStatus === 'COMPLETED' ? (
                            <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-full">
                              <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-white" />
                            </div>
                          ) : weekStatus === 'CURRENT' ? (
                            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-full animate-pulse">
                              <Compass className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="p-1.5 bg-slate-100 text-slate-400 rounded-full">
                              <Lock className="w-5 h-5" />
                            </div>
                          )}

                          <div className="space-y-0.5">
                            <h3 className="font-extrabold text-slate-700 text-base">
                              Week {weekNum}: {weekTitle}
                            </h3>
                            <p className="text-slate-400 text-xs font-medium">
                              {weekDesc}
                            </p>
                            {weekSkills && weekSkills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {weekSkills.map((sk: string) => (
                                  <span key={sk} className="text-[9px] font-black px-2 py-0.5 rounded bg-indigo-50/80 text-indigo-600 uppercase tracking-wide">
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {weekStatus !== 'LOCKED' ? (
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                              weekStatus === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                            }`}>
                              {weekProgressPct}% Progress
                            </span>
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                            Locked <Lock className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      {/* Expand week content */}
                      {isExpanded && weekStatus !== 'LOCKED' && (
                        <div className="border-t border-slate-100/50 p-5 space-y-4 bg-white/20">
                          {/* Weekly Objectives Section */}
                          {weekObjectives && weekObjectives.length > 0 && (
                            <div className="bg-indigo-50/40 rounded-2xl p-4 border border-indigo-100/50 space-y-3">
                              <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                Weekly Learning Objectives
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {weekObjectives.map((obj: any) => {
                                  const mastery = getObjectiveMastery(obj);
                                  const score = mastery ? Math.round(mastery.masteryScore) : 0;
                                  // Use server-derived masteryStatus — computed against the central threshold (70)
                                  const masteryStatus = mastery?.masteryStatus ?? 'NOT_STARTED';
                                  const isMastered = masteryStatus === 'MASTERED';
                                  const isProficient = masteryStatus === 'PROFICIENT';
                                  const hasStarted = masteryStatus !== 'NOT_STARTED';

                                  return (
                                    <div key={obj.id} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex flex-col justify-between space-y-2">
                                      <div className="space-y-1">
                                        <div className="flex justify-between items-start gap-2">
                                          <p className="text-xs font-extrabold text-slate-700 leading-snug">
                                            {obj.description}
                                          </p>
                                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                                            isMastered ? 'text-emerald-700 bg-emerald-50 border-emerald-100' :
                                            isProficient ? 'text-indigo-700 bg-indigo-50 border-indigo-100' :
                                            hasStarted ? 'text-amber-700 bg-amber-50 border-amber-100' :
                                            'text-slate-400 bg-slate-50 border-slate-200'
                                          }`}>
                                            {isMastered ? 'Mastered' : isProficient ? 'Proficient' : hasStarted ? 'Practicing' : 'Not Started'}
                                          </span>
                                        </div>
                                        {obj.successCriteria && obj.successCriteria.length > 0 && (
                                          <ul className="text-[10px] text-slate-400 font-medium space-y-0.5 list-disc pl-3">
                                            {obj.successCriteria.map((crit: string, cIdx: number) => (
                                              <li key={cIdx}>{crit}</li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                      {hasStarted && (
                                        <div className="space-y-1">
                                          <div className="flex justify-between text-[9px] font-bold text-slate-400">
                                            <span>Mastery Score</span>
                                            <span className="font-extrabold text-indigo-600">{score}%</span>
                                          </div>
                                          <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                                            <div
                                              className={`h-full rounded-full transition-all duration-300 ${
                                                isMastered ? 'bg-emerald-500' : 'bg-indigo-500'
                                              }`}
                                              style={{ width: `${score}%` }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        {weekDays.map((day: any) => {
                          const isDayExpanded = !!expandedDays[day.id];
                          
                          // Custom tasks configuration based on day lessonType
                          const estimatedMinutes = day.estimatedMinutes;
                          const tasksList = [];
                          if (day.lessonType === 'Vocabulary') {
                            tasksList.push({ name: 'Vocabulary study', minutes: Math.round(estimatedMinutes * 0.6), type: 'Vocabulary' });
                            tasksList.push({ name: 'Accent pronunciation', minutes: Math.round(estimatedMinutes * 0.4), type: 'Pronunciation' });
                          } else if (day.lessonType === 'Grammar') {
                            tasksList.push({ name: 'Grammar rule comprehension', minutes: Math.round(estimatedMinutes * 0.5), type: 'Grammar' });
                            tasksList.push({ name: 'Listening dialogue exercises', minutes: Math.round(estimatedMinutes * 0.3), type: 'Listening' });
                            tasksList.push({ name: 'Topic assessment', minutes: Math.round(estimatedMinutes * 0.2), type: 'Quiz' });
                          } else {
                            tasksList.push({ name: 'AI dialogue flows', minutes: Math.round(estimatedMinutes * 0.7), type: 'Conversation' });
                            tasksList.push({ name: 'Phrase logs review', minutes: Math.round(estimatedMinutes * 0.3), type: 'Vocabulary' });
                          }

                          return (
                            <div
                              key={day.id}
                              className={`border rounded-2xl overflow-hidden transition-all ${
                                day.status === 'COMPLETED' ? 'border-emerald-100/60 bg-emerald-50/5' :
                                day.status === 'AVAILABLE' ? 'border-indigo-100 bg-indigo-50/5 shadow-sm' :
                                'border-slate-100 opacity-60 bg-slate-50/20'
                              }`}
                            >
                              <div
                                onClick={() => day.status !== 'LOCKED' && toggleDay(day.id)}
                                className={`p-4 flex items-center justify-between cursor-pointer select-none ${
                                  day.status === 'LOCKED' ? 'cursor-not-allowed' : 'hover:bg-slate-50/30'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {day.status === 'COMPLETED' ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                                  ) : day.status === 'AVAILABLE' ? (
                                    <Compass className="w-5 h-5 text-indigo-500 animate-spin-slow" />
                                  ) : (
                                    <Lock className="w-4 h-4 text-slate-400" />
                                  )}
                                  <div>
                                    <h4 className="font-extrabold text-slate-700 text-sm">
                                      Day {day.dayNumber}: {day.title}
                                    </h4>
                                    <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block mt-0.5">
                                      {day.lessonType} • {day.estimatedMinutes} Mins
                                    </span>
                                  </div>
                                </div>

                                {day.status !== 'LOCKED' && (
                                  <div>
                                    {isDayExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                  </div>
                                )}
                              </div>

                              {/* Expand day details: today's study tasks */}
                              {isDayExpanded && day.status !== 'LOCKED' && (
                                <div className="p-4 bg-slate-50/50 border-t border-slate-100/50 space-y-3">
                                  <p className="text-slate-500 text-xs font-semibold italic">{day.lessonContent}</p>
                                  
                                  <div className="space-y-2.5 pt-2">
                                    {tasksList.map((task, tidx) => {
                                      const isTaskCompleted = day.status === 'COMPLETED';
                                      const isTaskInProgress = day.status === 'IN_PROGRESS' || day.hasActiveSession;
                                      return (
                                        <div key={tidx} className="p-3 bg-white rounded-xl border border-slate-200/50 flex justify-between items-center shadow-xs">
                                          <div className="flex items-center gap-2">
                                            {task.type === 'Vocabulary' ? <BookOpen className="w-4 h-4 text-amber-500" /> :
                                             task.type === 'Grammar' ? <FileText className="w-4 h-4 text-emerald-500" /> :
                                             task.type === 'Conversation' ? <MessageSquare className="w-4 h-4 text-indigo-500" /> :
                                             <Volume2 className="w-4 h-4 text-sky-500" />}
                                            <div>
                                              <span className="text-xs font-extrabold text-slate-700 block leading-tight">{task.name}</span>
                                              <span className="text-[9px] text-slate-400 font-semibold">{task.minutes} Mins • Intermediate</span>
                                            </div>
                                          </div>
                                          
                                          <Button
                                            size="sm"
                                            variant={isTaskCompleted ? 'secondary' : 'primary'}
                                            isLoading={startingDayId === day.id}
                                            disabled={!!startingDayId}
                                            onClick={() => handleTaskStart(task.type, day.id, isTaskCompleted, task.name, day)}
                                            className="text-[10px] py-1 px-3.5 font-bold flex items-center gap-1"
                                          >
                                            {isTaskCompleted ? (
                                              <>Review <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /></>
                                            ) : isTaskInProgress ? (
                                              <>Resume <ArrowRight className="w-3.5 h-3.5" /></>
                                            ) : (
                                              <>Start <ArrowRight className="w-3.5 h-3.5" /></>
                                            )}
                                          </Button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>


        {/* RIGHT COLUMN: Progress Overview, Milestones, Skills, Insights */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Section 3: Overall Progress Card */}
          <Card variant="glass" className="p-6 rounded-[24px] space-y-5 border border-white/90 shadow-xl">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Overall Progress</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400">Study Plan Completion</span>
                <span className="text-indigo-600 font-black">{Math.round(learningProgress.completionPercentage)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 p-0.5 border border-slate-200/50">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${learningProgress.completionPercentage}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Completed Lessons</span>
                <span className="text-sm font-black text-slate-700">{completedDaysCount} Days</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Completed Weeks</span>
                <span className="text-sm font-black text-slate-700">{Math.floor(completedDaysCount / 7)} Weeks</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Remaining Days</span>
                <span className="text-sm font-black text-slate-700">{Math.max(0, 28 - completedDaysCount)} Days</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Current Week</span>
                <span className="text-sm font-black text-slate-700">Week {Math.min(4, Math.floor(completedDaysCount / 7) + 1)}</span>
              </div>
            </div>

            {/* Continue Learning CTA */}
            <div className="pt-2">
              {activeDay ? (
                <Button
                  size="md"
                  isLoading={startingDayId === activeDay.id}
                  disabled={!!startingDayId}
                  onClick={() => handleTaskStart(activeDay.lessonType, activeDay.id, false, activeDay.title, activeDay)}
                  className="w-full font-black text-xs"
                >
                  Continue Today's Lesson
                </Button>
              ) : (
                <Button
                  size="md"
                  variant="secondary"
                  onClick={() => navigate('/conversation')}
                  className="w-full font-black text-xs"
                >
                  Start Tomorrow's Lesson
                </Button>
              )}
            </div>
          </Card>

          {/* Section 7: Skills Progress Card */}
          <Card variant="glass" className="p-6 rounded-[24px] space-y-5 border border-white/90 shadow-xl">
            <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Skills Progress
            </h3>

            <div className="space-y-4">
              {skillsList.map((skill, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>{skill.name}</span>
                    <span className="text-indigo-600">{skill.score}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                    <div
                      className={`h-full ${skill.color} rounded-full transition-all duration-700`}
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Section 8: Weekly Milestones */}
          <Card variant="glass" className="p-6 rounded-[24px] space-y-5 border border-white/90 shadow-xl">
            <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Weekly Milestones
            </h3>

            <div className="space-y-4">
              {Array.from({ length: totalWeeksCount }, (_, i) => i + 1).map((wNum) => {
                const wStatus = getWeekStatus(wNum);
                return (
                  <div key={wNum} className="space-y-2">
                    <div className="flex items-center gap-2">
                      {wStatus === 'COMPLETED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="text-xs font-black text-slate-700">Week {wNum} Milestones</span>
                    </div>
                    <ul className="pl-6 space-y-1 text-slate-500 text-xs">
                      {milestones[wNum].map((mStr, idx) => (
                        <li key={idx} className="list-disc leading-relaxed">{mStr}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Section 9: AI Insights */}
          {dashboardData.recommendations && dashboardData.recommendations[0] && (
            <Card variant="glass" className="p-6 rounded-[24px] space-y-4 bg-amber-50/15 border border-amber-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-slate-800 leading-tight">AI Insights</h3>
              </div>
              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
                <p className="font-extrabold text-slate-800">{dashboardData.recommendations[0].focus}</p>
                <p>{dashboardData.recommendations[0].reason}</p>
                
                <div className="pt-2 border-t border-slate-200/50 flex flex-wrap gap-1">
                  {dashboardData.recommendations[0].vocabulary?.map((word: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-amber-50 border border-amber-100 text-[10px] font-bold text-amber-800 rounded-lg">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Section 11: Regenerate Study Plan */}
          <div className="pt-4">
            <Button
              size="md"
              variant="outline"
              onClick={() => setShowRegenerateModal(true)}
              className="w-full font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50/50"
              leftIcon={<RefreshCw className="w-4 h-4 animate-spin-slow" />}
            >
              Regenerate Study Plan
            </Button>
          </div>

        </div>

      </div>

      {/* CONFIRMATION REGENERATE MODAL */}
      {showRegenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-fadeIn">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-full shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-black text-slate-900 text-lg leading-tight">Generate a new AI study plan?</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Completed lessons and progress logs will be preserved. Our AI mentor will rebuild a custom roadmap using your updated goals and level.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowRegenerateModal(false)}
                className="font-bold text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleRegenerate}
                isLoading={isGeneratingPlan}
                className="font-bold text-xs shadow-lg shadow-indigo-500/10"
              >
                Generate
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
