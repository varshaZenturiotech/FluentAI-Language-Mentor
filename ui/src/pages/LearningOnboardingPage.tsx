import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import {
  Check,
  Sparkles,
  User,
  Briefcase,
  Target,
  Heart,
  TrendingUp,
  Globe,
  Clock,
  AlertCircle
} from 'lucide-react';
import { learningProfileApi } from '../api/learning-profile.api';

export const LearningOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<string | null>(null);

  // Section Refs for Auto-Scroll Validation
  const ageGroupRef = useRef<HTMLDivElement>(null);
  const occupationRef = useRef<HTMLDivElement>(null);
  const goalsRef = useRef<HTMLDivElement>(null);
  const interestsRef = useRef<HTMLDivElement>(null);
  const englishLevelRef = useRef<HTMLDivElement>(null);
  const nativeLanguageRef = useRef<HTMLDivElement>(null);

  // Form State
  const [ageGroup, setAgeGroup] = useState<string>('');
  const [occupation, setOccupation] = useState<string>('');
  const [otherOccupation, setOtherOccupation] = useState<string>('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [englishLevel, setEnglishLevel] = useState<string>('');
  const [nativeLanguage, setNativeLanguage] = useState<string>('Malayalam');
  const [dailyGoal, setDailyGoal] = useState<number>(20);

  // Baseline Skills State
  const [grammarBaseline, setGrammarBaseline] = useState<number>(50);
  const [vocabularyBaseline, setVocabularyBaseline] = useState<number>(50);
  const [readingBaseline, setReadingBaseline] = useState<number>(50);
  const [speakingBaseline, setSpeakingBaseline] = useState<number>(50);
  const [listeningBaseline, setListeningBaseline] = useState<number>(50);
  const [writingBaseline, setWritingBaseline] = useState<number>(50);
  const [pronunciationBaseline, setPronunciationBaseline] = useState<number>(50);
  const [fluencyBaseline, setFluencyBaseline] = useState<number>(50);

  // Option Constants
  const ageGroups = ['Under 13', '13–17', '18–24', '25–34', '35–44', '45+'];

  const occupations = [
    'Student',
    'Software Engineer',
    'Teacher',
    'Doctor',
    'Nurse',
    'Business',
    'Homemaker',
    'Job Seeker',
    'Other'
  ];

  const goals = [
    'Speak confidently',
    'Daily conversation',
    'Work communication',
    'Job Interview',
    'Business English',
    'Travel',
    'Study Abroad',
    'Grammar',
    'Vocabulary'
  ];

  const interests = [
    'Technology',
    'AI',
    'Movies',
    'Music',
    'Sports',
    'Cricket',
    'Football',
    'Cooking',
    'Finance',
    'Business',
    'Travel',
    'Gaming'
  ];

  const englishLevels = ['Beginner', 'Intermediate', 'Advanced', 'Not Sure'];

  const nativeLanguages = [
    { name: 'Malayalam', code: 'ml', flag: '🇮🇳', supported: true },
    { name: 'Hindi', code: 'hi', flag: '🇮🇳', supported: false },
    { name: 'Tamil', code: 'ta', flag: '🇮🇳', supported: false },
    { name: 'Telugu', code: 'te', flag: '🇮🇳', supported: false },
    { name: 'Spanish', code: 'es', flag: '🇪🇸', supported: false },
  ];

  const dailyGoals = [
    { label: '10 minutes', value: 10 },
    { label: '20 minutes', value: 20 },
    { label: '30 minutes', value: 30 },
    { label: '45 minutes', value: 45 },
    { label: '60 minutes', value: 60 },
  ];

  // Helper Toggles
  const handleGoalToggle = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
    if (invalidField === 'goals') setInvalidField(null);
  };

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
    if (invalidField === 'interests') setInvalidField(null);
  };

  // Form Validation
  const validateForm = (): boolean => {
    setError(null);
    setInvalidField(null);

    if (!ageGroup) {
      setError('Please select an age group.');
      setInvalidField('ageGroup');
      ageGroupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }

    if (!occupation) {
      setError('Please select or specify your occupation.');
      setInvalidField('occupation');
      occupationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }

    if (occupation === 'Other' && !otherOccupation.trim()) {
      setError('Please specify your occupation.');
      setInvalidField('occupation');
      occupationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }

    if (selectedGoals.length === 0) {
      setError('Please select at least one learning goal.');
      setInvalidField('goals');
      goalsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }

    if (selectedInterests.length === 0) {
      setError('Please select at least one interest.');
      setInvalidField('interests');
      interestsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }

    if (!englishLevel) {
      setError('Please select your current English level.');
      setInvalidField('englishLevel');
      englishLevelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }

    if (!nativeLanguage) {
      setError('Please select your native language.');
      setInvalidField('nativeLanguage');
      nativeLanguageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }

    return true;
  };

  // Submit Handler
  const handleSubmit = async (e?: React.SubmitEvent) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const finalOccupation = occupation === 'Other' ? otherOccupation : occupation;
      await learningProfileApi.createProfile({
        ageGroup,
        occupation: finalOccupation,
        englishLevel,
        nativeLanguage,
        dailyGoal,
        goals: selectedGoals,
        interests: selectedInterests,
        baselineSkills: {
          grammar: grammarBaseline,
          vocabulary: vocabularyBaseline,
          reading: readingBaseline,
          speaking: speakingBaseline,
          listening: listeningBaseline,
          writing: writingBaseline,
          pronunciation: pronunciationBaseline,
          fluency: fluencyBaseline,
        },
      });
      navigate('/study-plan');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save learning profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate('/baseline-assessment');
  };

  // Completion calculation for indicator
  const completedSections = [
    !!ageGroup,
    !!occupation && (occupation !== 'Other' || !!otherOccupation.trim()),
    selectedGoals.length > 0,
    selectedInterests.length > 0,
    !!englishLevel,
    !!nativeLanguage,
  ].filter(Boolean).length;

  const totalRequired = 6;
  const completionPercentage = Math.round((completedSections / totalRequired) * 100);

  return (
    <div className="w-full py-4 md:py-6 flex flex-col items-center justify-start relative">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-200/30 rounded-full filter blur-3xl -z-10 animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-sky-200/30 rounded-full filter blur-3xl -z-10 animate-float" />

      {/* Main Onboarding Form */}
      <form id="onboarding-form" onSubmit={handleSubmit} className="w-full">
        
        {/* FIXED LEFT ACTION CONTROL (Desktop/Tablet) */}
        <div className="hidden md:block fixed left-4 xl:left-8 top-24 z-40">
          <Button 
            type="button"
            onClick={handleSkip}
            variant="secondary"
            size="md"
            className="shadow-lg shadow-slate-900/5 border border-slate-200/90 bg-white/95 backdrop-blur-md px-5 py-2.5 text-slate-700 font-bold hover:bg-white transition-all hover:scale-105"
          >
            Skip for now
          </Button>
        </div>

        {/* FIXED RIGHT ACTION CONTROL (Desktop/Tablet) */}
        <div className="hidden md:block fixed right-4 xl:right-8 top-24 z-40">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="shadow-xl shadow-indigo-600/30 px-6 py-2.5 font-bold text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 transition-all hover:scale-105"
            rightIcon={<Check className="w-4 h-4" />}
          >
            Complete Onboarding
          </Button>
        </div>

        {/* FIXED BOTTOM ACTION BAR (Mobile <768px) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-2xl flex items-center justify-between gap-3">
          <Button 
            type="button"
            onClick={handleSkip}
            variant="secondary"
            size="sm"
            className="flex-1 py-2.5 text-xs font-bold text-slate-700 border border-slate-200"
          >
            Skip for now
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            className="flex-1 py-2.5 text-xs font-bold shadow-lg shadow-indigo-600/25"
            rightIcon={<Check className="w-3.5 h-3.5" />}
          >
            Complete Onboarding
          </Button>
        </div>

        {/* CENTER CONTENT ZONE (Expanded Full-Width Desktop Layout) */}
        <div className="w-full max-w-[1800px] mx-auto space-y-6 px-2 sm:px-4 lg:px-6 pb-20 md:pb-12">
          
          {/* Header Banner */}
          <div className="text-center space-y-2 max-w-2xl mx-auto pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Personalize Your Learning</span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              Tell us a little about yourself
            </h1>
            <p className="text-slate-500 text-xs md:text-sm font-medium max-w-md mx-auto">
              Complete all sections below so our AI mentor can customize your daily lessons and study plan.
            </p>

            {/* Progress Indicator */}
            <div className="max-w-md mx-auto pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                <span>{completedSections} of {totalRequired} sections completed</span>
                <span className="text-indigo-600 font-bold">{completionPercentage}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-300 rounded-full"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Global Error Banner */}
          {error && (
            <div className="p-3 bg-rose-50 border-2 border-rose-200 text-rose-700 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-3 shadow-md animate-shake max-w-3xl mx-auto">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* 4-Column Onboarding Question Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">

            {/* SECTION 1: AGE GROUP */}
            <div ref={ageGroupRef}>
              <Card 
                variant="glass" 
                className={`p-4 lg:p-5 rounded-2xl border transition-all duration-300 ${
                  invalidField === 'ageGroup'
                    ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/20'
                    : 'border-white/95 shadow-lg hover:shadow-xl'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black shrink-0 text-xs">
                      1
                    </div>
                    <div>
                      <h2 className="text-sm lg:text-base font-bold text-slate-900 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-indigo-500 shrink-0" />
                        Age group?
                      </h2>
                      <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                        Adapts vocabulary & pacing.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {ageGroups.map((age) => (
                      <button
                        type="button"
                        key={age}
                        onClick={() => {
                          setAgeGroup(age);
                          if (invalidField === 'ageGroup') setInvalidField(null);
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-between ${ageGroup === age
                            ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 shadow-sm ring-1 ring-indigo-500'
                            : 'border-slate-200 bg-white/80 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                          }`}
                      >
                        <span>{age}</span>
                        {ageGroup === age && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* SECTION 2: OCCUPATION */}
            <div ref={occupationRef}>
              <Card
                variant="glass"
                className={`p-4 lg:p-5 rounded-2xl border transition-all duration-300 ${invalidField === 'occupation'
                    ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/20'
                    : 'border-white/95 shadow-lg hover:shadow-xl'
                  }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black shrink-0 text-xs">
                      2
                    </div>
                    <div>
                      <h2 className="text-sm lg:text-base font-bold text-slate-900 flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-indigo-500 shrink-0" />
                        Occupation?
                      </h2>
                      <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                        Tailors practice scenarios.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {occupations.map((occ) => (
                      <button
                        type="button"
                        key={occ}
                        onClick={() => {
                          setOccupation(occ);
                          if (occ !== 'Other') setOtherOccupation('');
                          if (invalidField === 'occupation') setInvalidField(null);
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-between ${occupation === occ
                            ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 shadow-sm ring-1 ring-indigo-500'
                            : 'border-slate-200 bg-white/80 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                          }`}
                      >
                        <span className="truncate">{occ}</span>
                        {occupation === occ && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />}
                      </button>
                    ))}
                  </div>

                  {/* Conditional Other Input */}
                  {occupation === 'Other' && (
                    <div className="pt-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                        Specify Occupation <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={otherOccupation}
                        onChange={(e) => {
                          setOtherOccupation(e.target.value);
                          if (invalidField === 'occupation') setInvalidField(null);
                        }}
                        placeholder="e.g. Artist, Pilot"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-800 shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* SECTION 3: LEARNING GOALS */}
            <div ref={goalsRef}>
              <Card
                variant="glass"
                className={`p-4 lg:p-5 rounded-2xl border transition-all duration-300 ${invalidField === 'goals'
                    ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/20'
                    : 'border-white/95 shadow-lg hover:shadow-xl'
                  }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black shrink-0 text-xs">
                      3
                    </div>
                    <div>
                      <h2 className="text-sm lg:text-base font-bold text-slate-900 flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-indigo-500 shrink-0" />
                        Learning goals?
                      </h2>
                      <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                        Select goals for roadmap.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {goals.map((g) => {
                      const isSelected = selectedGoals.includes(g);
                      return (
                        <button
                          type="button"
                          key={g}
                          onClick={() => handleGoalToggle(g)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-between ${isSelected
                              ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 shadow-sm ring-1 ring-indigo-500'
                              : 'border-slate-200 bg-white/80 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                            }`}
                        >
                          <span className="truncate">{g}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>

            {/* SECTION 4: INTERESTS */}
            <div ref={interestsRef}>
              <Card
                variant="glass"
                className={`p-4 lg:p-5 rounded-2xl border transition-all duration-300 ${invalidField === 'interests'
                    ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/20'
                    : 'border-white/95 shadow-lg hover:shadow-xl'
                  }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black shrink-0 text-xs">
                      4
                    </div>
                    <div>
                      <h2 className="text-sm lg:text-base font-bold text-slate-900 flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-indigo-500 shrink-0" />
                        Your interests?
                      </h2>
                      <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                        Personalizes lesson topics.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {interests.map((interest) => {
                      const isSelected = selectedInterests.includes(interest);
                      return (
                        <button
                          type="button"
                          key={interest}
                          onClick={() => handleInterestToggle(interest)}
                          className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-between ${isSelected
                              ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 shadow-sm ring-1 ring-indigo-500'
                              : 'border-slate-200 bg-white/80 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                            }`}
                        >
                          <span className="truncate">{interest}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>

            {/* SECTION 5: CURRENT ENGLISH LEVEL */}
            <div ref={englishLevelRef}>
              <Card
                variant="glass"
                className={`p-4 lg:p-5 rounded-2xl border transition-all duration-300 ${invalidField === 'englishLevel'
                    ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/20'
                    : 'border-white/95 shadow-lg hover:shadow-xl'
                  }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black shrink-0 text-xs">
                      5
                    </div>
                    <div>
                      <h2 className="text-sm lg:text-base font-bold text-slate-900 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-indigo-500 shrink-0" />
                        English level?
                      </h2>
                      <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                        Sets initial vocabulary level.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {englishLevels.map((lvl) => (
                      <button
                        type="button"
                        key={lvl}
                        onClick={() => {
                          setEnglishLevel(lvl);
                          let baseVal = 45;
                          if (lvl === 'Beginner') baseVal = 30;
                          else if (lvl === 'Intermediate') baseVal = 60;
                          else if (lvl === 'Advanced') baseVal = 85;
                          setGrammarBaseline(baseVal);
                          setSpeakingBaseline(baseVal);
                          setListeningBaseline(baseVal);
                          setWritingBaseline(baseVal);
                          setPronunciationBaseline(baseVal);
                          setFluencyBaseline(baseVal);
                          if (invalidField === 'englishLevel') setInvalidField(null);
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-between ${englishLevel === lvl
                            ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 shadow-sm ring-1 ring-indigo-500'
                            : 'border-slate-200 bg-white/80 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                          }`}
                      >
                        <span>{lvl}</span>
                        {englishLevel === lvl && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* SECTION 6: NATIVE LANGUAGE */}
            <div ref={nativeLanguageRef}>
              <Card
                variant="glass"
                className={`p-4 lg:p-5 rounded-2xl border transition-all duration-300 ${invalidField === 'nativeLanguage'
                    ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/20'
                    : 'border-white/95 shadow-lg hover:shadow-xl'
                  }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black shrink-0 text-xs">
                      6
                    </div>
                    <div>
                      <h2 className="text-sm lg:text-base font-bold text-slate-900 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-indigo-500 shrink-0" />
                        Native language?
                      </h2>
                      <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                        For translation support.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {nativeLanguages.map((lang) => (
                      <button
                        type="button"
                        key={lang.name}
                        disabled={!lang.supported}
                        onClick={() => {
                          if (lang.supported) {
                            setNativeLanguage(lang.name);
                            if (invalidField === 'nativeLanguage') setInvalidField(null);
                          }
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-between ${!lang.supported
                            ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100 text-slate-400'
                            : nativeLanguage === lang.name
                              ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 shadow-sm ring-1 ring-indigo-500'
                              : 'border-slate-200 bg-white/80 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-sm">{lang.flag}</span>
                          <span className="truncate">{lang.name}</span>
                        </div>
                        {lang.supported ? (
                          nativeLanguage === lang.name && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />
                        ) : (
                          <span className="text-[8px] bg-slate-200 text-slate-600 py-0.5 px-1 rounded font-extrabold uppercase shrink-0">
                            Soon
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* SECTION 7: DAILY GOAL (Occupies exactly 1 grid column matching Cards 1-6) */}
            <div>
              <Card
                variant="glass"
                className={`p-4 lg:p-5 rounded-2xl border transition-all duration-300 ${invalidField === 'dailyGoal'
                    ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/20'
                    : 'border-white/95 shadow-lg hover:shadow-xl'
                  }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black shrink-0 text-xs">
                      7
                    </div>
                    <div>
                      <h2 className="text-sm lg:text-base font-bold text-slate-900 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                        Daily learning goal
                      </h2>
                      <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                        How many minutes per day?
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {dailyGoals.map((g, idx) => (
                      <button
                        type="button"
                        key={g.value}
                        onClick={() => setDailyGoal(g.value)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-between ${idx === 4 ? 'col-span-2' : ''
                          } ${dailyGoal === g.value
                            ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 shadow-sm ring-1 ring-indigo-500'
                            : 'border-slate-200 bg-white/80 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                          }`}
                      >
                        <span>{g.label}</span>
                        {dailyGoal === g.value && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

          </div>
        </div>

      </form>
    </div>
  );
};
