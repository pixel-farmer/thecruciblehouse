'use client';

import { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  useStripe,
} from '@stripe/react-stripe-js';
import { supabase } from '@/lib/supabase';

// Only load Stripe if the key is available
const getStripePromise = () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    return null;
  }
  return loadStripe(publishableKey);
};

const stripePromise = getStripePromise();

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

function CheckoutForm({ onClose, userId, onSuccess }: { onClose: () => void; userId: string; onSuccess: () => void }) {
  const stripe = useStripe();
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

      // Redirect to Stripe Checkout
      if (data.sessionId && stripe) {
        // @ts-ignore - redirectToCheckout exists on Stripe instances
        const { error: redirectError } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });

        if (redirectError) {
          setError(redirectError.message || 'Failed to redirect to checkout');
          setLoading(false);
        }
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
          disabled={!stripe || loading}
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

  // Check if Stripe is configured
  if (!stripePromise) {
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
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 500,
              fontFamily: 'var(--font-inter)',
              color: 'var(--text-dark)',
              marginBottom: '1rem',
            }}
          >
            Configuration Error
          </h2>
          <p
            style={{
              fontSize: '1rem',
              color: 'var(--text-light)',
              fontFamily: 'var(--font-inter)',
              marginBottom: '1.5rem',
            }}
          >
            Stripe is not configured. Please add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your environment variables.
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              fontSize: '0.95rem',
              fontWeight: 500,
              fontFamily: 'var(--font-inter)',
              borderRadius: '8px',
              border: '1px solid #ccc',
              backgroundColor: 'white',
              color: 'var(--text-dark)',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

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

        <Elements stripe={stripePromise}>
          <CheckoutForm onClose={onClose} userId={userId} onSuccess={onSuccess} />
        </Elements>
      </div>
    </div>
  );
}

