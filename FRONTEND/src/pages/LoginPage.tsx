import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-white text-center">Welcome back</h1>
      <p className="text-sm text-slate-400 text-center mt-1 mb-6">
        Sign in to your ThumbnailAI account
      </p>
      <LoginForm />
    </div>
  );
}
