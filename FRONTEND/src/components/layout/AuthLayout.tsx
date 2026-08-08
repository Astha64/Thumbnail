import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow ambient background sphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-600/15 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight text-white hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <span>Thumbnail<span className="gradient-text">AI</span></span>
          </Link>
          <p className="text-slate-400 text-sm mt-2">
            Create high-converting YouTube thumbnails in seconds
          </p>
        </div>

        {/* Nested Auth Child Route Content */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 border border-surface-border shadow-2xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
