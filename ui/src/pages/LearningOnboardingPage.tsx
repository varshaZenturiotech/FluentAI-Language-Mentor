import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Sparkles, 
  User, 
  Briefcase, 
  Target, 
  Heart, 
  TrendingUp, 
  Globe, 
  Clock 
} from 'lucide-react';
import { learningProfileApi } from '../api/learning-profile.api';

// Custom icons or indicators for steps
const STEP_META = [
  { title: "Welcome", icon: Sparkles },
  { title: "Age Group", icon: User },
  { title: "Occupation", icon: Briefcase },
  { title: "Goals", icon: Target },
  { title: "Interests", icon: Heart },
  { title: "English Level", icon: TrendingUp },
  { title: "Native Language", icon: Globe },
  { title: "Daily Goal", icon: Clock },
];

export const LearningOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Constants
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

  const handleNext = () => {
    setError(null);
    // Validate current step
    if (step === 2 && !ageGroup) {
      setError('Please select an age group.');
      return;
    }
    if (step === 3 && !occupation) {
      setError('Please select or specify your occupation.');
      return;
    }
    if (step === 3 && occupation === 'Other' && !otherOccupation.trim()) {
      setError('Please specify your occupation.');
      return;
    }
    if (step === 4 && selectedGoals.length === 0) {
      setError('Please select at least one learning goal.');
      return;
    }
    if (step === 5 && selectedInterests.length === 0) {
      setError('Please select at least one interest.');
      return;
    }
    if (step === 6 && !englishLevel) {
      setError('Please select your current English level.');
      return;
    }
    if (step === 7 && !nativeLanguage) {
      setError('Please select your native language.');
      return;
    }

    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => prev - 1);
  };

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleFinish = async () => {
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

  // Progress Bar Percentage
  const progressPercent = ((step - 1) / (STEP_META.length - 1)) * 100;

  return (
    <div className="min-h-[90vh] py-12 px-4 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background blobs for premium glassmorphism feel */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-200/40 rounded-full filter blur-3xl -z-10 animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-200/40 rounded-full filter blur-3xl -z-10 animate-float" />

      <div className="w-full max-w-xl">
        {/* Step Indicator Headers */}
        {step > 1 && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
              <span className="uppercase tracking-wider">
                Step {step - 1} of {STEP_META.length - 1}: {STEP_META[step - 1].title}
              </span>
              <span>{Math.round(progressPercent)}% Completed</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-500 rounded-full" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <Card variant="glass" glow className="p-8 rounded-3xl border border-white/95 shadow-2xl relative">
          
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <div className="text-center space-y-6 py-6">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-sky-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/20 text-white animate-float">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-slate-900 leading-tight">
                  Welcome to AI Language Mentor
                </h1>
                <p className="text-slate-500 text-sm md:text-base font-medium max-w-md mx-auto">
                  Let's personalize your learning experience. This only takes one minute.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button 
                  onClick={handleNext}
                  variant="primary"
                  size="lg"
                  className="px-8 py-3.5 shadow-lg shadow-indigo-600/20"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Get Started
                </Button>
                <Button 
                  onClick={handleSkip}
                  variant="secondary"
                  size="lg"
                  className="px-8 py-3.5"
                >
                  Skip for now
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: AGE GROUP */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">What is your age group?</h2>
                <p className="text-xs text-slate-500 font-medium">This helps us customize our teaching vocabulary and pacing.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {ageGroups.map((age) => (
                  <button
                    key={age}
                    onClick={() => setAgeGroup(age)}
                    className={`p-4 rounded-2xl text-sm font-bold border transition-all text-left flex items-center justify-between ${
                      ageGroup === age
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-sm'
                        : 'border-slate-200 bg-white/70 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{age}</span>
                    {ageGroup === age && <Check className="w-4 h-4 text-indigo-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: OCCUPATION */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">What is your occupation?</h2>
                <p className="text-xs text-slate-500 font-medium">We'll tailor lesson scenarios and roleplay exercises to your daily environment.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {occupations.map((occ) => (
                  <button
                    key={occ}
                    onClick={() => {
                      setOccupation(occ);
                      if (occ !== 'Other') setOtherOccupation('');
                    }}
                    className={`p-3.5 rounded-2xl text-xs font-bold border transition-all text-center ${
                      occupation === occ
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-sm'
                        : 'border-slate-200 bg-white/70 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    {occ}
                  </button>
                ))}
              </div>

              {occupation === 'Other' && (
                <div className="mt-4 pt-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Specify Your Occupation
                  </label>
                  <input
                    type="text"
                    value={otherOccupation}
                    onChange={(e) => setOtherOccupation(e.target.value)}
                    placeholder="e.g. Artist, Pilot, Scientist"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-800"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 4: LEARNING GOALS */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">Choose your learning goals</h2>
                <p className="text-xs text-slate-500 font-medium">Select one or more targets to align the mentor's recommendations.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {goals.map((g) => {
                  const isSelected = selectedGoals.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => handleGoalToggle(g)}
                      className={`p-3.5 rounded-2xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-sm'
                          : 'border-slate-200 bg-white/70 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>{g}</span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: INTERESTS */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">What are you interested in?</h2>
                <p className="text-xs text-slate-500 font-medium">We'll inject these topics into conversations and mock exercises to keep you engaged!</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {interests.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => handleInterestToggle(interest)}
                      className={`p-3 rounded-2xl text-xs font-bold border transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-sm'
                          : 'border-slate-200 bg-white/70 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: CURRENT ENGLISH LEVEL */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">Your current English level</h2>
                <p className="text-xs text-slate-500 font-medium">This adjusts the vocabulary complexity and lesson speed.</p>
              </div>
              <div className="space-y-3">
                {englishLevels.map((lvl) => (
                  <button
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
                    }}
                    className={`w-full p-4 rounded-2xl text-sm font-bold border transition-all text-left flex items-center justify-between ${
                      englishLevel === lvl
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-sm'
                        : 'border-slate-200 bg-white/70 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{lvl}</span>
                    {englishLevel === lvl && <Check className="w-4 h-4 text-indigo-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7: NATIVE LANGUAGE */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">Select your native language</h2>
                <p className="text-xs text-slate-500 font-medium">We initially support Malayalam. More language options will roll out soon.</p>
              </div>
              <div className="space-y-3">
                {nativeLanguages.map((lang) => (
                  <button
                    key={lang.name}
                    disabled={!lang.supported}
                    onClick={() => {
                      if (lang.supported) setNativeLanguage(lang.name);
                    }}
                    className={`w-full p-4 rounded-2xl text-sm font-bold border transition-all text-left flex items-center justify-between ${
                      !lang.supported 
                        ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100 text-slate-400' 
                        : nativeLanguage === lang.name
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-sm'
                          : 'border-slate-200 bg-white/70 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </div>
                    {lang.supported ? (
                      nativeLanguage === lang.name && <Check className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <span className="text-[10px] bg-slate-200 text-slate-600 py-0.5 px-2 rounded-full font-extrabold uppercase tracking-wide">
                        Soon
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 8: DAILY GOAL */}
          {step === 8 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">Choose your daily goal</h2>
                <p className="text-xs text-slate-500 font-medium">How many minutes a day do you want to practice?</p>
              </div>
              <div className="space-y-3">
                {dailyGoals.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setDailyGoal(g.value)}
                    className={`w-full p-4 rounded-2xl text-sm font-bold border transition-all text-left flex items-center justify-between ${
                      dailyGoal === g.value
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-sm'
                        : 'border-slate-200 bg-white/70 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{g.label}</span>
                    {dailyGoal === g.value && <Check className="w-4 h-4 text-indigo-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Action Navigation */}
          {step > 1 && (
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              {step < STEP_META.length ? (
                <Button
                  onClick={handleNext}
                  variant="primary"
                  size="md"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  rightIcon={<Check className="w-4 h-4" />}
                >
                  Finish
                </Button>
              )}
            </div>
          )}

        </Card>
      </div>
    </div>
  );
};
