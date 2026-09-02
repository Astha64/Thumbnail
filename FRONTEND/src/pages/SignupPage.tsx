import React from 'react';
import { SignupForm } from '../components/auth/SignupForm';

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-white text-center">Create your account</h1>
      <p className="text-sm text-slate-400 text-center mt-1 mb-6">
        Start generating thumbnails in seconds
      </p>
      <SignupForm />
    </div>
  );
}
