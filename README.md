# Community site template

A Next.js site for an artist or member community: profiles, artwork, commissions, open calls, groups, meetups, articles, and an optional paid membership. Branding lives in one config file.

## Requirements

- Node.js 20 or newer
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account if you want paid membership or artwork checkout
- A Google Maps API key if you want the community map and location search

## Install

```bash
npm install
cp .env.example .env.local
```

On Windows PowerShell, copy the example file with:

```powershell
Copy-Item .env.example .env.local
```

Fill in `.env.local`, then start the site:

```bash
npm run dev
```

Open `http://localhost:3000`. Restart the dev server after you change environment variables.

`NEXT_PUBLIC_` values are baked in at build time. After you change them on a host such as Vercel, redeploy.

## Branding

Edit `site.config.ts` for the site name, tagline, contact email, Instagram URL, and homepage headline.

| File | Use |
| --- | --- |
| `public/logo-dark.svg` | Header logo on the light background |
| `public/logo-light.svg` | Footer logo on the dark background |
| `app/icon.png` | Browser tab icon |

Logos display at 250px wide. Colors are the variables at the top of `app/styles/globals.css`.

### Homepage background

`hero.scene` in `site.config.ts` can be `"off"`, `"waves"`, `"grid"`, or `"molten"`. `"off"` leaves the homepage on the plain light background. To add your own scene, put a component in `app/components/hero/scenes/`, register it in `app/components/hero/HeroBackdrop.tsx`, and set `hero.scene` to that name.

## Environment variables

Copy the names from `.env.example`. Use your own keys. Do not commit `.env.local`.

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page, anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page, service role key. Server only. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Cloud. Enable Maps JavaScript API and Places API. |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Optional custom map style |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe test key starting with `pk_test_` |
| `STRIPE_SECRET_KEY` | Stripe test key starting with `sk_test_` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret starting with `whsec_` |

On Vercel, mark `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` as sensitive. Leave the `NEXT_PUBLIC_` values as normal environment variables.

## Supabase

1. Create a project.
2. In Authentication → URL configuration, set the Site URL to your local or live address, and add redirect URLs for `http://localhost:3000` and your production domain.
3. Leave email sign-up enabled.

### Database and storage

In the Supabase SQL Editor, open `supabase/setup.sql`, paste the whole file, and run it once on a new project.

That script creates the tables, row level security, the open-call view counter, message realtime, and three public storage buckets: `artwork`, `profile-images`, and `event-images`. It does not add sample members or artwork.

Do not run it against a database that already has this site’s data. It resets policies to the ones in the file.

## Stripe

Use test keys until you are ready to charge real cards. The app creates a monthly product named Pro Membership at $8. Checkout for priced artwork uses the same secret key.

1. In Stripe, turn Test mode on.
2. Add the publishable key, secret key, and webhook secret to `.env.local` and to your host.
3. Create a webhook endpoint pointing at `https://your-domain.com/api/webhooks/stripe`.
4. Subscribe it to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.created`, `customer.deleted`, and `payment_intent.succeeded`.

Test card: `4242 4242 4242 4242`, any future expiry, any CVC.

The webhook secret from live mode will not verify test events. Create the endpoint while Test mode is on.

## Deploy

Deploy on Vercel with the same environment variables as `.env.local`. Use your own Supabase project and your own Stripe keys. The demo site’s database and keys are not part of this download.

Allow your local and production URLs on the Google Maps key, and add the production URL to the Supabase redirect list.

## License

Use of this template is covered by the commercial license in `LICENSE`. One purchase is for one website. The files may not be resold or shared as a template.

## Scripts

- `npm run dev` starts the local site
- `npm run build` creates a production build
- `npm run start` serves that build
