'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import GoogleAuthButton from './GoogleAuthButton';

interface AuthFormProps {
  mode: 'login' | 'signup' | 'reset';
  onSuccess?: () => void;
}

export default function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'signup') {
        // First, create the user without email confirmation
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/callback`,
          },
        });
        
        if (error) throw error;
        
        // Send our custom confirmation email
        if (data.user && !data.user.email_confirmed_at) {
          const emailResponse = await fetch('/api/auth/send-confirmation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });
          
          if (emailResponse.ok) {
            setMessage('Account created! Please check your email for a confirmation link from Visagify.');
          } else {
            setMessage('Account created, but we couldn\'t send the confirmation email. Please contact support.');
          }
        } else {
          setMessage('Account created successfully!');
        }
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        setMessage('Successfully logged in!');
        onSuccess?.();
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        
        if (error) throw error;
        setMessage('Check your email for the password reset link!');
      }
      } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signup': return 'Create your account';
      case 'login': return 'Sign in to your account';
      case 'reset': return 'Reset your password';
    }
  };

  const getButtonText = () => {
    switch (mode) {
      case 'signup': return 'Sign up';
      case 'login': return 'Sign in';
      case 'reset': return 'Send reset link';
    }
  };

  return (
    <div className="bg-black rounded-lg border border-bright-lavender-800 p-8 shadow-xl">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {getTitle()}
          </h2>
        </div>
        {mode !== 'reset' && (
          <div className="mt-8">
            <GoogleAuthButton mode={mode} />
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-bright-lavender-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-black text-bright-lavender-300">Or continue with email</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-bright-lavender-700 placeholder-bright-lavender-400 text-white bg-black rounded-t-md focus:outline-none focus:ring-bright-lavender-500 focus:border-bright-lavender-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {mode !== 'reset' && (
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-bright-lavender-700 placeholder-bright-lavender-400 text-white bg-black rounded-b-md focus:outline-none focus:ring-bright-lavender-500 focus:border-bright-lavender-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-950 border border-red-700 rounded-md p-3">{error}</div>
          )}

          {message && (
            <div className="text-green-400 text-sm text-center bg-green-950 border border-green-700 rounded-md p-3">{message}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-bright-lavender-600 hover:bg-bright-lavender-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bright-lavender-500 disabled:opacity-50 focus:ring-offset-black"
            >
              {loading ? 'Loading...' : getButtonText()}
            </button>
          </div>

          <div className="text-center">
            {mode === 'login' && (
              <div className="space-y-2">
                <a href="/reset-password" className="text-bright-lavender-400 hover:text-bright-lavender-300 text-sm">
                  Forgot your password?
                </a>
                <div>
                  <span className="text-sm text-bright-lavender-200">Don&apos;t have an account? </span>
                  <a href="/signup" className="text-bright-lavender-400 hover:text-bright-lavender-300 text-sm">
                    Sign up
                  </a>
                </div>
              </div>
            )}
            {mode === 'signup' && (
              <div>
                <span className="text-sm text-bright-lavender-200">Already have an account? </span>
                <a href="/login" className="text-bright-lavender-400 hover:text-bright-lavender-300 text-sm">
                  Sign in
                </a>
              </div>
            )}
            {mode === 'reset' && (
              <div>
                <span className="text-sm text-bright-lavender-200">Remember your password? </span>
                <a href="/login" className="text-bright-lavender-400 hover:text-bright-lavender-300 text-sm">
                  Sign in
                </a>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
