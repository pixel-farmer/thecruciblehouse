import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseServer } from '@/lib/supabase-server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.mode !== 'subscription' || !session.metadata?.type || session.metadata.type !== 'membership' || !session.metadata.userId) {
      return NextResponse.json(
        { error: 'Invalid session or not a membership subscription' },
        { status: 400 }
      );
    }

    const userId = session.metadata.userId;
    const subscriptionId = session.subscription as string;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'No subscription found for this session' },
        { status: 400 }
      );
    }

    // Retrieve the subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (!subscription.metadata?.type || subscription.metadata.type !== 'membership' || !subscription.metadata.userId) {
      return NextResponse.json(
        { error: 'Subscription metadata is missing or invalid' },
        { status: 400 }
      );
    }

    const isActive = subscription.status === 'active' || subscription.status === 'trialing';

    // Get current user
    const { data: { user }, error: getUserError } = await supabaseServer.auth.admin.getUserById(userId);

    if (getUserError || !user) {
      console.error('Error fetching user:', getUserError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user metadata
    const updatedMetadata = {
      ...(user.user_metadata || {}),
      membership_status: isActive ? 'active' : 'inactive',
      has_paid_membership: isActive,
      membership_purchased_at: new Date(subscription.created * 1000).toISOString(),
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
    };

    const { error: updateError } = await supabaseServer.auth.admin.updateUserById(
      userId,
      { user_metadata: updatedMetadata }
    );

    if (updateError) {
      console.error('Error updating user membership:', updateError);
      return NextResponse.json(
        { error: 'Failed to update membership', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      membership_status: isActive ? 'active' : subscription.status,
      message: 'Membership updated successfully'
    });
  } catch (error: any) {
    console.error('Verify checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify checkout session' },
      { status: 500 }
    );
  }
}

