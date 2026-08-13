import React, { useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useProfile } from '../hooks/useProfile';
import { useLearning } from '../hooks/useLearning';
import { useAppSelector } from '../store';
import { useAuth } from '../hooks/useAuth';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { fetchCurrentUser } = useAuth();
  const { token, isInitialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (token && !isInitialized) {
      fetchCurrentUser().catch((err) => {
        console.error('Failed to bootstrap user session:', err);
      });
    }
  }, [token, isInitialized, fetchCurrentUser]);

  // Bootstrap global user profile and learning progress states from the database
  useProfile();
  useLearning();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FBFF] text-slate-800 relative selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Page Body */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-4">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

