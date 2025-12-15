import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, customerEmail } = body;

    if (!userId || !customerEmail) {
      return NextResponse.json(
        { error: 'User ID and customer email are required' },
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

    // Find or create product for membership
    let product;
    const existingProducts = await stripe.products.list({
      active: true,
      limit: 100,
    });
    
    product = existingProducts.data.find(
      (p) => p.name === 'Pro Membership' && p.metadata?.type === 'membership'
    );

    if (!product) {
      product = await stripe.products.create({
        name: 'Pro Membership',
        description: 'Monthly Pro Membership',
        metadata: {
          type: 'membership',
        },
      });
    }

    // Find or create price for membership subscription
    let price;
    const existingPrices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 100,
    });
    
    price = existingPrices.data.find(
      (p) => 
        p.currency === 'usd' &&
        p.unit_amount === MEMBERSHIP_PRICE_CENTS &&
        p.recurring?.interval === 'month'
    );

    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        unit_amount: MEMBERSHIP_PRICE_CENTS,
        recurring: {
          interval: 'month',
        },
      });
    }

    // Create Stripe Checkout Session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.headers.get('origin')}/community?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/pricing`,
      metadata: {
        userId: userId,
        type: 'membership',
      },
      subscription_data: {
        metadata: {
          userId: userId,
          type: 'membership',
        },
      },
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
