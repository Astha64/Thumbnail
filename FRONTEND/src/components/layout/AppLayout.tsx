import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { Sparkles, LayoutDashboard, PlusCircle, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface-dark text-slate-100 flex flex-col font-sans">
      {/* Persistent Navigation Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-surface-border backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo Link */}
          <Link to="/dashboard" className="flex items-center gap-2.5 font-extrabold text-xl text-white">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>Thumbnail<span className="gradient-text">AI</span></span>
          </Link>

          {/* Nav Links */}
          <nav className="flex items-center gap-2 sm:gap-4">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/create"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )
              }
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New</span>
            </NavLink>
          </nav>

          {/* Logout Button */}
          <div className="flex items-center gap-3 border-l border-surface-border pl-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-rose-400 transition-colors px-2 py-1 rounded hover:bg-rose-500/10"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container rendering nested routes */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
