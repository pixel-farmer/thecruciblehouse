import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { userId, customerEmail } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Monthly membership price: $8.00 = 800 cents
    const MEMBERSHIP_PRICE_CENTS = 800;
    
    // Create or retrieve Stripe Customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        metadata: {
          userId: userId,
        },
      });
    }

    // Create a Price for the subscription if not using a price ID
    // For simplicity, we'll create a subscription directly with price data
    // In production, you'd want to create the Price once in Stripe Dashboard and use its ID
    
    // Create Subscription with Setup Intent for initial payment
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price_data: {
          currency: 'usd',
          recurring: {
            interval: 'month',
          },
          unit_amount: MEMBERSHIP_PRICE_CENTS,
          product_data: {
            name: 'Pro Membership',
            description: 'Monthly Pro Membership',
          },
        } as any, // Type assertion needed due to Stripe TypeScript type limitations
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: userId,
        type: 'membership',
      },
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    // Access payment_intent from the expanded invoice
    // TypeScript may not recognize expanded fields, so we use type assertion
    const paymentIntent = (invoice as any).payment_intent as Stripe.PaymentIntent;

    if (!paymentIntent || !paymentIntent.client_secret) {
      throw new Error('Failed to retrieve payment intent from subscription');
    }

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
    });
  } catch (error: any) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

