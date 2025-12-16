/**
 * Helper function to check if a user has Pro or Founder access
 * @param userMetadata - User metadata object from Supabase
 * @returns Object with isPro, isFounder, and badge info
 */
export function checkMembershipAccess(userMetadata: any = {}) {
  const membershipStatus = userMetadata.membership_status;
  const hasPaidMembership = userMetadata.has_paid_membership;
  const isFounder = userMetadata.is_founder === true;
  const isPro = membershipStatus === 'active' || hasPaidMembership === true || isFounder;
  
  return {
    isPro,
    isFounder,
    hasProMembership: membershipStatus === 'active' || hasPaidMembership === true,
  };
}

