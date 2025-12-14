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

    // Handle subscription created/updated
    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;

      if (subscription.metadata?.type === 'membership' && subscription.metadata?.userId) {
        const userId = subscription.metadata.userId;
        const isActive = subscription.status === 'active' || subscription.status === 'trialing';

        // Get current user
        const { data: { user }, error: getUserError } = await supabaseServer.auth.admin.getUserById(userId);

        if (getUserError || !user) {
          console.error('Error fetching user:', getUserError);
          return NextResponse.json({ received: true }); // Don't fail webhook
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
        } else {
          console.log(`Membership ${isActive ? 'activated' : 'updated'} for user ${userId} via webhook`);
        }
      }
    }

    // Handle subscription deleted/cancelled
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;

      if (subscription.metadata?.type === 'membership' && subscription.metadata?.userId) {
        const userId = subscription.metadata.userId;

        // Get current user
        const { data: { user }, error: getUserError } = await supabaseServer.auth.admin.getUserById(userId);

        if (getUserError || !user) {
          console.error('Error fetching user:', getUserError);
          return NextResponse.json({ received: true }); // Don't fail webhook
        }

        // Update user metadata to remove membership
        const updatedMetadata = {
          ...(user.user_metadata || {}),
          membership_status: 'cancelled',
          has_paid_membership: false,
        };

        const { error: updateError } = await supabaseServer.auth.admin.updateUserById(
          userId,
          { user_metadata: updatedMetadata }
        );

        if (updateError) {
          console.error('Error cancelling user membership:', updateError);
        } else {
          console.log(`Membership cancelled for user ${userId} via webhook`);
        }
      }
    }

    // Handle invoice payment succeeded (for recurring payments)
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      
      const subscriptionId = (invoice as any).subscription;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
        
        if (subscription.metadata?.type === 'membership' && subscription.metadata?.userId) {
          const userId = subscription.metadata.userId;

          // Get current user
          const { data: { user }, error: getUserError } = await supabaseServer.auth.admin.getUserById(userId);

          if (getUserError || !user) {
            console.error('Error fetching user:', getUserError);
            return NextResponse.json({ received: true }); // Don't fail webhook
          }

          // Update user metadata to ensure membership is active
          const updatedMetadata = {
            ...(user.user_metadata || {}),
            membership_status: 'active',
            has_paid_membership: true,
          };

          const { error: updateError } = await supabaseServer.auth.admin.updateUserById(
            userId,
            { user_metadata: updatedMetadata }
          );

          if (updateError) {
            console.error('Error updating user membership:', updateError);
          } else {
            console.log(`Recurring payment processed for user ${userId} via webhook`);
          }
        }
      }
    }

    // Handle invoice payment failed
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      
      const subscriptionId = (invoice as any).subscription;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
        
        if (subscription.metadata?.type === 'membership' && subscription.metadata?.userId) {
          const userId = subscription.metadata.userId;

          // Get current user
          const { data: { user }, error: getUserError } = await supabaseServer.auth.admin.getUserById(userId);

          if (getUserError || !user) {
            console.error('Error fetching user:', getUserError);
            return NextResponse.json({ received: true }); // Don't fail webhook
          }

          // Update user metadata to reflect payment failure
          // Note: Subscription status will be 'past_due' or 'unpaid', but we keep membership
          // active until subscription is actually cancelled or multiple failures occur
          // Stripe will retry the payment automatically
          const updatedMetadata = {
            ...(user.user_metadata || {}),
            membership_payment_failed: true,
            membership_payment_failed_at: new Date().toISOString(),
            // Keep membership active for now - Stripe will retry
            // If multiple failures occur, Stripe will cancel the subscription
            // and we'll handle that via customer.subscription.deleted event
          };

          const { error: updateError } = await supabaseServer.auth.admin.updateUserById(
            userId,
            { user_metadata: updatedMetadata }
          );

          if (updateError) {
            console.error('Error updating user membership for payment failure:', updateError);
          } else {
            console.log(`Payment failure logged for user ${userId} via webhook`);
            // TODO: You might want to send an email notification to the user here
            // to let them know their payment failed and they should update their payment method
          }
        }
      }
    }

    // Handle customer created
    if (event.type === 'customer.created') {
      const customer = event.data.object as Stripe.Customer;

      // If customer has userId in metadata, store customer ID in user metadata
      if (customer.metadata?.userId) {
        const userId = customer.metadata.userId;

        // Get current user
        const { data: { user }, error: getUserError } = await supabaseServer.auth.admin.getUserById(userId);

        if (getUserError || !user) {
          console.error('Error fetching user:', getUserError);
          return NextResponse.json({ received: true }); // Don't fail webhook
        }

        // Update user metadata with customer ID
        const updatedMetadata = {
          ...(user.user_metadata || {}),
          stripe_customer_id: customer.id,
        };

        const { error: updateError } = await supabaseServer.auth.admin.updateUserById(
          userId,
          { user_metadata: updatedMetadata }
        );

        if (updateError) {
          console.error('Error updating user with customer ID:', updateError);
        } else {
          console.log(`Customer ID stored for user ${userId} via webhook`);
        }
      }
    }

    // Handle customer deleted
    if (event.type === 'customer.deleted') {
      const customer = event.data.object as Stripe.Customer;

      // If customer has userId in metadata, we could clean up or mark as deleted
      // However, we typically rely on subscription.deleted for membership cancellation
      // This event is mainly for logging/auditing purposes
      if (customer.metadata?.userId) {
        const userId = customer.metadata.userId;
        console.log(`Customer deleted for user ${userId} via webhook`);
        // Note: We don't automatically cancel membership here because:
        // 1. Subscription might still be active if customer was deleted separately
        // 2. We rely on subscription.deleted event for membership cancellation
        // 3. This event can be used for cleanup/auditing if needed
      }
    }

    // Keep legacy payment intent handler for backwards compatibility
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // Only process membership payments (skip if it's part of a subscription)
      if (paymentIntent.metadata?.type === 'membership' && paymentIntent.metadata?.userId && !paymentIntent.invoice) {
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

