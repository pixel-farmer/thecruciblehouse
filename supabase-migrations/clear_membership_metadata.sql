-- Clear membership metadata from a user
-- This removes the membership-related fields from raw_user_meta_data

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data 
  - 'membership_status'
  - 'has_paid_membership'
  - 'stripe_subscription_id'
  - 'stripe_customer_id'
  - 'membership_purchased_at'
WHERE id = 'cade0aea-440a-4450-b414-a626c30d3651';

