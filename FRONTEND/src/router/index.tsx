import React from 'react';
import { createBrowserRouter, Navigate, useParams, Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import AuthLayout from '../components/layout/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LayoutDashboard, PlusCircle, Sparkles, ArrowRight } from 'lucide-react';

// Temporary placeholder pages
function LoginPagePlaceholder() {
  return (
    <div className="space-y-4 text-center">
      <h2 className="text-xl font-bold text-white">Login Page Placeholder</h2>
      <p className="text-slate-400 text-sm">Authentication form components ready for Module 4 integration testing.</p>
      <div className="pt-4 border-t border-slate-800 flex justify-center gap-4 text-xs">
        <Link to="/signup" className="text-brand-400 hover:underline">Don't have an account? Sign Up</Link>
        <span className="text-slate-600">|</span>
        <Link to="/dashboard" className="text-slate-400 hover:underline">Preview Dashboard →</Link>
      </div>
    </div>
  );
}

function SignupPagePlaceholder() {
  return (
    <div className="space-y-4 text-center">
      <h2 className="text-xl font-bold text-white">Signup Page Placeholder</h2>
      <p className="text-slate-400 text-sm">User registration connected to POST /auth/signup.</p>
      <div className="pt-4 border-t border-slate-800 flex justify-center gap-4 text-xs">
        <Link to="/login" className="text-brand-400 hover:underline">Already registered? Log In</Link>
      </div>
    </div>
  );
}

function DashboardPagePlaceholder() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">My Thumbnail Jobs</h1>
          <p className="text-slate-400 text-sm mt-1">Manage and view your generated AI thumbnails</p>
        </div>
        <Link to="/create" className="gradient-button px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Create New Job
        </Link>
      </div>

      <div className="glass-panel rounded-2xl p-12 text-center border border-dashed border-slate-800">
        <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto mb-4 border border-brand-500/20">
          <LayoutDashboard className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-white">Protected Dashboard Access Verified</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto mt-2">
          You are authenticated! This page is protected by <code className="text-brand-300 bg-slate-900 px-1.5 py-0.5 rounded">&lt;ProtectedRoute /&gt;</code>.
        </p>
      </div>
    </div>
  );
}

function CreatePagePlaceholder() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Generate Thumbnails</h1>
        <p className="text-slate-400 text-sm mt-1">Step 1: Upload Headshot → Step 2: Set Prompt & Options</p>
      </div>

      <div className="glass-panel rounded-2xl p-8 border border-surface-border space-y-4">
        <h3 className="text-lg font-semibold text-white">Thumbnail Workflow Placeholder</h3>
        <p className="text-slate-400 text-sm">
          Headshot uploader and prompt options will submit to <code className="text-brand-300 bg-slate-900 px-1.5 py-0.5 rounded">POST /api/upload_headshot</code> and <code className="text-brand-300 bg-slate-900 px-1.5 py-0.5 rounded">POST /api/job</code> in Module 7.
        </p>
        <Link to="/job/demo-job-123" className="inline-flex items-center gap-2 text-xs font-semibold text-brand-400 hover:text-brand-300">
          Simulate created job navigation <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

function JobPagePlaceholder() {
  const { jobId } = useParams<{ jobId: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20 mb-2">
            <Sparkles className="w-3 h-3" /> Job ID: {jobId}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Generation Results & Real-Time Stream</h1>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-8 border border-surface-border text-center">
        <h3 className="text-lg font-semibold text-white">SSE Stream Placeholder</h3>
        <p className="text-slate-400 text-sm max-w-lg mx-auto mt-2">
          This page will consume <code className="text-brand-300 bg-slate-900 px-1.5 py-0.5 rounded">GET /api/job/{jobId}/stream</code> using <code className="text-brand-300 bg-slate-900 px-1.5 py-0.5 rounded">@microsoft/fetch-event-source</code> in Module 8.
        </p>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPagePlaceholder />,
      },
      {
        path: 'signup',
        element: <SignupPagePlaceholder />,
      },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <DashboardPagePlaceholder />,
      },
      {
        path: 'create',
        element: <CreatePagePlaceholder />,
      },
      {
        path: 'job/:jobId',
        element: <JobPagePlaceholder />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
