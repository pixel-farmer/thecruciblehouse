import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseServer } from '@/lib/supabase-server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle payment intent succeeded
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // Only process membership payments
      if (paymentIntent.metadata?.type === 'membership' && paymentIntent.metadata?.userId) {
        const userId = paymentIntent.metadata.userId;

        // Get current user
        const { data: { user }, error: getUserError } = await supabaseServer.auth.admin.getUserById(userId);

        if (getUserError || !user) {
          console.error('Error fetching user:', getUserError);
          return NextResponse.json({ received: true }); // Don't fail webhook
        }

        // Update user metadata
        const updatedMetadata = {
          ...(user.user_metadata || {}),
          membership_status: 'active',
          has_paid_membership: true,
          membership_purchased_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabaseServer.auth.admin.updateUserById(
          userId,
          { user_metadata: updatedMetadata }
        );

        if (updateError) {
          console.error('Error updating user membership:', updateError);
        } else {
          console.log(`Membership activated for user ${userId} via webhook`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

