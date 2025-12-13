# How to Check If Your Account is Pro

## Method 1: Browser Console (Easiest)

1. Open your browser's Developer Console:
   - Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - Or right-click → Inspect → Console tab

2. While logged in on your site, paste and run this code:

```javascript
(async () => {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'
  );
  
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    const metadata = session.user.user_metadata;
    console.log('Membership Status:', {
      membership_status: metadata?.membership_status,
      has_paid_membership: metadata?.has_paid_membership,
      membership_purchased_at: metadata?.membership_purchased_at,
      isPro: !!(metadata?.membership_status || metadata?.has_paid_membership)
    });
  } else {
    console.log('Not logged in');
  }
})();
```

**Or simpler version using the existing supabase client:**

If you're on the community page, just paste this in the console:

```javascript
window.supabase = window.supabase || (await import('/lib/supabase')).supabase;
const { data: { session } } = await window.supabase.auth.getSession();
if (session?.user) {
  const md = session.user.user_metadata;
  console.log('🔍 Membership Check:', {
    'Membership Status': md?.membership_status || 'Not set',
    'Has Paid Membership': md?.has_paid_membership || false,
    'Purchased At': md?.membership_purchased_at || 'N/A',
    'Is Pro?': !!(md?.membership_status || md?.has_paid_membership)
  });
} else {
  console.log('❌ Not logged in');
}
```

## Method 2: Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **Users**
4. Find your user account (by email)
5. Click on your user to view details
6. Scroll down to **User Metadata** section
7. Look for:
   - `membership_status`: Should be `"active"` if pro
   - `has_paid_membership`: Should be `true` if pro
   - `membership_purchased_at`: Date when membership was purchased

## Method 3: Check in Code (Add temporarily)

Add this to your community page temporarily to log membership status:

```javascript
console.log('Current membership status:', hasPaidMembership);
```

Then check the browser console.

