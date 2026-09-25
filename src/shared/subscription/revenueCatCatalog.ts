/**
 * RevenueCat catalog IDs — keep in sync with the RC dashboard (Pawsoul project).
 * Store product IDs match Google Play; package identifiers are RC offering labels.
 */
export const RC_ENTITLEMENT_PAWSOUL_PRO = 'pawsoul_pro' as const;

export const RC_OFFERING_DEFAULT = 'default' as const;

/** Play / App Store product identifiers → RC package identifiers in default offering */
export const RC_STORE_PRODUCTS = {
  care_plus_weekly: { productId: 'care_plus_weekly', packageId: '$rc_weekly' },
  care_plus_monthly: { productId: 'care_plus_monthly', packageId: '$rc_monthly' },
  care_plus_annual: { productId: 'care_plus_annual', packageId: '$rc_annual' },
  family_monthly: { productId: 'family_monthly', packageId: 'custom_monthly_2' },
  family_annual: { productId: 'family_annual', packageId: 'custom_yearly_2' },
} as const;
