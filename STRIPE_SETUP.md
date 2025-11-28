# Stripe Integration Setup

This guide explains how to configure Stripe payments for The Crucible House art gallery.

## Environment Variables

### For Vercel Deployment

You need to add **TWO** environment variables in your Vercel project settings:

1. **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY** (required)
   - Your Stripe publishable key (starts with `pk_`)
   - **Important**: Must have the `NEXT_PUBLIC_` prefix for client-side access in Next.js
   - Add this in Vercel: Settings → Environment Variables

2. **STRIPE_SECRET_KEY** (required)
   - Your Stripe secret key (starts with `sk_`)
   - Server-side only, never exposed to the client
   - Add this in Vercel: Settings → Environment Variables

### For Local Development

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

**Note**: The `.env.local` file is already in `.gitignore` and will not be committed to Git.

## Important Notes

- If you created `STRIPE_PUBLISHABLE_KEY` (without `NEXT_PUBLIC_` prefix) in Vercel, you need to update it to `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- The publishable key must be accessible on the client side (for Stripe.js), hence the `NEXT_PUBLIC_` prefix
- The secret key is only used server-side in the API route

## Testing

1. Use Stripe test mode keys (start with `pk_test_` and `sk_test_`)
2. Test the checkout flow by clicking "Buy Now" on an artwork with a price set
3. Use Stripe test card: `4242 4242 4242 4242` with any future expiry date and any CVC

## Artwork Pricing

To enable the "Buy Now" button for an artwork:
- Set a `priceInCents` value in the artwork data (e.g., `250000` for $2,500)
- Artworks without `priceInCents` will have a disabled "Buy Now" button

## Next Steps

After deployment:
1. Update your Stripe keys to production keys (starting with `pk_live_` and `sk_live_`)
2. Configure webhooks in your Stripe dashboard if you need to handle payment confirmations
3. Set up success and failure email notifications in Stripe

