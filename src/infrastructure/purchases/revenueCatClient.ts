import { Platform } from 'react-native';
import Config from 'react-native-config';
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

import type { ComputedEntitlement } from '../../shared/subscription/entitlementEngine';
import {
  PLAN_CARE_PLUS,
  PLAN_FAMILY,
} from '../../shared/subscription/planCatalog';
import { playProductIdFor } from '../../shared/subscription/playStoreCatalog';
import { RC_ENTITLEMENT_PAWSOUL_PRO } from '../../shared/subscription/revenueCatCatalog';

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

export async function getRevenueCatCustomerInfo(): Promise<CustomerInfo> {
  configureRevenueCat();
  if (!configured) {
    throw new Error('Purchases are not configured.');
  }
  return Purchases.getCustomerInfo();
}

export async function hasPawsoulProEntitlement(
  info?: CustomerInfo,
): Promise<boolean> {
  const customerInfo = info ?? (await getRevenueCatCustomerInfo());
  return typeof customerInfo.entitlements.active[RC_ENTITLEMENT_PAWSOUL_PRO] !==
    'undefined';
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
  try {
    await Purchases.purchasePackage(pkg);
  } catch (error) {
    const purchasesError = error as PurchasesError;
    if (purchasesError?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      throw new Error('Purchase cancelled.');
    }
    throw error instanceof Error
      ? error
      : new Error('Purchase failed. Please try again.');
  }
}

export async function restoreRevenueCatPurchases(uid: string): Promise<void> {
  await ensureRevenueCatIdentifiedUser(uid);
  await Purchases.restorePurchases();
}

export type PresentPaywallOutcome =
  | 'purchased'
  | 'restored'
  | 'cancelled'
  | 'not_presented'
  | 'error';

/**
 * Presents the RevenueCat Paywall for the current offering.
 * Requires a Paywall designed in the RC dashboard for that offering.
 */
export async function presentRevenueCatPaywall(
  uid: string,
): Promise<PresentPaywallOutcome> {
  await ensureRevenueCatIdentifiedUser(uid);
  try {
    const result = await RevenueCatUI.presentPaywall();
    switch (result) {
      case PAYWALL_RESULT.PURCHASED:
        return 'purchased';
      case PAYWALL_RESULT.RESTORED:
        return 'restored';
      case PAYWALL_RESULT.CANCELLED:
        return 'cancelled';
      case PAYWALL_RESULT.NOT_PRESENTED:
        return 'not_presented';
      case PAYWALL_RESULT.ERROR:
      default:
        return 'error';
    }
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('[RevenueCat] presentPaywall failed', error);
    }
    return 'error';
  }
}

/**
 * Shows the RC paywall only when `pawsoul_pro` is not active.
 */
export async function presentRevenueCatPaywallIfNeeded(
  uid: string,
): Promise<PresentPaywallOutcome> {
  await ensureRevenueCatIdentifiedUser(uid);
  try {
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: RC_ENTITLEMENT_PAWSOUL_PRO,
    });
    switch (result) {
      case PAYWALL_RESULT.PURCHASED:
        return 'purchased';
      case PAYWALL_RESULT.RESTORED:
        return 'restored';
      case PAYWALL_RESULT.CANCELLED:
        return 'cancelled';
      case PAYWALL_RESULT.NOT_PRESENTED:
        return 'not_presented';
      case PAYWALL_RESULT.ERROR:
      default:
        return 'error';
    }
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('[RevenueCat] presentPaywallIfNeeded failed', error);
    }
    return 'error';
  }
}

export async function presentRevenueCatCustomerCenter(
  uid: string,
): Promise<void> {
  await ensureRevenueCatIdentifiedUser(uid);
  await RevenueCatUI.presentCustomerCenter({
    callbacks: {
      onRestoreCompleted: () => {
        /* Firestore listener / bootstrap refresh handled by caller */
      },
    },
  });
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
      if (result && typeof result === 'object' && 'source' in result) {
        last = result as ComputedEntitlement;
      }
    } catch {
      /* transient bootstrap/network — keep polling */
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  return last;
}
