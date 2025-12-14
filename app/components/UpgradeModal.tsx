'use client';

import { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
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
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
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

  // Create subscription when component mounts
  useEffect(() => {
    const createSubscription = async () => {
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

      try {
        const response = await fetch('/api/payments/create-intent', {
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
          return;
        }

        setClientSecret(data.clientSecret);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize payment');
      }
    };

    if ((actualUserId || userId) && userEmail) {
      createSubscription();
    }
  }, [actualUserId, userId, userEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Card element not found');
      setLoading(false);
      return;
    }

    try {
      // Confirm payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        setLoading(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Payment succeeded, subscription is now active
        // The webhook will handle updating the membership status
        // But we can also call the upgrade endpoint immediately for faster UX
        const userIdToUse = actualUserId || userId;
        if (userIdToUse) {
          try {
            const upgradeResponse = await fetch('/api/membership/upgrade', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userId: userIdToUse }),
            });

            const upgradeData = await upgradeResponse.json();
            
            // Don't fail if upgrade endpoint has issues - webhook will handle it
            if (upgradeData.error) {
              console.warn('Upgrade endpoint error:', upgradeData.error);
            }
          } catch (err) {
            console.warn('Error calling upgrade endpoint:', err);
            // Continue anyway - webhook will handle it
          }
        }

        // Refresh user session to get updated metadata
        await supabase.auth.refreshSession();
        
        // Call success callback and close modal
        // The page will update membership status through the auth state listener
        onSuccess();
        onClose();
      } else if (paymentIntent?.status === 'requires_action') {
        // Payment requires additional authentication
        setError('Please complete the authentication steps shown by your bank.');
        setLoading(false);
      } else {
        setError('Payment did not complete successfully');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during payment');
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#2c2c2c',
        fontFamily: 'var(--font-inter), system-ui, sans-serif',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
  };

  if (!clientSecret) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        {error ? (
          <>
            <p style={{ color: '#c33', fontFamily: 'var(--font-inter)', marginBottom: '1rem' }}>
              {error}
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                fontSize: '0.9rem',
                fontFamily: 'var(--font-inter)',
                borderRadius: '6px',
                border: '1px solid #ccc',
                backgroundColor: 'white',
                color: 'var(--text-dark)',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </>
        ) : (
          <p style={{ color: 'var(--text-light)', fontFamily: 'var(--font-inter)' }}>
            Initializing payment...
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.95rem',
            fontWeight: 400,
            color: 'var(--text-light)',
            fontFamily: 'var(--font-inter)',
          }}
        >
          Card Information
        </label>
        <div
          style={{
            padding: '12px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            backgroundColor: 'white',
          }}
        >
          <CardElement options={cardElementOptions} />
        </div>
      </div>

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
          type="submit"
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
          {loading ? 'Processing...' : 'Complete Payment'}
        </button>
      </div>
    </form>
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

