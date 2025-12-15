import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseServer } from '@/lib/supabase-server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// This endpoint can verify a subscription by customer email or subscription ID
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerEmail, subscriptionId } = body;

    if (!customerEmail && !subscriptionId) {
      return NextResponse.json(
        { error: 'Either customer email or subscription ID is required' },
        { status: 400 }
      );
    }

    let subscription: Stripe.Subscription | null = null;

    if (subscriptionId) {
      // Get subscription directly
      subscription = await stripe.subscriptions.retrieve(subscriptionId);
    } else if (customerEmail) {
      // Find customer by email
      const customers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      });

      if (customers.data.length === 0) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      const customer = customers.data[0];

      // Get customer's subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 1,
        status: 'all',
      });

      if (subscriptions.data.length === 0) {
        return NextResponse.json(
          { error: 'No subscription found for this customer' },
          { status: 404 }
        );
      }

      subscription = subscriptions.data[0];
    }

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Check if this is a membership subscription
    if (!subscription.metadata?.type || subscription.metadata.type !== 'membership' || !subscription.metadata.userId) {
      return NextResponse.json(
        { error: 'This subscription is not a membership subscription or is missing userId metadata' },
        { status: 400 }
      );
    }

    const userId = subscription.metadata.userId;
    const isActive = subscription.status === 'active' || subscription.status === 'trialing';

    // Get current user
    const { data: { user }, error: getUserError } = await supabaseServer.auth.admin.getUserById(userId);

    if (getUserError || !user) {
      console.error('Error fetching user:', getUserError);
      return NextResponse.json(
        { error: 'User not found', details: getUserError?.message },
        { status: 404 }
      );
    }

    // Update user metadata
    const updatedMetadata = {
      ...(user.user_metadata || {}),
      membership_status: isActive ? 'active' : subscription.status,
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
      userId,
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      membershipStatus: isActive ? 'active' : subscription.status,
      message: 'Membership updated successfully'
    });
  } catch (error: any) {
    console.error('Verify subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify subscription' },
      { status: 500 }
    );
  }
}

