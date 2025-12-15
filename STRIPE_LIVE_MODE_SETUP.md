# Switching Stripe to Live Mode

To switch from test mode to live mode, you need to update your Stripe API keys and webhook secrets.

## Step 1: Get Your Live Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Make sure you're viewing **Live mode** (toggle in the top right)
3. Go to **Developers** → **API keys**
4. Copy your **Publishable key** (starts with `pk_live_`)
5. Copy your **Secret key** (starts with `sk_live_` - click "Reveal test key" to see it)

## Step 2: Get Your Live Webhook Secret

1. In Stripe Dashboard (Live mode), go to **Developers** → **Webhooks**
2. If you don't have a webhook endpoint yet:
   - Click **Add endpoint**
   - Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
   - Click **Add endpoint**
3. Click on your webhook endpoint
4. Copy the **Signing secret** (starts with `whsec_`)

## Step 3: Update Environment Variables in Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Update these variables:

   - **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
     - Change from: `pk_test_...`
     - Change to: `pk_live_...` (your live publishable key)

   - **STRIPE_SECRET_KEY**
     - Change from: `sk_test_...`
     - Change to: `sk_live_...` (your live secret key)

   - **STRIPE_WEBHOOK_SECRET**
     - Change from: `whsec_...` (test webhook secret)
     - Change to: `whsec_...` (your live webhook secret)

5. After updating, **redeploy your application** for changes to take effect

## Step 4: Update Local Environment (Optional)

If you want to test locally with live mode (not recommended for testing), update your `.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
```

**Important**: Never use live keys for local testing. Always use test mode locally.

## Step 5: Test Your Integration

After deploying with live keys:

1. Make a test purchase with a real credit card (you can refund it immediately)
2. Check Stripe Dashboard → Payments to verify the payment was processed
3. Verify the webhook is working (check webhook logs in Stripe Dashboard)
4. Verify user membership status is updated in your database

## Important Notes

- **Test mode vs Live mode**: Test mode uses test cards (like `4242 4242 4242 4242`). Live mode processes real payments.
- **Different products/prices**: Test and Live modes have separate products, prices, and customers. You may need to verify your product/price IDs are correct in live mode.
- **Webhooks**: Make sure your webhook endpoint URL is correct for your production domain.
- **Security**: Never commit live keys to Git. Always use environment variables.

## Troubleshooting

- If payments aren't processing, check that you're using live keys in production
- If webhooks aren't working, verify the webhook secret matches your live webhook endpoint
- Check Stripe Dashboard → Logs for any errors

