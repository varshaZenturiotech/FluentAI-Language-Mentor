import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../common/Button';
import { MessageSquare, LayoutDashboard, TrendingUp, User, Settings, Sparkles, Flame, Menu, X, LogOut, BookOpen } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const totalXp = useAppSelector((state) => state.user.totalXp);
  const currentStreak = useAppSelector((state) => state.user.currentStreakDays);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { label: string; path: string; icon?: React.ReactNode }[] = isAuthenticated ? [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Conversation', path: '/conversation', icon: <MessageSquare className="w-4 h-4" /> },
    { label: 'Study Plan', path: '/study-plan', icon: <BookOpen className="w-4 h-4" /> },
    { label: 'Progress', path: '/progress', icon: <TrendingUp className="w-4 h-4" /> },
    { label: 'Profile', path: '/profile', icon: <User className="w-4 h-4" /> },
    { label: 'Settings', path: '/settings', icon: <Settings className="w-4 h-4" /> },
  ] : [
    { label: 'Home', path: '/' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 px-4 sm:px-6 lg:px-8 pt-3 pb-3 transition-all">
      <nav className="max-w-7xl mx-auto glass-nav rounded-3xl px-4 sm:px-6 py-2.5 shadow-md shadow-indigo-950/5 flex items-center justify-between border border-white/80">
        
        {/* Brand Logo */}
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform">
            F
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-slate-900 leading-none">
              Fluent<span className="gradient-text">AI</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mt-0.5">
              Malayalam ➔ English
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/50">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                isActive(link.path)
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {/* User Status / XP Pill & Auth CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* Streak & XP Pill */}
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-2xl text-xs font-bold text-slate-800">
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="w-4 h-4 fill-orange-500" />
                  <span>{currentStreak}d</span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1 text-amber-600">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{totalXp} XP</span>
                </div>
              </div>

              {/* Profile Avatar Link */}
              <Link to="/profile" className="flex items-center gap-2 group">
                <img
                  src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  alt={user.name}
                  className="w-9 h-9 rounded-2xl object-cover ring-2 ring-indigo-200 group-hover:ring-indigo-500 transition-all"
                />
              </Link>

              {/* Logout Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={logout}
                className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold px-3 py-1.5 rounded-2xl flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button size="sm" variant="ghost">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" variant="primary">
                  Start Free
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 glass-card rounded-3xl p-4 shadow-2xl border border-white/90 space-y-2 animate-fadeIn">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold ${
                isActive(link.path) ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {!isAuthenticated ? (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center">
                    Log in
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full justify-center">
                    Start Learning Free
                  </Button>
                </Link>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs font-bold text-indigo-900">
                  <span>{user?.name}</span>
                  <span>{totalXp} XP • {currentStreak}d Streak</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-center text-rose-600 border-rose-200 hover:bg-rose-50 py-3 flex items-center gap-1.5"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
