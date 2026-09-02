import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, LayoutDashboard, Sparkles, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  // useJobs is disabled (GET /api/jobs not yet on backend)
  // Show polished empty state with CTA as per implementation plan

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">My Thumbnails</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage and view your AI-generated thumbnails
          </p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center gap-2 gradient-button px-4 py-2.5 rounded-xl text-sm font-semibold"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Create New</span>
        </Link>
      </div>

      <div className="glass-panel rounded-2xl border border-dashed border-slate-700 p-12 md:p-16 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600/20 to-pink-500/20 border border-brand-500/30 flex items-center justify-center mb-5">
          <LayoutDashboard className="w-8 h-8 text-brand-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          No thumbnails yet
        </h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6 leading-relaxed">
          Create your first YouTube thumbnail in seconds. Upload a headshot,
          describe your style, and let AI do the rest.
        </p>
        <Link
          to="/create"
          className="inline-flex items-center gap-2 gradient-button px-6 py-3 rounded-xl text-sm font-semibold"
        >
          <Sparkles className="w-4 h-4" />
          Create your first thumbnail
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
