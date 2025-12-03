'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check if it's a configuration/network error
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          setMessage('Unable to connect to authentication server. This may be a configuration issue. Please contact support if this persists.');
        } else {
          setMessage(error.message);
        }
        console.error('Login error:', error);
      } else {
        setMessage('Login successful! Redirecting...');
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      console.error('Login exception:', err);
      // Check for network/configuration errors
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.name === 'TypeError') {
        setMessage('Unable to connect to authentication server. This may be a configuration issue. Please contact support if this persists.');
      } else {
        setMessage(err.message || 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-lg shadow-md p-8" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 className="text-center mb-12" style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-inter)', fontSize: '1.6rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px' }}>SIGN IN</h1>
        
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

          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.includes('successful')
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
            {loading ? 'Logging in...' : 'Sign in'}
          </button>

          <div className="text-center">
            <Link href="/forgot-password" className="underline text-sm" style={{ fontFamily: 'var(--font-inter)', color: '#ff6622' }}>
              Forgot password?
            </Link>
          </div>

          <div className="text-center text-sm" style={{ color: 'var(--text-light)', fontFamily: 'var(--font-inter)' }}>
            Don't have an account?{' '}
            <Link href="/signup" className="underline" style={{ color: '#ff6622' }}>
              Sign Up here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

