import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-24 h-24 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 font-black text-5xl shadow-xl shadow-indigo-500/10">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900">Page Not Found</h1>
          <p className="text-slate-500 text-sm font-medium">
            The conversation scenario or page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to="/">
            <Button variant="primary" size="lg" leftIcon={<Home className="w-5 h-5" />}>
              Back to Home
            </Button>
          </Link>
          <Link to="/conversation">
            <Button variant="outline" size="lg" leftIcon={<ArrowLeft className="w-5 h-5" />}>
              Start Conversation
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
