import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Set membership price (in cents) - adjust this to your actual price
    const MEMBERSHIP_PRICE_CENTS = 500; // $5 - change this!

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: MEMBERSHIP_PRICE_CENTS,
      currency: 'usd',
      metadata: {
        userId: userId,
        type: 'membership',
      },
    });

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret 
    });
  } catch (error: any) {
    console.error('Payment intent error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

