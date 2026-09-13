import { Platform } from 'react-native';
import Config from 'react-native-config';
import Purchases, {
  LOG_LEVEL,
  type PurchasesPackage,
} from 'react-native-purchases';

import type { ComputedEntitlement } from '../../shared/subscription/entitlementEngine';
import {
  PLAN_CARE_PLUS,
  PLAN_FAMILY,
} from '../../shared/subscription/planCatalog';
import { playProductIdFor } from '../../shared/subscription/playStoreCatalog';

let configured = false;

export function configureRevenueCat(): void {
  if (configured) return;
  const apiKey =
    Platform.OS === 'ios'
      ? Config.REVENUECAT_APPLE_API_KEY
      : Config.REVENUECAT_GOOGLE_API_KEY;
  if (!apiKey?.trim()) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[RevenueCat] Missing public API key for this platform');
    }
    return;
  }
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
  Purchases.configure({ apiKey: apiKey.trim() });
  configured = true;
}

export async function loginRevenueCatUser(uid: string): Promise<void> {
  configureRevenueCat();
  if (!configured) return;
  await Purchases.logIn(uid);
}

export async function logoutRevenueCatUser(): Promise<void> {
  if (!configured) return;
  try {
    const current = await Purchases.getAppUserID();
    if (!current || current.startsWith('$RCAnonymousID:')) {
      return;
    }
  } catch {
    return;
  }
  await Purchases.logOut();
}

/**
 * Ensures Purchases is configured and identified as the Firebase uid before
 * any store purchase/restore (webhook uses app_user_id).
 */
export async function ensureRevenueCatIdentifiedUser(
  uid: string,
): Promise<void> {
  const trimmed = uid.trim();
  if (!trimmed || trimmed.startsWith('$RCAnonymousID:')) {
    throw new Error('Sign in before purchasing or restoring a subscription.');
  }
  configureRevenueCat();
  if (!configured) {
    throw new Error('Purchases are not configured.');
  }
  await Purchases.logIn(trimmed);
  const appUserId = await Purchases.getAppUserID();
  if (appUserId !== trimmed) {
    throw new Error(
      'Subscription account is not linked yet. Please try again in a moment.',
    );
  }
}

async function findPackage(
  planKey: typeof PLAN_CARE_PLUS | typeof PLAN_FAMILY,
  billingPeriod: 'monthly' | 'annual',
): Promise<PurchasesPackage> {
  const productId = playProductIdFor(planKey, billingPeriod);
  if (!productId) {
    throw new Error('Subscription product is not configured for this plan.');
  }
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) {
    throw new Error('No RevenueCat offering is configured (expected default).');
  }
  const pkg =
    current.availablePackages.find(p => p.product.identifier === productId) ??
    null;
  if (!pkg) {
    throw new Error(`Package not found in offering for ${productId}.`);
  }
  return pkg;
}

export async function purchaseStorePackage(
  uid: string,
  planKey: typeof PLAN_CARE_PLUS | typeof PLAN_FAMILY,
  billingPeriod: 'monthly' | 'annual',
): Promise<void> {
  await ensureRevenueCatIdentifiedUser(uid);
  const pkg = await findPackage(planKey, billingPeriod);
  await Purchases.purchasePackage(pkg);
}

export async function restoreRevenueCatPurchases(uid: string): Promise<void> {
  await ensureRevenueCatIdentifiedUser(uid);
  await Purchases.restorePurchases();
}

export async function waitForEntitlementSync(
  refresh: () => Promise<ComputedEntitlement | unknown>,
  attempts = 6,
  delayMs = 500,
): Promise<ComputedEntitlement | null> {
  let last: ComputedEntitlement | null = null;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const result = await refresh();
      if (
        result &&
        typeof result === 'object' &&
        'source' in result &&
        (result as ComputedEntitlement).source === 'paid'
      ) {
        return result as ComputedEntitlement;
      }
      if (
        result &&
        typeof result === 'object' &&
        'source' in result
      ) {
        last = result as ComputedEntitlement;
      }
    } catch {
      /* transient bootstrap/network — keep polling */
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  return last;
}
