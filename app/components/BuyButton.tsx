'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import styles from '../styles/ArtworkDetail.module.css';

interface BuyButtonProps {
  artworkId: string;
  artworkTitle: string;
  priceInCents: number;
  disabled?: boolean;
}

export default function BuyButton({ 
  artworkId, 
  artworkTitle, 
  priceInCents,
  disabled = false 
}: BuyButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (disabled || loading) return;

    setLoading(true);

    try {
      // Create checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artworkId,
          artworkTitle,
          priceInCents,
        }),
      });

      const { sessionId, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Redirect to Stripe Checkout
      // Note: Client-side environment variables must be prefixed with NEXT_PUBLIC_
      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) {
        throw new Error('Stripe publishable key is not configured.');
      }
      
      const stripe = await loadStripe(publishableKey);
      if (!stripe) {
        throw new Error('Stripe failed to load.');
      }
      
      await stripe.redirectToCheckout({ sessionId });
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || 'Failed to initiate checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <button 
      className={styles.buyButton} 
      onClick={handleCheckout}
      disabled={disabled || loading}
    >
      {loading ? 'Processing...' : 'Buy Now'}
    </button>
  );
}
