import React, { useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { useAppSelector, useAppDispatch } from '../store';
import { updateUserProfile } from '../store/userSlice';
import { User, Flame, Award, BookOpen, Clock, Edit3, ShieldCheck, Languages, Sparkles } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.user);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editEmail, setEditEmail] = useState(profile.email);
  const [editLevel, setEditLevel] = useState(profile.level);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(
      updateUserProfile({
        name: editName,
        email: editEmail,
        level: editLevel,
      })
    );
    setIsEditModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <PageHeader
        title="User Profile"
        subtitle="Manage your learning identity, native language settings, and achievements"
        badgeText="Account Overview"
        action={
          <Button
            variant="primary"
            onClick={() => setIsEditModalOpen(true)}
            leftIcon={<Edit3 className="w-4 h-4" />}
          >
            Edit Profile
          </Button>
        }
      />

      {/* Main Profile Header Card */}
      <Card variant="glass" glow className="p-8 rounded-[36px] border border-white/90 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-28 h-28 md:w-32 md:h-32 rounded-3xl object-cover ring-4 ring-indigo-200 shadow-xl"
            />
            <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl shadow-md border-2 border-white">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>

          {/* Details */}
          <div className="space-y-3 text-center md:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h2 className="text-3xl font-black text-slate-900">{profile.name}</h2>
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200">
                {profile.level} Speaker
              </span>
            </div>

            <p className="text-sm text-slate-500 font-medium">{profile.email}</p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs font-bold text-slate-700">
              <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-2xl border border-slate-200/60 shadow-sm">
                <Languages className="w-4 h-4 text-indigo-600" />
                <span>Native: {profile.nativeLanguage}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-2xl border border-slate-200/60 shadow-sm">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Learning: {profile.learningLanguage}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-2xl border border-amber-200 text-amber-900 shadow-sm">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{profile.currentStreakDays} Day Streak</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Learning Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="glass" className="p-6 rounded-3xl border border-white/90 flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
            <Flame className="w-6 h-6 fill-amber-500" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Total XP</span>
            <h3 className="text-2xl font-black text-slate-900">{profile.totalXp} XP</h3>
          </div>
        </Card>

        <Card variant="glass" className="p-6 rounded-3xl border border-white/90 flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Speaking Time</span>
            <h3 className="text-2xl font-black text-slate-900">{profile.speakingTimeMinutes} mins</h3>
          </div>
        </Card>

        <Card variant="glass" className="p-6 rounded-3xl border border-white/90 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Vocabulary</span>
            <h3 className="text-2xl font-black text-slate-900">{profile.vocabularyCount} Words</h3>
          </div>
        </Card>

        <Card variant="glass" className="p-6 rounded-3xl border border-white/90 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Grammar Score</span>
            <h3 className="text-2xl font-black text-slate-900">{profile.grammarAccuracy}%</h3>
          </div>
        </Card>
      </div>

      {/* Achievements Section */}
      <Card variant="glass" className="p-8 rounded-[36px] border border-white/90 shadow-xl space-y-6">
        <div>
          <h3 className="text-2xl font-black text-slate-900">Unlocked Achievements</h3>
          <p className="text-xs text-slate-500 font-medium">Badges earned through consistent spoken English practice</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-5 rounded-3xl border flex items-start gap-4 transition-all ${
                ach.isUnlocked
                  ? 'bg-white/90 border-emerald-200/80 shadow-sm'
                  : 'bg-slate-50/70 border-slate-200 opacity-60'
              }`}
            >
              <div
                className={`p-3 rounded-2xl font-bold shrink-0 ${
                  ach.isUnlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                }`}
              >
                <Award className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-base">{ach.title}</h4>
                  {ach.isUnlocked && (
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                      Unlocked
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">{ach.description}</p>
                {ach.unlockedAt && (
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Earned on {ach.unlockedAt}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Profile Details">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Full Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            icon={<User className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              English Skill Level
            </label>
            <select
              value={editLevel}
              onChange={(e) => setEditLevel(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
