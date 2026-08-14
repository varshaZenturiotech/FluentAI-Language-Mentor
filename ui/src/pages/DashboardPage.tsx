import React, { useState } from 'react';
import { useStudyPlan } from '../hooks/useStudyPlan';
import { useAppSelector } from '../store';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame,
  Sparkles,
  Target,
  ArrowRight,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  Lock,
  Clock,
  RefreshCw,
  Play,
  Lightbulb,
  Award,
  BookMarked,
  Activity,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  User,
  GraduationCap
} from 'lucide-react';
import { Button } from '../components/common/Button';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  
  const {
    dashboardData,
    isLoadingDashboard,
    generatePlan,
    isGeneratingPlan,
    completeDay,
    isCompletingDay,
    refetchDashboard
  } = useStudyPlan();

  const [activeTab, setActiveTab] = useState<'minutes' | 'xp' | 'lessons' | 'conversations'>('minutes');

  if (isLoadingDashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Personalizing your learning environment...</p>
      </div>
    );
  }

  // 1. Check Onboarding Completion
  if (!dashboardData || dashboardData.onboardingCompleted === false) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto shadow-md">
          <GraduationCap className="w-10 h-10" />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Complete Your Learning Profile</h2>
          <p className="text-slate-600 text-base max-w-md mx-auto">
            Before we can generate your personalized study plan, please tell us a bit about your goals, native language, and interests.
          </p>
        </div>
        <Link to="/profile">
          <Button size="lg" className="font-bold shadow-lg shadow-indigo-500/20" rightIcon={<ArrowRight className="w-5 h-5" />}>
            Start Learning Onboarding
          </Button>
        </Link>
      </div>
    );
  }

  // 2. Check Study Plan Existence
  if (!dashboardData.studyPlan) {
    if (dashboardData.planGenerationStatus === 'failed') {
      return (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto shadow-md">
            <AlertCircle className="w-10 h-10" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-800">We couldn't generate your study plan right now.</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Your learner profile and baseline assessment are still saved.
            </p>
            {dashboardData.planGenerationError && (
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
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto animate-pulse">
          <RefreshCw className="w-10 h-10 animate-spin" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-800">Generating your personalized 8-week study plan...</h2>
          <p className="text-slate-500 max-w-sm mx-auto">
            Our AI mentor is orchestrating your custom 8-week learning roadmap. This will only take a moment.
          </p>
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
          Force Generate Now
        </Button>
      </div>
    );
  }

  const {
    greeting,
    studyPlan,
    todayPlan,
    weeklyActivity,
    learningProgress,
    xp,
    streak,
    recommendedLessons,
    recentMistakes,
    recommendations
  } = dashboardData;

  const currentAvailableDay = studyPlan?.days?.find((d: any) => d.status === 'AVAILABLE');

  // "Continue Week X" and task-card clicks both navigate to the Study Plan
  // page, where the user clicks the explicit Start button. The lesson-session
  // initiation (POST /study-plan/day/:id/start) happens there — not here.
  const handleTaskClick = () => {
    navigate('/study-plan');
  };

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* ================= HERO GREETING SECTION ================= */}
      <div className="gradient-bg rounded-[32px] p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Greeting Column */}
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold border border-white/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Malayalam ➔ English Active Journey</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              {greeting?.text}
            </h1>
            <p className="text-indigo-100 text-sm sm:text-base max-w-xl">
              {greeting?.subtext}
            </p>

            {/* Metrics pills in Hero */}
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="bg-white/15 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-center">
                <span className="text-[10px] text-indigo-200 font-bold block uppercase">Today's Goal</span>
                <span className="text-base font-extrabold">{greeting?.todayGoalMinutes} mins</span>
              </div>
              <div className="bg-white/15 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-center">
                <span className="text-[10px] text-indigo-200 font-bold block uppercase">Streak</span>
                <span className="text-base font-extrabold">{streak?.streak} Days</span>
              </div>
              <div className="bg-white/15 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-center">
                <span className="text-[10px] text-indigo-200 font-bold block uppercase">Progress</span>
                <span className="text-base font-extrabold">{greeting?.completionPercentage}%</span>
              </div>
            </div>
          </div>

          {/* Continue Action Column */}
          <div className="lg:col-span-4 flex justify-start lg:justify-end">
            {currentAvailableDay ? (
              <Button
                size="lg"
                variant="glass"
                className="w-full sm:w-auto font-black text-indigo-950 shadow-md py-4 px-8 text-base"
                onClick={() => handleTaskClick()}
                rightIcon={<ArrowRight className="w-5 h-5 text-indigo-700" />}
              >
                Continue Week {greeting?.currentWeek}
              </Button>
            ) : (
              <Button
                size="lg"
                variant="glass"
                className="w-full sm:w-auto font-black text-indigo-950 shadow-md py-4 px-8 text-base"
                onClick={() => navigate('/study-plan')}
                rightIcon={<ArrowRight className="w-5 h-5 text-indigo-700" />}
              >
                Start Practice Review
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ================= MAIN CONTENT GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Activities, Recommended, and Mistakes */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Quick Practice (Today's Plan) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Today's Study Plan</h2>
                <p className="text-slate-400 text-xs">Complete these exercises to reach your daily goal</p>
              </div>
              {!currentAvailableDay && (
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white" />
                  All Done!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayPlan.map((task: any, index: number) => {
                const isPlanComplete = !currentAvailableDay;
                return (
                  <div
                    key={task.id || index}
                    onClick={() => handleTaskClick()}
                    className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between space-y-4 cursor-pointer relative overflow-hidden"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          task.lessonType === 'Vocabulary' ? 'bg-amber-50 text-amber-700' :
                          task.lessonType === 'Grammar' ? 'bg-emerald-50 text-emerald-700' :
                          task.lessonType === 'Conversation' ? 'bg-indigo-50 text-indigo-700' :
                          'bg-sky-50 text-sky-700'
                        }`}>
                          {task.lessonType}
                        </span>
                        <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{task.estimatedMinutes} min</span>
                        </div>
                      </div>
                      <h3 className="font-extrabold text-slate-700 text-base leading-tight line-clamp-2">
                        {task.title}
                      </h3>
                      {task.lessonContent && (
                        <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                          {task.lessonContent}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100/50">
                      <span className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                        {isPlanComplete ? 'Review Now' : 'Practice Now'} <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                      {isPlanComplete && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommended AI Lessons */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Recommended AI Lessons</h2>
              <p className="text-slate-400 text-xs">Curated automatically based on your occupation and goals</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedLessons.map((rec: any) => (
                <div
                  key={rec.id}
                  onClick={() => handleTaskClick()}
                  className="glass-card glass-card-hover rounded-2xl p-5 flex items-start gap-4 cursor-pointer"
                >
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    {rec.lessonType === 'Conversation' ? (
                      <MessageSquare className="w-6 h-6" />
                    ) : (
                      <BookOpen className="w-6 h-6" />
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600">{rec.lessonType}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{rec.estimatedMinutes} mins</span>
                    </div>
                    <h3 className="font-extrabold text-slate-700 text-sm">{rec.title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{rec.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review Recent Mistakes */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Review Recent Mistakes</h2>
              <p className="text-slate-400 text-xs">Targeted corrections detected during conversation practices</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Grammar Mistakes */}
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Grammar</span>
                  <AlertCircle className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="space-y-3 min-h-[140px] flex flex-col justify-between">
                  {recentMistakes.grammar?.slice(0, 2).map((item: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <p className="text-slate-700 font-extrabold text-xs">{item.topic}</p>
                      <p className="text-red-500 line-through text-[10px] leading-tight">{item.example}</p>
                      <p className="text-emerald-600 text-[10px] font-medium leading-tight">➔ {item.correction}</p>
                    </div>
                  ))}
                  <Button size="sm" variant="secondary" className="w-full text-xs font-bold mt-2" onClick={() => navigate('/study-plan')}>
                    Practice Now
                  </Button>
                </div>
              </div>

              {/* Vocabulary Gaps */}
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">Vocabulary</span>
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <div className="space-y-3 min-h-[140px] flex flex-col justify-between">
                  <div className="space-y-2">
                    {recentMistakes.vocabulary?.slice(0, 3).map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-slate-700 font-bold text-xs">{item.word}</span>
                          <span className="text-slate-400 text-[9px] block line-clamp-1">{item.meaning}</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold whitespace-nowrap">
                          Forgotten
                        </span>
                      </div>
                    ))}
                    {recentMistakes.vocabulary?.length === 0 && (
                      <p className="text-slate-400 text-xs italic">No vocabulary saved yet. Practice lessons to collect words.</p>
                    )}
                  </div>
                  <Button size="sm" variant="secondary" className="w-full text-xs font-bold mt-2" onClick={() => navigate('/study-plan')}>
                    Practice Again
                  </Button>
                </div>
              </div>

              {/* Pronunciation Mistakes */}
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">Pronunciation</span>
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="space-y-3 min-h-[140px] flex flex-col justify-between">
                  <div className="space-y-2.5">
                    {recentMistakes.pronunciation?.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-slate-700 font-extrabold text-xs">{item.word}</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 bg-slate-100 rounded-full h-1.5">
                            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${item.score}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">{item.score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" variant="secondary" className="w-full text-xs font-bold mt-2" onClick={() => navigate('/conversation')}>
                    Practice Speech
                  </Button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Progress Panel, AI Focus, and Weekly Activity */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Learning Progress Stats */}
          <div className="glass-card rounded-[24px] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Learning Progress</h3>
              <span className="text-xs font-extrabold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
                Level: {learningProgress?.currentLevel}
              </span>
            </div>

            {/* Overall Study Plan Completion */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400">Study Plan Completion</span>
                <span className="text-indigo-600 font-black">{Math.round(learningProgress?.completionPercentage || 0)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${learningProgress?.completionPercentage || 0}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl space-y-1.5 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Today's Tasks</span>
                <span className="text-lg font-black text-slate-700">
                  {currentAvailableDay ? '0 / 1' : '1 / 1'} Done
                </span>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-2xl space-y-1.5 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total study time</span>
                <span className="text-lg font-black text-slate-700">
                  {learningProgress?.studyMinutes || 0} mins
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl space-y-1.5 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Vocabulary</span>
                <span className="text-lg font-black text-slate-700">
                  {learningProgress?.vocabularyLearned || 0} words
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl space-y-1.5 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Grammar Topics</span>
                <span className="text-lg font-black text-slate-700">
                  {learningProgress?.grammarTopicsCompleted || 0} done
                </span>
              </div>
            </div>

            {/* XP progress details */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold">Total XP Gained:</span>
              <span className="text-slate-700 font-black flex items-center gap-1">
                <Award className="w-4 h-4 text-amber-500 fill-amber-300" />
                {xp?.totalXP} XP
              </span>
            </div>
          </div>

          {/* AI Recommendations Focus */}
          {recommendations && recommendations[0] && (
            <div className="glass-card rounded-[24px] p-6 space-y-5 bg-amber-50/15 border-amber-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 leading-tight">AI Recommendations</h3>
                  <p className="text-[10px] text-slate-400">Dynamic review focus based on logs</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">Today's Focus</span>
                  <p className="text-sm font-extrabold text-slate-800 leading-snug">{recommendations[0].focus}</p>
                  <p className="text-slate-600 text-xs leading-relaxed">{recommendations[0].reason}</p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">New Vocabulary</span>
                  <div className="flex flex-wrap gap-1.5">
                    {recommendations[0].vocabulary?.map((word: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 font-bold text-[10px]">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Weekly Activity Grid */}
          <div className="glass-card rounded-[24px] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Weekly Activity</h3>
                <p className="text-slate-400 text-xs">Real-time statistics across activities</p>
              </div>
              <Activity className="w-5 h-5 text-indigo-600" />
            </div>

            {/* Toggle view tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              {(['minutes', 'xp', 'lessons', 'conversations'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all ${
                    activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab === 'minutes' ? 'Min' : tab === 'xp' ? 'XP' : tab === 'lessons' ? 'Lsn' : 'Chat'}
                </button>
              ))}
            </div>

            {/* Visual Bar representation */}
            <div className="flex items-end justify-between gap-2 h-36 pt-4 px-2">
              {weekdays.map((dayName, idx) => {
                let value = 0;
                let max = 60; // default cap for minutes
                if (activeTab === 'minutes') {
                  value = weeklyActivity?.dailyMinutes[idx] || 0;
                } else if (activeTab === 'xp') {
                  value = weeklyActivity?.xpEarned[idx] || 0;
                  max = 600;
                } else if (activeTab === 'lessons') {
                  value = weeklyActivity?.lessonsCompleted[idx] || 0;
                  max = 5;
                } else {
                  value = weeklyActivity?.conversationsCompleted[idx] || 0;
                  max = 5;
                }

                const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);

                return (
                  <div key={idx} className="flex flex-col items-center flex-1 space-y-2 h-full justify-end group relative">
                    {/* Tooltip */}
                    <span className="absolute bottom-full mb-1 scale-0 group-hover:scale-100 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded transition-all font-bold whitespace-nowrap z-20">
                      {value} {activeTab === 'minutes' ? 'min' : activeTab === 'xp' ? 'XP' : activeTab === 'lessons' ? 'lessons' : 'chats'}
                    </span>
                    
                    {/* Bar */}
                    <div className="w-full bg-slate-100 rounded-lg h-full flex items-end">
                      <div
                        className="w-full bg-indigo-600 rounded-lg transition-all duration-300 hover:bg-indigo-700"
                        style={{ height: `${Math.max(8, pct)}%` }}
                      />
                    </div>

                    <span className="text-[10px] font-bold text-slate-400 uppercase">{dayName}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
