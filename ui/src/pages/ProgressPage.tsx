import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { learningApi } from '../api/learning.api';
import { Link } from 'react-router-dom';
import {
  Clock,
  ShieldCheck,
  BookOpen,
  Flame,
  Zap,
  Award,
  Sparkles,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Play,
  CheckCircle,
  HelpCircle,
  BarChart2,
  Calendar,
  Layers,
  Check
} from 'lucide-react';

export const ProgressPage: React.FC = () => {
  const [chartType, setChartType] = useState<
    'minutes' | 'xp' | 'lessons' | 'conversation' | 'vocabulary' | 'grammar'
  >('minutes');
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);

  // Fetch all real learning analytics from backend API
  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['learning-analytics'],
    queryFn: learningApi.getLearningAnalytics,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Compiling your real-time learning analytics...</p>
      </div>
    );
  }

  // Handle empty state if no activity has been completed yet
  if (!analytics || !analytics.hasActivity) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-8">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative bg-white border border-slate-200 p-8 rounded-full shadow-lg">
            <Sparkles className="w-16 h-16 text-indigo-600" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-slate-900">You haven't started your learning journey yet!</h2>
          <p className="text-slate-500 max-w-md mx-auto text-base font-medium">
            Complete your first voice lesson or AI conversation to begin tracking your grammar accuracy, pronunciation metrics, vocabulary range, and streaks in real-time.
          </p>
        </div>

        <div>
          <Link to="/conversation">
            <Button size="lg" variant="primary" rightIcon={<Play className="w-4 h-4" />}>
              Start First Lesson
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const {
    summary,
    skills,
    overallProgress,
    timeline,
    weeklyActivity,
    evolution,
    vocabulary,
    grammar,
    pronunciation,
    conversations,
    heatmap,
    milestones,
    aiInsights,
    weakAreas,
    goals
  } = analytics;

  // Chart data extraction based on selected tab
  const getChartValue = (day: any) => {
    switch (chartType) {
      case 'xp':
        return day.xpEarned;
      case 'lessons':
        return day.completedLessons;
      case 'conversation':
        return day.conversationTime;
      case 'vocabulary':
        return day.vocabularyLearned;
      case 'grammar':
        return day.grammarPractice;
      case 'minutes':
      default:
        return day.studyMinutes;
    }
  };

  const getChartLabel = () => {
    switch (chartType) {
      case 'xp':
        return 'XP Earned';
      case 'lessons':
        return 'Lessons Completed';
      case 'conversation':
        return 'Conversation Time (mins)';
      case 'vocabulary':
        return 'Vocabulary Learned';
      case 'grammar':
        return 'Grammar Practice Tasks';
      case 'minutes':
      default:
        return 'Daily Study Minutes';
    }
  };

  // Find max value in chart to scale SVG bar heights
  const maxChartVal = Math.max(...weeklyActivity.map((d: any) => getChartValue(d)), 1);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Personal Analytics Dashboard"
        subtitle="Real-time evaluation, skills proficiency matrix, and interactive goals progress"
        badgeText="Real-Time Analytics"
        action={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => refetch()} leftIcon={<Zap className="w-4 h-4 text-indigo-500" />}>
              Refresh Metrics
            </Button>
            <Link to="/conversation">
              <Button variant="primary" rightIcon={<Sparkles className="w-4 h-4" />}>
                Practice Voice Now
              </Button>
            </Link>
          </div>
        }
      />

      {/* ================= SECTION 1: LEARNING SUMMARY CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <Card variant="glass" hoverEffect className="p-6 rounded-3xl border border-white/95 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Study Time</span>
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600"><Clock className="w-5 h-5" /></div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-tight">{summary.studyTime}</h3>
            <p className="text-xs font-semibold text-emerald-600 mt-2">Active practice duration</p>
          </div>
        </Card>

        <Card variant="glass" hoverEffect className="p-6 rounded-3xl border border-white/95 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Grammar Accuracy</span>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600"><ShieldCheck className="w-5 h-5" /></div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900">{summary.grammarAccuracy}%</h3>
            <p className="text-xs font-semibold text-indigo-600 mt-2">Based on corrected responses</p>
          </div>
        </Card>

        <Card variant="glass" hoverEffect className="p-6 rounded-3xl border border-white/95 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Vocabulary Learned</span>
            <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600"><BookOpen className="w-5 h-5" /></div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900">{summary.vocabularyLearned} Words</h3>
            <p className="text-xs font-semibold text-slate-500 mt-2">Unique mastered items</p>
          </div>
        </Card>

        <Card variant="glass" hoverEffect className="p-6 rounded-3xl border border-white/95 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Current Streak</span>
            <div className="p-3 rounded-2xl bg-orange-50 border border-orange-100 text-orange-500"><Flame className="w-5 h-5 fill-current" /></div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900">🔥 {summary.currentStreak} Days</h3>
            <p className="text-xs font-semibold text-orange-600 mt-2">Streak bonus multiplier active</p>
          </div>
        </Card>

        <Card variant="glass" hoverEffect className="p-6 rounded-3xl border border-white/95 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Experience</span>
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 text-amber-500"><Zap className="w-5 h-5 fill-current" /></div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{summary.totalXP.toLocaleString()} XP</h3>
            <p className="text-xs font-bold text-amber-600 mt-2 bg-amber-50 inline-block px-2.5 py-0.5 rounded-full border border-amber-100">Level {summary.level}</p>
          </div>
        </Card>
      </div>

      {/* ================= GRID: PROGRESS, HEATMAP & AI INSIGHTS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Section 2: Overall Completion Progress */}
        <Card variant="glass" className="lg:col-span-8 p-6 sm:p-8 rounded-[32px] border border-white/90 shadow-xl space-y-6">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Overall Study Plan Progress</h3>
            <p className="text-xs text-slate-500 font-medium">Calculated from completed tasks against your entire active roadmap</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm font-bold text-slate-700">
              <span className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-indigo-500" /> Completed Tasks</span>
              <span className="text-indigo-600">{overallProgress.completionPercentage}% ({overallProgress.completedTasks}/{overallProgress.totalTasks})</span>
            </div>
            
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-1 border border-slate-200/50">
              <div
                style={{ width: `${overallProgress.completionPercentage}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000 shadow-sm"
              />
            </div>
          </div>

          {/* Counts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            <div className="p-3 rounded-2xl bg-slate-50/50 border border-slate-200/40 text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Lessons</span>
              <span className="text-lg font-black text-slate-800">{overallProgress.lessonsCompleted}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/50 border border-slate-200/40 text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Conversations</span>
              <span className="text-lg font-black text-slate-800">{overallProgress.conversationsCompleted}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/50 border border-slate-200/40 text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Vocabulary</span>
              <span className="text-lg font-black text-slate-800">{overallProgress.vocabularyCompleted}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/50 border border-slate-200/40 text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Grammar</span>
              <span className="text-lg font-black text-slate-800">{overallProgress.grammarCompleted}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/50 border border-slate-200/40 text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Listening</span>
              <span className="text-lg font-black text-slate-800">{overallProgress.listeningCompleted}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/50 border border-slate-200/40 text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Pronunciation</span>
              <span className="text-lg font-black text-slate-800">{overallProgress.pronunciationCompleted}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/50 border border-slate-200/40 text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Quizzes</span>
              <span className="text-lg font-black text-slate-800">{overallProgress.quizCompleted}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50/50 border border-slate-200/40 text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Active Week</span>
              <span className="text-lg font-black text-slate-800">Wk {overallProgress.currentWeek}</span>
            </div>
          </div>
        </Card>

        {/* Section 13: AI Insights */}
        <Card variant="glass" className="lg:col-span-4 p-6 sm:p-8 rounded-[32px] border border-white/90 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl" />
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-extrabold text-slate-900 font-sans">AI Insights</h3>
          </div>
          
          <div className="space-y-3.5">
            {aiInsights.map((insight: string, idx: number) => (
              <div key={idx} className="flex gap-2 text-xs font-semibold text-slate-600 leading-relaxed bg-white/70 p-3 rounded-2xl border border-slate-100 shadow-sm">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* ================= SKILL PROFICIENCY & EVOLUTION MATRIX ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Section 3: Skill Proficiency Matrix */}
        <Card variant="glass" className="lg:col-span-7 p-6 sm:p-8 rounded-[32px] border border-white/90 shadow-xl space-y-6">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Skill Proficiency Matrix</h3>
            <p className="text-xs text-slate-500 font-medium">Evaluation based on AI voice dialogue analysis</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {[
              { label: 'Vocabulary', score: skills.vocabulary, color: 'bg-indigo-500', selfBaseline: analytics.baselineSkills?.vocabulary, actualBaseline: analytics.baselineSkills?.actualVocabulary },
              { label: 'Grammar', score: skills.grammar, color: 'bg-emerald-500', selfBaseline: analytics.baselineSkills?.grammar, actualBaseline: analytics.baselineSkills?.actualGrammar },
              { label: 'Speaking', score: skills.speaking, color: 'bg-blue-500', selfBaseline: analytics.baselineSkills?.speaking, actualBaseline: analytics.baselineSkills?.actualSpeaking },
              { label: 'Listening', score: skills.listening, color: 'bg-amber-500', selfBaseline: analytics.baselineSkills?.listening, actualBaseline: analytics.baselineSkills?.actualListening },
              { label: 'Pronunciation', score: skills.pronunciation, color: 'bg-purple-500', selfBaseline: analytics.baselineSkills?.pronunciation, actualBaseline: analytics.baselineSkills?.actualPronunciation },
              { label: 'Fluency', score: skills.speaking || skills.overallScore, color: 'bg-cyan-500', selfBaseline: analytics.baselineSkills?.fluency, actualBaseline: analytics.baselineSkills?.actualFluency },
              { label: 'Reading', score: skills.reading, color: 'bg-rose-500', selfBaseline: analytics.baselineSkills?.reading, actualBaseline: analytics.baselineSkills?.actualReading },
              { label: 'Writing', score: skills.writing, color: 'bg-teal-500', selfBaseline: analytics.baselineSkills?.writing, actualBaseline: analytics.baselineSkills?.actualWriting }
            ].map((skill, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>{skill.label}</span>
                  <span className="text-indigo-600">{skill.score}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full p-0.5 border border-slate-200/50 relative overflow-visible">
                  <div
                    style={{ width: `${skill.score}%` }}
                    className={`h-full ${skill.color} rounded-full transition-all duration-1000 shadow-sm`}
                  />
                  {skill.selfBaseline !== undefined && skill.selfBaseline !== null && (
                    <div
                      style={{ left: `${skill.selfBaseline}%` }}
                      className="absolute top-[-4px] bottom-[-4px] w-1 bg-amber-500 rounded-full group cursor-pointer z-10"
                      title={`Self-Assessed: ${skill.selfBaseline}%`}
                    >
                      <span className="sr-only">Self-Assessed: {skill.selfBaseline}%</span>
                      <span className="hidden group-hover:block absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[9px] py-0.5 px-1.5 rounded whitespace-nowrap shadow-md z-30 font-bold border border-white/10">
                        Self-Assessed: {skill.selfBaseline}%
                      </span>
                    </div>
                  )}
                  {skill.actualBaseline !== undefined && skill.actualBaseline !== null && (
                    <div
                      style={{ left: `${skill.actualBaseline}%` }}
                      className="absolute top-[-4px] bottom-[-4px] w-1 bg-rose-600 rounded-full group cursor-pointer z-10"
                      title={`AI Measured: ${skill.actualBaseline}%`}
                    >
                      <span className="sr-only">AI Measured: {skill.actualBaseline}%</span>
                      <span className="hidden group-hover:block absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[9px] py-0.5 px-1.5 rounded whitespace-nowrap shadow-md z-30 font-bold border border-white/10">
                        AI Measured: {skill.actualBaseline}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-2 text-[10px] font-bold text-slate-500 justify-end border-t border-slate-200/40">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-1.5 bg-amber-500 rounded-full inline-block" />
              <span>Self-Assessed Baseline</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-1.5 bg-rose-600 rounded-full inline-block" />
              <span>AI-Measured Baseline</span>
            </div>
          </div>
        </Card>

        {/* Section 6: AI Skill Evolution */}
        <Card variant="glass" className="lg:col-span-5 p-6 sm:p-8 rounded-[32px] border border-white/90 shadow-xl space-y-6">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">AI Skill Evolution</h3>
            <p className="text-xs text-slate-500 font-medium">Performance improvements compared to your historical baseline</p>
          </div>

          <div className="space-y-4 pt-2">
            {[
              {
                name: 'Vocabulary Range',
                current: skills.vocabulary,
                selfBaseline: analytics.baselineSkills?.vocabulary ?? 0,
                actualBaseline: analytics.baselineSkills?.actualVocabulary ?? 0,
              },
              {
                name: 'Grammar Usage',
                current: skills.grammar,
                selfBaseline: analytics.baselineSkills?.grammar ?? 0,
                actualBaseline: analytics.baselineSkills?.actualGrammar ?? 0,
              },
              {
                name: 'Speaking & Fluency',
                current: skills.speaking,
                selfBaseline: analytics.baselineSkills?.speaking ?? 0,
                actualBaseline: analytics.baselineSkills?.actualSpeaking ?? 0,
              }
            ].map((evo, idx) => {
              const diff = evo.current - evo.actualBaseline;
              return (
                <div key={idx} className="p-4 rounded-2xl bg-white/80 border border-slate-200/40 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-sm">{evo.name}</h4>
                    <div className={`flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-xl border ${
                      diff >= 0 
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-100' 
                        : 'text-red-700 bg-red-50 border-red-100'
                    }`}>
                      <TrendingUp className={`w-3.5 h-3.5 ${diff < 0 && 'rotate-180 text-red-500'}`} />
                      <span>{diff >= 0 ? `+${diff}` : diff}% delta</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-bold uppercase">Self Baseline</span>
                      <span className="font-extrabold text-slate-700 text-xs">{evo.selfBaseline}%</span>
                    </div>
                    <div className="bg-rose-50/20 p-2 rounded-xl border border-rose-100/30">
                      <span className="text-rose-600 block font-bold uppercase">AI Baseline</span>
                      <span className="font-extrabold text-rose-700 text-xs">{evo.actualBaseline}%</span>
                    </div>
                    <div className="bg-indigo-50/30 p-2 rounded-xl border border-indigo-100/30">
                      <span className="text-indigo-600 block font-bold uppercase">Current Skill</span>
                      <span className="font-extrabold text-indigo-700 text-xs">{evo.current}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

      </div>

      {/* ================= SECTION 5: WEEKLY ACTIVITY CHART ================= */}
      <Card variant="glass" className="p-6 sm:p-8 rounded-[32px] border border-white/90 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Weekly Performance Activity</h3>
            <p className="text-xs text-slate-500 font-medium">Visualize different learning indices across the last 7 active study days</p>
          </div>

          {/* Switch tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'minutes', label: 'Study Time' },
              { id: 'xp', label: 'XP Earned' },
              { id: 'lessons', label: 'Lessons' },
              { id: 'conversation', label: 'Speaking (mins)' },
              { id: 'vocabulary', label: 'Vocab words' },
              { id: 'grammar', label: 'Grammar practice' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setChartType(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  chartType === tab.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/10'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom SVG Bar Chart */}
        <div className="space-y-4">
          <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl">
            {getChartLabel()}
          </span>

          <div className="relative pt-6 h-64 flex items-end justify-between gap-2 max-w-4xl mx-auto px-4">
            {/* Gridlines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-t border-slate-200 w-full" />
              <div className="border-t border-slate-200 w-full" />
              <div className="border-t border-slate-200 w-full" />
              <div className="border-t border-slate-200 w-full" />
            </div>

            {weeklyActivity.map((day: any, idx: number) => {
              const val = getChartValue(day);
              const heightPercent = Math.min(100, Math.round((val / maxChartVal) * 85));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group relative z-10">
                  {/* Tooltip */}
                  <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg pointer-events-none">
                    {val} {chartType === 'xp' ? 'XP' : chartType === 'minutes' || chartType === 'conversation' ? 'mins' : 'items'}
                  </div>

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPercent || 5}%` }}
                    className={`w-full max-w-[48px] rounded-t-xl transition-all duration-700 bg-gradient-to-t ${
                      val > 0
                        ? 'from-indigo-600 to-indigo-500 shadow-md shadow-indigo-500/10'
                        : 'from-slate-200 to-slate-100 border border-dashed border-slate-300'
                    }`}
                  />
                  {/* Day Name */}
                  <span className="text-xs font-bold text-slate-500 mt-2 block uppercase">{day.dayName}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ================= SECTION 4: PROGRESS TIMELINE ================= */}
      <Card variant="glass" className="p-6 sm:p-8 rounded-[32px] border border-white/90 shadow-xl space-y-6">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Personal Study Roadmap Timeline</h3>
          <p className="text-xs text-slate-500 font-medium">Explore each week's specific learning outcomes and completion status</p>
        </div>

        <div className="space-y-4">
          {timeline.map((week: any) => {
            const isExpanded = expandedWeek === week.weekNumber;
            return (
              <div key={week.weekNumber} className="border border-slate-200/60 rounded-2xl bg-white/70 overflow-hidden shadow-sm">
                {/* Header */}
                <button
                  onClick={() => setExpandedWeek(isExpanded ? null : week.weekNumber)}
                  className="w-full flex items-center justify-between p-5 text-left transition-all hover:bg-slate-50/50"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${
                      week.status === 'COMPLETED'
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                        : week.status === 'CURRENT'
                        ? 'text-indigo-700 bg-indigo-50 border-indigo-100 animate-pulse'
                        : 'text-slate-500 bg-slate-100 border-slate-200'
                    }`}>
                      {week.status}
                    </span>
                    <h4 className="font-extrabold text-slate-900">Week {week.weekNumber} Study Timeline</h4>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-indigo-600">{week.completionPercentage}% Done</span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 bg-slate-50/30 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="p-3 bg-white border border-slate-200/50 rounded-2xl">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Lessons</span>
                      <span className="text-sm font-black text-slate-800">{week.lessons} Completed</span>
                    </div>
                    <div className="p-3 bg-white border border-slate-200/50 rounded-2xl">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Conversations</span>
                      <span className="text-sm font-black text-slate-800">{week.conversations} Completed</span>
                    </div>
                    <div className="p-3 bg-white border border-slate-200/50 rounded-2xl">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Vocabulary</span>
                      <span className="text-sm font-black text-slate-800">{week.vocabulary} Completed</span>
                    </div>
                    <div className="p-3 bg-white border border-slate-200/50 rounded-2xl">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Grammar</span>
                      <span className="text-sm font-black text-slate-800">{week.grammar} Completed</span>
                    </div>
                    <div className="p-3 bg-white border border-slate-200/50 rounded-2xl">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">XP Earned</span>
                      <span className="text-sm font-black text-slate-800">+{week.xpEarned} XP</span>
                    </div>
                    <div className="p-3 bg-white border border-slate-200/50 rounded-2xl col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Study Time</span>
                      <span className="text-sm font-black text-slate-800">{week.studyTime} mins</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* ================= VOCABULARY & GRAMMAR BREAKDOWN ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Section 7: Vocabulary Progress */}
        <Card variant="glass" className="lg:col-span-6 p-6 sm:p-8 rounded-[32px] border border-white/90 shadow-xl space-y-6">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Vocabulary Range</h3>
            <p className="text-xs text-slate-500 font-medium">Analysis of active items from Malayalam translation practice</p>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-center">
              <span className="text-[10px] text-emerald-700 font-bold block uppercase">Mastered</span>
              <span className="text-2xl font-black text-emerald-800 mt-1 block">{vocabulary.mastered}</span>
            </div>
            <div className="flex-1 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-center">
              <span className="text-[10px] text-indigo-700 font-bold block uppercase">Learning</span>
              <span className="text-2xl font-black text-indigo-800 mt-1 block">{vocabulary.learning}</span>
            </div>
            <div className="flex-1 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-center">
              <span className="text-[10px] text-amber-700 font-bold block uppercase">Needs Review</span>
              <span className="text-2xl font-black text-amber-800 mt-1 block">{vocabulary.needsReview}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Recently Learned</h4>
              <div className="flex flex-wrap gap-2">
                {vocabulary.recentlyLearned.length > 0 ? (
                  vocabulary.recentlyLearned.map((w: string, i: number) => (
                    <span key={i} className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100">
                      {w}
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-bold text-slate-400">No words registered yet</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-red-700 mb-2 uppercase tracking-wider">Weak Vocabulary</h4>
              <div className="flex flex-wrap gap-2">
                {vocabulary.weakVocabulary.length > 0 ? (
                  vocabulary.weakVocabulary.map((w: string, i: number) => (
                    <span key={i} className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-xl border border-red-100">
                      {w}
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-bold text-slate-400">All words at high mastery</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Section 8: Grammar Progress */}
        <Card variant="glass" className="lg:col-span-6 p-6 sm:p-8 rounded-[32px] border border-white/90 shadow-xl space-y-6">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Grammar & Syntax Progress</h3>
            <p className="text-xs text-slate-500 font-medium">Evaluation of errors and tense structures registered during sessions</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Topics Completed</span>
              <span className="text-lg font-black text-slate-800 mt-1 block">{grammar.completed} Topics</span>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Current Topic</span>
              <span className="text-sm font-black text-indigo-700 mt-1 block truncate">{grammar.currentTopic}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Weak grammar items needing practice</h4>
            {grammar.weakTopics.length > 0 ? (
              grammar.weakTopics.map((topic: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <span className="text-xs font-bold text-slate-800">{topic.topic}</span>
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">{topic.count} Mistakes</span>
                </div>
              ))
            ) : (
              <div className="text-xs font-bold text-emerald-600 bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                All grammar metrics in optimal ranges!
              </div>
            )}
          </div>
        </Card>

      </div>

      {/* ================= PRONUNCIATION & CONVERSATION ANALYTICS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Section 9: Pronunciation Details */}
        <Card variant="glass" className="lg:col-span-5 p-6 sm:p-8 rounded-[32px] border border-white/90 shadow-xl space-y-6">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Pronunciation & Accent</h3>
            <p className="text-xs text-slate-500 font-medium">Evaluation based on audio files and phoneme matching</p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <span className="text-xs font-bold text-indigo-950">Accent Pronunciation Score</span>
            <span className="text-2xl font-black text-indigo-600">{pronunciation.score}%</span>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Words needing practice</h4>
            <div className="flex flex-wrap gap-2">
              {pronunciation.mispronouncedWords.map((w: string, idx: number) => (
                <span key={idx} className="text-xs font-bold text-slate-800 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200">
                  {w}
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* Section 10: Conversation Analytics */}
        <Card variant="glass" className="lg:col-span-7 p-6 sm:p-8 rounded-[32px] border border-white/90 shadow-xl space-y-6">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Dialogue Analytics</h3>
            <p className="text-xs text-slate-500 font-medium">Statistics parsed from speaking conversation sessions</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Sessions</span>
              <span className="text-lg font-black text-slate-800 mt-1 block">{conversations.totalConversations} Chats</span>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Avg Duration</span>
              <span className="text-lg font-black text-slate-800 mt-1 block">{conversations.averageDuration} Mins</span>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Confidence</span>
              <span className="text-lg font-black text-slate-800 mt-1 block">{conversations.averageConfidence}%</span>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Fluency Score</span>
              <span className="text-lg font-black text-slate-800 mt-1 block">{conversations.averageFluency}%</span>
            </div>
          </div>

          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-950">Most Practiced Topic</span>
            <span className="text-xs font-black text-indigo-600 bg-white px-3 py-1 rounded-xl border border-indigo-100 truncate max-w-[200px]">
              {conversations.mostPracticedTopic}
            </span>
          </div>
        </Card>

      </div>

      {/* ================= SECTION 11: HEATMAP CALENDAR ================= */}
      <Card variant="glass" className="p-6 sm:p-8 rounded-[32px] border border-white/90 shadow-xl space-y-6">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Learning Heatmap</h3>
          <p className="text-xs text-slate-500 font-medium">Track your study continuity across the calendar days based on daily minutes</p>
        </div>

        {/* Generate Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-1 min-w-[700px] justify-between">
            {/* Simple representation of heat calendar weeks */}
            {Array.from({ length: 53 }).map((_, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const daysAgo = (52 - weekIdx) * 7 + (6 - dayIdx);
                  const date = new Date();
                  date.setDate(date.getDate() - daysAgo);
                  const dateStr = date.toISOString().split('T')[0];

                  const matchingDay = heatmap.find((d: any) => d.date === dateStr);
                  const level = matchingDay ? matchingDay.level : 0;

                  let colorClass = 'bg-slate-100 border-slate-200/40';
                  if (level === 1) colorClass = 'bg-indigo-200 border-indigo-300/40';
                  else if (level === 2) colorClass = 'bg-indigo-400 border-indigo-500/40';
                  else if (level === 3) colorClass = 'bg-indigo-600 border-indigo-700/40';
                  else if (level === 4) colorClass = 'bg-indigo-800 border-indigo-900/40';

                  return (
                    <div
                      key={dayIdx}
                      className={`w-3.5 h-3.5 rounded-sm border ${colorClass} transition-all duration-300 hover:scale-125`}
                      title={`${dateStr}: ${matchingDay ? matchingDay.count : 0} minutes studied`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-slate-400">
          <span>No Study</span>
          <div className="w-3.5 h-3.5 rounded-sm bg-slate-100 border border-slate-200" />
          <div className="w-3.5 h-3.5 rounded-sm bg-indigo-200 border border-indigo-300" />
          <div className="w-3.5 h-3.5 rounded-sm bg-indigo-400 border border-indigo-500" />
          <div className="w-3.5 h-3.5 rounded-sm bg-indigo-600 border border-indigo-700" />
          <div className="w-3.5 h-3.5 rounded-sm bg-indigo-800 border border-indigo-900" />
          <span>Heavy Study</span>
        </div>
      </Card>

      {/* ================= SECTION 12 & 15: MILESTONES & GOALS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Section 15: Learning Goals progress */}
        <Card variant="glass" className="lg:col-span-7 p-6 sm:p-8 rounded-[32px] border border-white/90 shadow-xl space-y-6">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Learning Goals</h3>
            <p className="text-xs text-slate-500 font-medium">Verify your completion percentages for today, this week, and this month</p>
          </div>

          <div className="space-y-5">
            {[
              { label: "Today's Goal", val: goals.today, time: '20 mins' },
              { label: "Weekly Goal", val: goals.weekly, time: '100 mins' },
              { label: "Monthly Goal", val: goals.monthly, time: '400 mins' }
            ].map((goal, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>{goal.label} ({goal.time})</span>
                  <span className="text-indigo-600 font-black">{goal.val.current}/{goal.val.goal} mins ({goal.val.completion}%)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                  <div
                    style={{ width: `${goal.val.completion}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000 shadow-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Section 12: Milestones */}
        <Card variant="glass" className="lg:col-span-5 p-6 sm:p-8 rounded-[32px] border border-white/90 shadow-xl space-y-6">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Earned Milestones</h3>
            <p className="text-xs text-slate-500 font-medium">Achievements automatically unlocked through practice milestones</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
            {milestones.length > 0 ? (
              milestones.map((milestone: any) => (
                <div key={milestone.id} className="p-3 rounded-2xl bg-white border border-slate-150 shadow-sm flex items-start gap-2.5">
                  <div className="p-2 bg-amber-50 rounded-xl text-amber-500 shrink-0 border border-amber-100">
                    <Award className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-[11px] leading-tight">{milestone.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">{milestone.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center text-xs font-bold text-slate-400 py-8">
                Keep practicing to unlock your first milestone badge!
              </div>
            )}
          </div>
        </Card>

      </div>

      {/* ================= WEEKLY ASSESSMENTS & OBJECTIVE MASTERY ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Section: Weekly AI Progress Reports */}
        <Card variant="glass" className="lg:col-span-7 p-6 sm:p-8 rounded-[32px] border border-white/90 shadow-xl space-y-6">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Weekly Performance Assessments</h3>
            <p className="text-xs text-slate-500 font-medium">Historical proficiency tracking compiled at the end of each study week</p>
          </div>

          {(!analytics.weeklyAssessments || analytics.weeklyAssessments.length === 0) ? (
            <div className="text-center py-8 text-slate-400 text-xs font-semibold">
              Weekly evaluations will appear here after you complete each 7-day study milestone.
            </div>
          ) : (
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {analytics.weeklyAssessments.map((assessment: any) => (
                <div key={assessment.weekNumber} className="p-4 bg-white/80 border border-slate-200/50 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-slate-800 text-sm">Week {assessment.weekNumber} Assessment Report</h4>
                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                      Compiled
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-600 font-medium bg-slate-55/30 p-2.5 rounded-xl border border-slate-100 italic">
                    "{assessment.feedback}"
                  </p>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                    {[
                      { label: 'Grammar', score: assessment.grammar },
                      { label: 'Fluency', score: assessment.fluency },
                      { label: 'Speaking', score: assessment.speaking },
                      { label: 'Listening', score: assessment.listening },
                      { label: 'Pronunciation', score: assessment.pronunciation },
                      { label: 'Writing', score: assessment.writing },
                    ].map((s, idx) => (
                      <div key={idx} className="p-2 bg-slate-50/50 border border-slate-100 rounded-xl">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">{s.label}</span>
                        <span className="text-xs font-black text-slate-800">{s.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Section: Granular Objective Mastery */}
        <Card variant="glass" className="lg:col-span-5 p-6 sm:p-8 rounded-[32px] border border-white/90 shadow-xl space-y-6">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Granular Objective Mastery</h3>
            <p className="text-xs text-slate-500 font-medium">Real-time mastery tracking of individual curriculum learning objectives</p>
          </div>

          {(!analytics.objectiveMasteries || analytics.objectiveMasteries.length === 0) ? (
            <div className="text-center py-8 text-slate-400 text-xs font-semibold">
              Complete your first daily lesson objectives to start tracking mastery progression.
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
              {analytics.objectiveMasteries.map((m: any, idx: number) => {
                let badgeColor = 'text-slate-600 bg-slate-100 border-slate-200';
                let badgeText = 'Novice';
                if (m.masteryScore >= 80) {
                  badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-100';
                  badgeText = 'Mastered';
                } else if (m.masteryScore >= 50) {
                  badgeColor = 'text-indigo-700 bg-indigo-50 border-indigo-100';
                  badgeText = 'Proficient';
                } else if (m.attemptsCount > 0) {
                  badgeColor = 'text-amber-700 bg-amber-50 border-amber-100';
                  badgeText = 'Practicing';
                }

                return (
                  <div key={idx} className="p-3.5 bg-white/80 border border-slate-200/50 rounded-2xl space-y-2.5 shadow-sm">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-black uppercase">Objective</span>
                        <h4 className="font-extrabold text-slate-800 text-xs leading-normal">{m.objective}</h4>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border whitespace-nowrap ${badgeColor}`}>
                        {badgeText}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-6 pt-0.5 text-[10px] font-bold text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span>Attempts:</span>
                        <span className="text-slate-800 font-black">{m.attemptsCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>Avg. Accuracy:</span>
                        <span className="text-slate-800 font-black">{m.accuracy}%</span>
                      </div>
                      <div className="flex-1 max-w-[120px] space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                          <span>Mastery</span>
                          <span className="text-indigo-600 font-black">{m.masteryScore}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                          <div
                            style={{ width: `${m.masteryScore}%` }}
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ================= SECTION 14: WEAK AREAS ================= */}
      <Card variant="glass" className="p-6 sm:p-8 rounded-[32px] border border-white/90 shadow-xl space-y-6">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Grammar & Skill Remediation</h3>
          <p className="text-xs text-slate-500 font-medium">Verify mistake details and click to practice immediately</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {weakAreas.map((area: any, idx: number) => (
            <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200/50 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-slate-400">{area.category}</span>
                  <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md uppercase">
                    {area.trend}
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{area.topic}</h4>
                <p className="text-xs font-bold text-red-600 mt-2">{area.mistakeCount} mistakes logged</p>
              </div>

              <Link to="/conversation" className="block w-full">
                <Button size="sm" variant="secondary" className="w-full text-xs font-bold py-2 border border-slate-200">
                  Practice Now
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
};
