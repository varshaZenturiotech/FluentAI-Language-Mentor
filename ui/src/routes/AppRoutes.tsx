import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ConversationPage } from '../pages/ConversationPage';
import { StudyPlanPage } from '../pages/StudyPlanPage';
import { ProfilePage } from '../pages/ProfilePage';
import { ProgressPage } from '../pages/ProgressPage';
import { SettingsPage } from '../pages/SettingsPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { LearningOnboardingPage } from '../pages/LearningOnboardingPage';
import { BaselineAssessmentPage } from '../pages/BaselineAssessmentPage';
import { useAppSelector } from '../store';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium">Verifying session...</p>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/conversation"
        element={
          <ProtectedRoute>
            <ConversationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/study-plan"
        element={
          <ProtectedRoute>
            <StudyPlanPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <ProgressPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learning-onboarding"
        element={
          <ProtectedRoute>
            <LearningOnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/baseline-assessment"
        element={
          <ProtectedRoute>
            <BaselineAssessmentPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
