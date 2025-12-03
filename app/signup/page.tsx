'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      setMessage('Authentication is not configured. Please contact the site administrator.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        // Check if it's a configuration error
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          setMessage('Unable to connect to authentication server. This may be a configuration issue. Please contact support if this persists.');
        } else {
          setMessage(error.message || 'Failed to sign up. Please check your connection and try again.');
        }
        console.error('Sign up error:', error);
        setSignupSuccess(false);
      } else {
        setSignupSuccess(true);
        setMessage('SUCCESS! Please check your email inbox (and spam folder) for a confirmation link. You must click the link to verify your account before you can sign in.');
        // Clear form fields
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      console.error('Sign up exception:', err);
      // Check for network/configuration errors
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.name === 'TypeError') {
        setMessage('Unable to connect to authentication server. This may be a configuration issue. Please contact support if this persists.');
      } else {
        setMessage(err.message || 'Failed to connect to server. Please check your internet connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-lg shadow-md p-8" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 className="text-center mb-12" style={{ color: '#2c2c2c', fontFamily: 'var(--font-inter)', fontSize: '1.6rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px' }}>SIGN UP</h1>
        
        {signupSuccess ? (
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
                ✓ Account Created Successfully!
              </div>
              {message}
            </div>
            <div className="text-center">
              <p className="mb-4" style={{ color: 'var(--text-light)', fontFamily: 'var(--font-inter)' }}>
                Once you've verified your email, you can sign in.
              </p>
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
            <label htmlFor="email" className="block mb-3" style={{ fontSize: '0.95rem', fontWeight: 400, color: 'var(--text-light)', fontFamily: 'var(--font-inter)' }}>
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className="w-full px-4 py-6 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ fontFamily: 'var(--font-inter)', borderRadius: '0.75rem' }}
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-3" style={{ fontSize: '0.95rem', fontWeight: 400, color: 'var(--text-light)', fontFamily: 'var(--font-inter)' }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              required
              className="w-full px-4 py-6 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ fontFamily: 'var(--font-inter)', borderRadius: '0.75rem' }}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block mb-3" style={{ fontSize: '0.95rem', fontWeight: 400, color: 'var(--text-light)', fontFamily: 'var(--font-inter)' }}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="confirm password"
              required
              className="w-full px-4 py-6 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ fontFamily: 'var(--font-inter)', borderRadius: '0.75rem' }}
            />
          </div>

          {message && (
            <div
              className={`rounded-lg ${
                message.includes('SUCCESS') || message.includes('successful')
                  ? 'bg-green-100 border-2 border-green-500'
                  : 'bg-red-100 border-2 border-red-500'
              }`}
              style={{
                fontSize: message.includes('SUCCESS') ? '1rem' : '0.875rem',
                fontWeight: message.includes('SUCCESS') ? 500 : 400,
                lineHeight: '1.6',
                color: 'var(--text-light)',
                padding: '10px',
                borderRadius: '0.75rem',
              }}
            >
              {message.includes('SUCCESS') && (
                <div style={{ marginBottom: '10px', fontWeight: 600, fontSize: '1.1rem' }}>
                  ✓ Account Created Successfully!
                </div>
              )}
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
            {loading ? 'Signing up...' : 'Sign up'}
          </button>

          <div className="text-center text-sm" style={{ color: 'var(--text-light)', fontFamily: 'var(--font-inter)' }}>
            Already have an account?{' '}
            <Link href="/login" className="underline" style={{ color: '#ff6622' }}>
              Sign in here
            </Link>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}

