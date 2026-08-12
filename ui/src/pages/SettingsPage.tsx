import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAppSelector, useAppDispatch } from '../store';
import { updateSettings } from '../store/settingsSlice';
import { 
  Volume2, 
  Globe, 
  Bell, 
  RotateCcw, 
  CheckCircle2, 
  BookOpen, 
  Sparkles, 
  Heart, 
  Target,
  Check 
} from 'lucide-react';
import { learningProfileApi, LearningProfile } from '../api/learning-profile.api';

export const SettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);

  // Learning Profile states
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await learningProfileApi.getProfile();
        if (res && res.profile) {
          setProfile(res.profile);
        } else {
          setProfile({
            ageGroup: '25-34',
            occupation: 'Software Engineer',
            englishLevel: 'Intermediate',
            nativeLanguage: 'Malayalam',
            dailyGoal: 20,
            goals: ['Speak confidently'],
            interests: ['Technology', 'AI'],
          });
        }
      } catch (err) {
        console.error('Error fetching learning profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const ageGroups = ['Under 13', '13–17', '18–24', '25–34', '35–44', '45+'];
  
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

  const dailyGoals = [
    { label: '10 mins', value: 10 },
    { label: '20 mins', value: 20 },
    { label: '30 mins', value: 30 },
    { label: '45 mins', value: 45 },
    { label: '60 mins', value: 60 },
  ];

  const handleGoalToggle = (goal: string) => {
    if (!profile) return;
    const currentGoals = profile.goals || [];
    const newGoals = currentGoals.includes(goal)
      ? currentGoals.filter((g) => g !== goal)
      : [...currentGoals, goal];
    setProfile({ ...profile, goals: newGoals });
  };

  const handleInterestToggle = (interest: string) => {
    if (!profile) return;
    const currentInterests = profile.interests || [];
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter((i) => i !== interest)
      : [...currentInterests, interest];
    setProfile({ ...profile, interests: newInterests });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      await learningProfileApi.updateProfile(profile);
      setProfileSuccess('Learning preferences updated successfully!');
      setTimeout(() => setProfileSuccess(null), 5000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to save preferences.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <PageHeader
        title="Application Settings"
        subtitle="Customize voice speed, AI mentor gender, Malayalam translations, and learning preferences"
        badgeText="Preferences"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              dispatch(
                updateSettings({
                  theme: 'light',
                  audioEnabled: true,
                  voiceSpeed: '1.0x',
                  voiceGender: 'Female',
                  showMalayalamTranslations: true,
                })
              )
            }
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Defaults
          </Button>
        }
      />

      {/* Learning Preferences Card */}
      <Card variant="glass" className="p-6 sm:p-8 rounded-[32px] border border-white/90 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Learning Preferences</h3>
            <p className="text-xs text-slate-500 font-medium">Personalize all AI conversations, lessons, and recommendations</p>
          </div>
        </div>

        {loadingProfile ? (
          <div className="py-8 text-center text-sm font-semibold text-slate-500">
            Loading preferences...
          </div>
        ) : profile ? (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {profileError && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-xs font-semibold">
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl text-xs font-semibold">
                {profileSuccess}
              </div>
            )}

            {/* Age & English Level Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Age Group */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Age Group
                </label>
                <select
                  value={profile.ageGroup}
                  onChange={(e) => setProfile({ ...profile, ageGroup: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-slate-200 bg-white/90 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Age Group</option>
                  {ageGroups.map((age) => (
                    <option key={age} value={age}>{age}</option>
                  ))}
                </select>
              </div>

              {/* English Level */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  English Level
                </label>
                <select
                  value={profile.englishLevel}
                  onChange={(e) => setProfile({ ...profile, englishLevel: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-slate-200 bg-white/90 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Level</option>
                  {englishLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Occupation & Daily Goal Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Occupation */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Occupation
                </label>
                <input
                  type="text"
                  value={profile.occupation || ''}
                  onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                  placeholder="e.g. Software Engineer"
                  className="w-full p-3 rounded-2xl border border-slate-200 bg-white/90 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Daily Goal */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Daily Goal
                </label>
                <select
                  value={profile.dailyGoal}
                  onChange={(e) => setProfile({ ...profile, dailyGoal: Number(e.target.value) })}
                  className="w-full p-3 rounded-2xl border border-slate-200 bg-white/90 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {dailyGoals.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Native Language */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Native Language
              </label>
              <select
                value={profile.nativeLanguage}
                onChange={(e) => setProfile({ ...profile, nativeLanguage: e.target.value })}
                className="w-full p-3 rounded-2xl border border-slate-200 bg-white/90 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Malayalam">Malayalam (മലയാളം) 🇮🇳</option>
              </select>
            </div>

            {/* Learning Goals */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                <span>Learning Goals</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {goals.map((g) => {
                  const isSelected = (profile.goals || []).includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleGoalToggle(g)}
                      className={`p-2.5 rounded-2xl text-[11px] font-extrabold border transition-all text-left flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-sm'
                          : 'border-slate-200 bg-white/70 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{g}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interests */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>Interests</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {interests.map((interest) => {
                  const isSelected = (profile.interests || []).includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleInterestToggle(interest)}
                      className={`p-2.5 rounded-2xl text-[10px] font-extrabold border transition-all text-center ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-sm'
                          : 'border-slate-200 bg-white/70 text-slate-700 hover:border-indigo-300'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={savingProfile}
              >
                Save Learning Preferences
              </Button>
            </div>
          </form>
        ) : (
          <div className="py-8 text-center text-sm font-semibold text-rose-500">
            Failed to load preferences. Please try refreshing.
          </div>
        )}
      </Card>

      {/* Voice & Audio Settings Card */}
      <Card variant="glass" className="p-6 sm:p-8 rounded-[32px] border border-white/90 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">AI Voice & Audio Mentor</h3>
            <p className="text-xs text-slate-500 font-medium">Configure voice synthesis and playback options</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Voice Speed */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              AI Voice Speed
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['0.75x', '1.0x', '1.25x', '1.5x'] as const).map((speed) => (
                <button
                  key={speed}
                  onClick={() => dispatch(updateSettings({ voiceSpeed: speed }))}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-extrabold transition-all border ${
                    settings.voiceSpeed === speed
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-white/80 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {speed} {speed === '1.0x' ? '(Normal)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Gender */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              AI Mentor Voice Persona
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['Female', 'Male', 'Neutral'] as const).map((gender) => (
                <button
                  key={gender}
                  onClick={() => dispatch(updateSettings({ voiceGender: gender }))}
                  className={`py-3 px-4 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                    settings.voiceGender === gender
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-white/80 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {settings.voiceGender === gender && <CheckCircle2 className="w-4 h-4 text-white" />}
                  <span>{gender} Persona</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Language Pair & Malayalam Support Card */}
      <Card variant="glass" className="p-6 sm:p-8 rounded-[32px] border border-white/90 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Language Pair & Translations</h3>
            <p className="text-xs text-slate-500 font-medium">Bilingual bridge configuration</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/80 rounded-2xl border border-slate-200/60">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Show Malayalam Translations</h4>
              <p className="text-xs text-slate-500">Display parallel Malayalam translations in chat bubbles</p>
            </div>
            <input
              type="checkbox"
              checked={settings.showMalayalamTranslations}
              onChange={(e) => dispatch(updateSettings({ showMalayalamTranslations: e.target.checked }))}
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300 cursor-pointer"
            />
          </div>
        </div>
      </Card>

      {/* Notifications & Theme */}
      <Card variant="glass" className="p-6 sm:p-8 rounded-[32px] border border-white/90 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Notifications & Reminders</h3>
            <p className="text-xs text-slate-500 font-medium">Daily practice reminders to keep your streak</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/80 rounded-2xl border border-slate-200/60">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Daily Voice Practice Reminder</h4>
              <p className="text-xs text-slate-500">Receive a daily notification at 10:00 AM to practice</p>
            </div>
            <input
              type="checkbox"
              checked={settings.dailyReminder}
              onChange={(e) => dispatch(updateSettings({ dailyReminder: e.target.checked }))}
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300 cursor-pointer"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
