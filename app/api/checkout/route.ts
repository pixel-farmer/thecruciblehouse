import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { artworkId, artworkTitle, priceInCents } = await request.json();

    if (!artworkId || !artworkTitle || !priceInCents) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create product first, then create checkout session
    const product = await stripe.products.create({
      name: artworkTitle,
      description: `Purchase of ${artworkTitle}`,
    });

    const price = await stripe.prices.create({
      product: product.id,
      currency: 'usd',
      unit_amount: priceInCents,
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/shop/${artworkId}`,
      metadata: {
        artworkId: artworkId,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
