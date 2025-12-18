import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseServer } from '@/lib/supabase-server';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  // Always return 200 to Stripe, even on errors (log errors instead)
  try {
    // Validate environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[Webhook] STRIPE_SECRET_KEY is missing');
      return NextResponse.json({ received: true, error: 'Server configuration error' }, { status: 200 });
    }

    if (!webhookSecret) {
      console.error('[Webhook] STRIPE_WEBHOOK_SECRET is missing');
      return NextResponse.json({ received: true, error: 'Webhook secret not configured' }, { status: 200 });
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('[Webhook] Missing stripe-signature header');
      return NextResponse.json({ received: true, error: 'Missing signature' }, { status: 200 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('[Webhook] Signature verification failed:', err.message);
      // Return 200 to prevent Stripe from retrying invalid signatures
      return NextResponse.json({ received: true, error: `Webhook Error: ${err.message}` }, { status: 200 });
    }

    // Handle checkout session completed (this fires immediately after successful payment)
    if (event.type === 'checkout.session.completed') {
      try {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'subscription' && session.metadata?.type === 'membership' && session.metadata?.userId) {
          const userId = session.metadata.userId;
          const subscriptionId = session.subscription as string;

          if (subscriptionId) {
            // Retrieve the subscription to get its status
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);

            if (subscription.metadata?.type === 'membership' && subscription.metadata?.userId) {
              const isActive = subscription.status === 'active' || subscription.status === 'trialing';

              // Get current user
              const { data: { user }, error: getUserError } = await supabaseServer.auth.admin.getUserById(userId);

              if (getUserError || !user) {
                console.error('[Webhook] Error fetching user:', getUserError);
                // Continue - don't fail webhook
              } else {
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
                  console.error('[Webhook] Error updating user membership:', updateError);
                } else {
                  console.log(`[Webhook] Membership activated for user ${userId} via checkout.session.completed`);
                }
              }
            }
          }
        }
      } catch (err: any) {
        console.error('[Webhook] Error handling checkout.session.completed:', err);
        // Continue - don't fail webhook
      }
    }

    // Handle subscription created/updated
    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      try {
        const subscription = event.data.object as Stripe.Subscription;

        if (subscription.metadata?.type === 'membership' && subscription.metadata?.userId) {
          const userId = subscription.metadata.userId;
          const isActive = subscription.status === 'active' || subscription.status === 'trialing';

          // Get current user
          const { data: { user }, error: getUserError } = await supabaseServer.auth.admin.getUserById(userId);

          if (getUserError || !user) {
            console.error('[Webhook] Error fetching user:', getUserError);
            // Continue - don't fail webhook
          } else {
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
              console.error('[Webhook] Error updating user membership:', updateError);
            } else {
              console.log(`[Webhook] Membership ${isActive ? 'activated' : 'updated'} for user ${userId}`);
            }
          }
        }
      } catch (err: any) {
        console.error('[Webhook] Error handling subscription created/updated:', err);
        // Continue - don't fail webhook
      }
    }

    // Handle subscription deleted/cancelled
    if (event.type === 'customer.subscription.deleted') {
      try {
        const subscription = event.data.object as Stripe.Subscription;

        if (subscription.metadata?.type === 'membership' && subscription.metadata?.userId) {
          const userId = subscription.metadata.userId;

          // Get current user
          const { data: { user }, error: getUserError } = await supabaseServer.auth.admin.getUserById(userId);

          if (getUserError || !user) {
            console.error('[Webhook] Error fetching user:', getUserError);
            // Continue - don't fail webhook
          } else {
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
              console.error('[Webhook] Error cancelling user membership:', updateError);
            } else {
              console.log(`[Webhook] Membership cancelled for user ${userId}`);
            }
          }
        }
      } catch (err: any) {
        console.error('[Webhook] Error handling subscription deleted:', err);
        // Continue - don't fail webhook
      }
    }

    // Handle invoice payment succeeded (for recurring payments)
    if (event.type === 'invoice.payment_succeeded') {
      try {
        const invoice = event.data.object as Stripe.Invoice;
        
        const subscriptionId = (invoice as any).subscription;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
          
          if (subscription.metadata?.type === 'membership' && subscription.metadata?.userId) {
            const userId = subscription.metadata.userId;

            // Get current user
            const { data: { user }, error: getUserError } = await supabaseServer.auth.admin.getUserById(userId);

            if (getUserError || !user) {
              console.error('[Webhook] Error fetching user:', getUserError);
              // Continue - don't fail webhook
            } else {
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
                console.error('[Webhook] Error updating user membership:', updateError);
              } else {
                console.log(`[Webhook] Recurring payment processed for user ${userId}`);
              }
            }
          }
        }
      } catch (err: any) {
        console.error('[Webhook] Error handling invoice payment succeeded:', err);
        // Continue - don't fail webhook
      }
    }

    // Handle invoice payment failed
    if (event.type === 'invoice.payment_failed') {
      try {
        const invoice = event.data.object as Stripe.Invoice;
        
        const subscriptionId = (invoice as any).subscription;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
          
          if (subscription.metadata?.type === 'membership' && subscription.metadata?.userId) {
            const userId = subscription.metadata.userId;

            // Get current user
            const { data: { user }, error: getUserError } = await supabaseServer.auth.admin.getUserById(userId);

            if (getUserError || !user) {
              console.error('[Webhook] Error fetching user:', getUserError);
              // Continue - don't fail webhook
            } else {
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
                console.error('[Webhook] Error updating user membership for payment failure:', updateError);
              } else {
                console.log(`[Webhook] Payment failure logged for user ${userId}`);
                // TODO: You might want to send an email notification to the user here
                // to let them know their payment failed and they should update their payment method
              }
            }
          }
        }
      } catch (err: any) {
        console.error('[Webhook] Error handling invoice payment failed:', err);
        // Continue - don't fail webhook
      }
    }

    // Handle customer created
    if (event.type === 'customer.created') {
      try {
        const customer = event.data.object as Stripe.Customer;

        // If customer has userId in metadata, store customer ID in user metadata
        if (customer.metadata?.userId) {
          const userId = customer.metadata.userId;

          // Get current user
          const { data: { user }, error: getUserError } = await supabaseServer.auth.admin.getUserById(userId);

          if (getUserError || !user) {
            console.error('[Webhook] Error fetching user:', getUserError);
            // Continue - don't fail webhook
          } else {
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
              console.error('[Webhook] Error updating user with customer ID:', updateError);
            } else {
              console.log(`[Webhook] Customer ID stored for user ${userId}`);
            }
          }
        }
      } catch (err: any) {
        console.error('[Webhook] Error handling customer created:', err);
        // Continue - don't fail webhook
      }
    }

    // Handle customer deleted
    if (event.type === 'customer.deleted') {
      try {
        const customer = event.data.object as Stripe.Customer;

        // If customer has userId in metadata, we could clean up or mark as deleted
        // However, we typically rely on subscription.deleted for membership cancellation
        // This event is mainly for logging/auditing purposes
        if (customer.metadata?.userId) {
          const userId = customer.metadata.userId;
          console.log(`[Webhook] Customer deleted for user ${userId}`);
          // Note: We don't automatically cancel membership here because:
          // 1. Subscription might still be active if customer was deleted separately
          // 2. We rely on subscription.deleted event for membership cancellation
          // 3. This event can be used for cleanup/auditing if needed
        }
      } catch (err: any) {
        console.error('[Webhook] Error handling customer deleted:', err);
        // Continue - don't fail webhook
      }
    }

    // Keep legacy payment intent handler for backwards compatibility
    if (event.type === 'payment_intent.succeeded') {
      try {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Only process membership payments (skip if it's part of a subscription)
        const invoiceId = (paymentIntent as any).invoice;
        if (paymentIntent.metadata?.type === 'membership' && paymentIntent.metadata?.userId && !invoiceId) {
          const userId = paymentIntent.metadata.userId;

          // Get current user
          const { data: { user }, error: getUserError } = await supabaseServer.auth.admin.getUserById(userId);

          if (getUserError || !user) {
            console.error('[Webhook] Error fetching user:', getUserError);
            // Continue - don't fail webhook
          } else {
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
              console.error('[Webhook] Error updating user membership:', updateError);
            } else {
              console.log(`[Webhook] Membership activated for user ${userId} via payment_intent.succeeded`);
            }
          }
        }
      } catch (err: any) {
        console.error('[Webhook] Error handling payment intent succeeded:', err);
        // Continue - don't fail webhook
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    // Log the error but always return 200 to Stripe
    // This prevents Stripe from retrying and marking the webhook as failed
    console.error('[Webhook] Unexpected error:', error);
    console.error('[Webhook] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return 200 so Stripe doesn't retry
    return NextResponse.json(
      { received: true, error: error.message || 'Webhook handler failed' },
      { status: 200 }
    );
  }
}

