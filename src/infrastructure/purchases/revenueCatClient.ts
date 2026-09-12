import { Platform } from 'react-native';
import Config from 'react-native-config';
import Purchases, {
  LOG_LEVEL,
  type PurchasesPackage,
} from 'react-native-purchases';

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
  await Purchases.logOut();
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
  planKey: typeof PLAN_CARE_PLUS | typeof PLAN_FAMILY,
  billingPeriod: 'monthly' | 'annual',
): Promise<void> {
  configureRevenueCat();
  if (!configured) {
    throw new Error('Purchases are not configured.');
  }
  const pkg = await findPackage(planKey, billingPeriod);
  await Purchases.purchasePackage(pkg);
}

export async function restoreRevenueCatPurchases(): Promise<void> {
  configureRevenueCat();
  if (!configured) {
    throw new Error('Purchases are not configured.');
  }
  await Purchases.restorePurchases();
}

export async function waitForEntitlementSync(
  refresh: () => Promise<unknown>,
  attempts = 6,
  delayMs = 500,
): Promise<void> {
  for (let i = 0; i < attempts; i += 1) {
    await refresh();
    await new Promise(r => setTimeout(r, delayMs));
  }
}
