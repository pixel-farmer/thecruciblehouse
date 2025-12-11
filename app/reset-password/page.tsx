'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if we have a valid session (from the reset link)
    const checkSession = async () => {
      try {
        // Check for hash fragments in URL (Supabase uses hash for recovery tokens)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        // If we have hash params with recovery token, let Supabase process them
        if (accessToken && type === 'recovery') {
          // Supabase client will automatically process the hash when detectSessionInUrl is true
          // Wait a moment for it to process, then check session
          setTimeout(async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              setIsValidSession(true);
            } else {
              setIsValidSession(false);
              setMessage('Invalid or expired reset link. Please request a new password reset.');
            }
          }, 1000);
          return;
        }

        // Otherwise check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsValidSession(true);
        } else {
          setIsValidSession(false);
          setMessage('Invalid or expired reset link. Please request a new password reset.');
        }
      } catch (err) {
        console.error('Session check error:', err);
        setIsValidSession(false);
        setMessage('An error occurred while verifying your reset link.');
      }
    };

    checkSession();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        // Check if it's a configuration/network error
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          setMessage('Unable to connect to authentication server. This may be a configuration issue. Please contact support if this persists.');
        } else {
          setMessage(error.message || 'Failed to reset password. Please try again.');
        }
        console.error('Password update error:', error);
        setResetSuccess(false);
      } else {
        setResetSuccess(true);
        setMessage('Password reset successful! Redirecting to login...');
        // Clear form fields
        setPassword('');
        setConfirmPassword('');
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Password reset exception:', err);
      // Check for network/configuration errors
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.name === 'TypeError') {
        setMessage('Unable to connect to authentication server. This may be a configuration issue. Please contact support if this persists.');
      } else {
        setMessage(err.message || 'An unexpected error occurred');
      }
      setResetSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow-md p-8" style={{ width: '100%', maxWidth: '400px' }}>
          <div className="text-center" style={{ fontFamily: 'var(--font-inter)', color: 'var(--text-light)' }}>
            Verifying reset link...
          </div>
        </div>
      </div>
    );
  }

  // Show error if session is invalid
  if (isValidSession === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow-md p-8" style={{ width: '100%', maxWidth: '400px' }}>
          <h1 className="text-center mb-12" style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-inter)', fontSize: '1.6rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px' }}>RESET PASSWORD</h1>
          
          <div
            className="rounded-lg bg-red-100 border-2 border-red-500"
            style={{
              fontSize: '1rem',
              fontWeight: 500,
              lineHeight: '1.6',
              color: 'var(--text-light)',
              padding: '10px',
              borderRadius: '0.75rem',
              marginBottom: '20px',
            }}
          >
            {message}
          </div>

          <div className="text-center space-y-4">
            <Link 
              href="/forgot-password" 
              className="underline block" 
              style={{ color: '#ff6622', fontFamily: 'var(--font-inter)' }}
            >
              Request a new reset link
            </Link>
            <Link 
              href="/login" 
              className="underline block" 
              style={{ color: '#ff6622', fontFamily: 'var(--font-inter)' }}
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-lg shadow-md p-8" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 className="text-center mb-12" style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-inter)', fontSize: '1.6rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px' }}>RESET PASSWORD</h1>
        
        {resetSuccess ? (
          <div className="space-y-6">
            <div
              className="rounded-lg bg-green-100 border-2 border-green-500"
              style={{
                fontSize: '1rem',
                fontWeight: 500,
                lineHeight: '1.6',
                color: 'var(--text-light)',
                padding: '10px',
                borderRadius: '0.75rem',
              }}
            >
              <div style={{ marginBottom: '10px', fontWeight: 600, fontSize: '1.1rem' }}>
                ✓ Password Reset Successful!
              </div>
              {message}
            </div>
            <div className="text-center">
              <Link 
                href="/login" 
                className="underline" 
                style={{ color: '#ff6622', fontFamily: 'var(--font-inter)' }}
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label htmlFor="password" className="block mb-3" style={{ fontSize: '0.95rem', fontWeight: 400, color: 'var(--text-light)', fontFamily: 'var(--font-inter)' }}>
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={6}
                className="w-full px-4 py-6 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ fontFamily: 'var(--font-inter)', borderRadius: '0.75rem' }}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block mb-3" style={{ fontSize: '0.95rem', fontWeight: 400, color: 'var(--text-light)', fontFamily: 'var(--font-inter)' }}>
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
                className="w-full px-4 py-6 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ fontFamily: 'var(--font-inter)', borderRadius: '0.75rem' }}
              />
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.includes('successful') || message.includes('success')
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-6 px-4 rounded-xl focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                fontSize: '0.95rem', 
                fontWeight: 500, 
                textTransform: 'uppercase', 
                letterSpacing: '1px', 
                fontFamily: 'var(--font-inter)', 
                borderRadius: '0.75rem',
                backgroundColor: '#ff6622',
                color: 'white',
                outline: 'none',
                border: 'none',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#e55a1a';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#ff6622';
              }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="text-center">
              <Link href="/login" className="underline text-sm" style={{ fontFamily: 'var(--font-inter)', color: '#ff6622' }}>
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

