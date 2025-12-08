'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid confirmation link');
        return;
      }

      try {
        // Verify token with our API
        const response = await fetch('/api/auth/confirm-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          // If token is valid, the user is already confirmed by our API
          setStatus('success');
          setMessage('Email confirmed successfully! Redirecting to dashboard...');
          
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            router.push('/dashboard/faces');
          }, 3000);
        } else {
          if (data.error === 'Token expired') {
            setStatus('expired');
            setMessage('Confirmation link has expired');
          } else {
            setStatus('error');
            setMessage(data.error || 'Failed to confirm email');
          }
        }
      } catch {
        setStatus('error');
        setMessage('An unexpected error occurred');
      }
    };

    confirmEmail();
  }, [router, searchParams]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bright-lavender-600 mx-auto"></div>
        );
      case 'success':
        return (
          <svg className="h-12 w-12 text-green-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'expired':
        return (
          <svg className="h-12 w-12 text-yellow-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-12 w-12 text-red-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading': return 'Confirming your email...';
      case 'success': return 'Email Confirmed!';
      case 'expired': return 'Link Expired';
      case 'error': return 'Confirmation Failed';
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mb-4">
            {getIcon()}
          </div>
          
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            {getTitle()}
          </h2>
          
          <p className="mt-2 text-sm text-bright-lavender-200">
            {message}
          </p>

          <div className="mt-6 space-y-4">
            {status === 'success' && (
              <div className="bg-green-950 border border-green-700 rounded-md p-4">
                <p className="text-green-200 text-sm">
                  Welcome to Visagify! You&apos;ll be redirected to your dashboard shortly.
                </p>
              </div>
            )}

            {status === 'expired' && (
              <div className="space-y-4">
                <div className="bg-yellow-950 border border-yellow-700 rounded-md p-4">
                  <p className="text-yellow-200 text-sm">
                    Your confirmation link has expired. Please request a new one.
                  </p>
                </div>
                <a
                  href="/signup"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-bright-lavender-600 hover:bg-bright-lavender-700"
                >
                  Sign Up Again
                </a>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="bg-red-950 border border-red-700 rounded-md p-4">
                  <p className="text-red-200 text-sm">
                    There was a problem confirming your email. Please try again or contact support.
                  </p>
                </div>
                <a
                  href="/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-bright-lavender-600 hover:bg-bright-lavender-700"
                >
                  Back to Login
                </a>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </PublicLayout>
  );
}
