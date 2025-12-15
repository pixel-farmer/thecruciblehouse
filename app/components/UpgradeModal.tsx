'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

function CheckoutForm({ onClose, userId, onSuccess }: { onClose: () => void; userId: string; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actualUserId, setActualUserId] = useState<string | null>(userId || null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Get userId and email from session if not provided
  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        if (!actualUserId && session.user.id) {
          setActualUserId(session.user.id);
        }
        if (!userEmail && session.user.email) {
          setUserEmail(session.user.email);
        }
      }
    };
    
    getUserId();
  }, [actualUserId, userEmail]);

  const handleCheckout = async () => {
    const userIdToUse = actualUserId || userId;
    const emailToUse = userEmail;
    
    if (!userIdToUse) {
      setError('Please log in to upgrade your membership.');
      return;
    }

    if (!emailToUse) {
      setError('Email address is required for subscription.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: userIdToUse,
          customerEmail: emailToUse,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Redirect to Stripe Checkout using the session URL
      if (data.url) {
        window.location.href = data.url;
      } else if (data.sessionId) {
        // Fallback: construct the checkout URL from session ID
        window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
      } else {
        setError('Failed to get checkout URL');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize payment');
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {error && (
        <div
          style={{
            padding: '12px',
            marginBottom: '1rem',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c33',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-inter)',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: '0.95rem',
            fontWeight: 500,
            fontFamily: 'var(--font-inter)',
            borderRadius: '8px',
            border: '1px solid #ccc',
            backgroundColor: 'white',
            color: 'var(--text-dark)',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleCheckout}
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: '0.95rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontFamily: 'var(--font-inter)',
            borderRadius: '8px',
            backgroundColor: loading ? '#ccc' : '#ff6622',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease',
          }}
        >
          {loading ? 'Redirecting...' : 'Proceed to Checkout'}
        </button>
      </div>
    </div>
  );
}

export default function UpgradeModal({ isOpen, onClose, userId, onSuccess }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <h2
            style={{
              fontSize: '1.8rem',
              fontWeight: 500,
              fontFamily: 'var(--font-inter)',
              color: 'var(--text-dark)',
              marginBottom: '0.5rem',
            }}
          >
            Upgrade to Pro
          </h2>
          <p
            style={{
              fontSize: '1rem',
              color: 'var(--text-light)',
              fontFamily: 'var(--font-inter)',
              marginBottom: '1rem',
            }}
          >
            Unlock access to community features, artist connections, and more. Recurring monthly subscription.
          </p>
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-inter)', color: 'var(--text-dark)' }}>
                Pro Membership
              </span>
              <span
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-inter)',
                  color: 'var(--text-dark)',
                }}
              >
                $8/month
              </span>
            </div>
          </div>
        </div>

        <CheckoutForm onClose={onClose} userId={userId} onSuccess={onSuccess} />
      </div>
    </div>
  );
}

