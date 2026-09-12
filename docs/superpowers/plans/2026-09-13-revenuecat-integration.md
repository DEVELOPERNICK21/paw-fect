# RevenueCat Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mobile Play Billing (`react-native-iap` + Google verify) with RevenueCat checkout/restore, while writing paid state into Firestore via webhook so existing entitlement listening stays the source of truth.

**Architecture:** App uses `react-native-purchases` for purchase/restore and `Purchases.logIn(firebaseUid)`. RevenueCat webhooks hit `POST /api/subscription/revenuecat`, which maps products/entitlements to `care_plus` / `family`, writes `users/{uid}.subscription` with `provider: 'revenuecat'`, and calls `writeComputedEntitlement`. Razorpay web and trial bootstrap stay unchanged. iOS SDK is wired but purchase CTAs stay gated until App Store products exist.

**Tech Stack:** React Native, `react-native-purchases`, `react-native-config`, Next.js App Router, Firebase Admin, existing `entitlementEngine` / `planCatalog` / `playStoreCatalog`.

**Spec:** `docs/superpowers/specs/2026-09-13-revenuecat-integration-design.md`

## Global Constraints

- Hybrid model: RC = store layer only; Firestore `entitlement` remains source of truth
- Android-first shipping; iOS purchase gated until products linked
- Keep Razorpay web path unchanged
- Play product IDs must stay: `care_plus_monthly`, `care_plus_annual`, `family_monthly`, `family_annual`
- Secret RC key / webhook secret never in the mobile app — public SDK keys only via `react-native-config`
- Clean Architecture: no `react-native-purchases` imports in domain or UI; SDK behind subscription data source / thin infra helper
- Theme: `useTheme()` only in UI changes
- Tests: `yarn test --watchman=false <path>`
- Fix Play Console payments profile before real purchase QA (ops, not code)

---

## File map

| File | Responsibility |
|------|----------------|
| `src/shared/subscription/entitlementEngine.ts` | Add `provider: 'revenuecat'` (+ optional `revenueCatProductId`) |
| `web/lib/subscription/parseUserBilling.ts` | Accept `revenuecat` provider when parsing |
| `web/lib/subscription/mapStoreProductIdToPlan.ts` | Shared product-id → plan mapping (Play env ids) |
| `web/lib/subscription/revenueCatWebhook.ts` | Map RC event → `StoredSubscriptionState` |
| `web/app/api/subscription/revenuecat/route.ts` | Webhook HTTP handler |
| `web/.env.example` | `REVENUECAT_WEBHOOK_SECRET` |
| `src/infrastructure/purchases/revenueCatClient.ts` | Configure / logIn / logOut / getOfferings / purchase / restore |
| `src/types/env.d.ts` + `.env*` docs | `REVENUECAT_GOOGLE_API_KEY`, `REVENUECAT_APPLE_API_KEY` |
| `src/modules/subscription/data/datasources/SubscriptionRemoteDataSource.ts` | RC checkout + restore; drop IAP verify path |
| `src/modules/subscription/domain/repositories/SubscriptionRepository.ts` | `checkoutStore` + `restorePurchases` |
| `src/modules/subscription/domain/usecases/CheckoutStoreSubscription.ts` | Renamed/generalized checkout use case |
| `src/modules/subscription/domain/usecases/RestoreStorePurchases.ts` | Restore use case |
| `src/modules/subscription/subscriptionComposition.ts` | Wire new use cases |
| `src/modules/subscription/store/subscriptionStore.ts` | `startStoreCheckout` + `restorePurchases` |
| `src/app/navigation/RootNavigator.tsx` | RC configure once; logIn/logOut with session |
| `src/modules/subscription/ui/screens/PaywallScreen.tsx` | Restore CTA; iOS gate; copy |
| `docs/subscription-launch-checklist.md` | RC ops steps |

---

### Task 1: Extend subscription provider for RevenueCat

**Files:**
- Modify: `src/shared/subscription/entitlementEngine.ts`
- Modify: `web/lib/subscription/parseUserBilling.ts`
- Create: `web/lib/subscription/__tests__/parseUserBilling.test.ts`
- Create: `src/shared/subscription/__tests__/entitlementEngine.revenuecat.test.ts`

**Interfaces:**
- Produces: `StoredSubscriptionState.provider` includes `'revenuecat'`; optional `revenueCatProductId?: string | null`
- Consumes: existing `computeEntitlement` / `parseStoredSubscription`

- [ ] **Step 1: Write failing parser + entitlement tests**

```typescript
// web/lib/subscription/__tests__/parseUserBilling.test.ts
import { parseStoredSubscription } from '../parseUserBilling';

describe('parseStoredSubscription', () => {
  it('accepts revenuecat provider', () => {
    const parsed = parseStoredSubscription({
      provider: 'revenuecat',
      planKey: 'care_plus',
      billingPeriod: 'monthly',
      status: 'active',
      currentPeriodEnd: '2026-10-01T00:00:00.000Z',
      gracePeriodEndsAt: null,
      revenueCatProductId: 'care_plus_monthly',
    });
    expect(parsed?.provider).toBe('revenuecat');
    expect(parsed?.planKey).toBe('care_plus');
  });

  it('rejects unknown provider', () => {
    expect(parseStoredSubscription({ provider: 'stripe', planKey: 'care_plus' })).toBeNull();
  });
});
```

```typescript
// src/shared/subscription/__tests__/entitlementEngine.revenuecat.test.ts
import { computeEntitlement } from '../entitlementEngine';

describe('computeEntitlement with revenuecat', () => {
  it('grants paid care_plus when revenuecat subscription is active', () => {
    const e = computeEntitlement({
      now: new Date('2026-09-13T12:00:00.000Z'),
      trialEndsAt: null,
      trialConsumed: true,
      subscription: {
        provider: 'revenuecat',
        planKey: 'care_plus',
        billingPeriod: 'monthly',
        status: 'active',
        currentPeriodEnd: '2026-10-13T12:00:00.000Z',
        gracePeriodEndsAt: null,
        revenueCatProductId: 'care_plus_monthly',
      },
    });
    expect(e.source).toBe('paid');
    expect(e.plan).toBe('care_plus');
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL (provider not accepted / type error)**

```bash
yarn test --watchman=false web/lib/subscription/__tests__/parseUserBilling.test.ts src/shared/subscription/__tests__/entitlementEngine.revenuecat.test.ts
```

- [ ] **Step 3: Implement provider extension**

In `entitlementEngine.ts`, change:

```typescript
export interface StoredSubscriptionState {
  readonly provider: 'razorpay' | 'google_play' | 'revenuecat';
  readonly razorpaySubscriptionId?: string | null;
  readonly googlePurchaseToken?: string | null;
  readonly googleProductId?: string | null;
  readonly revenueCatProductId?: string | null;
  readonly planKey: typeof PLAN_CARE_PLUS | typeof PLAN_FAMILY;
  readonly billingPeriod: SubscriptionBillingPeriod;
  readonly status: StoredSubscriptionStatus;
  readonly currentPeriodEnd: string | null;
  readonly gracePeriodEndsAt: string | null;
}
```

In `parseUserBilling.ts`, allow `provider === 'revenuecat'` and parse `revenueCatProductId` like the Google fields.

- [ ] **Step 4: Re-run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/shared/subscription/entitlementEngine.ts \
  src/shared/subscription/__tests__/entitlementEngine.revenuecat.test.ts \
  web/lib/subscription/parseUserBilling.ts \
  web/lib/subscription/__tests__/parseUserBilling.test.ts
git commit -m "$(cat <<'EOF'
feat(subscription): support revenuecat provider on stored subscription

EOF
)"
```

---

### Task 2: Product mapping + RevenueCat webhook mapper

**Files:**
- Create: `web/lib/subscription/mapStoreProductIdToPlan.ts` (extract/reuse logic from `googlePlayPlanMap.ts`)
- Modify: `web/lib/subscription/googlePlayPlanMap.ts` — re-export from shared mapper to avoid drift
- Create: `web/lib/subscription/revenueCatWebhook.ts`
- Create: `web/lib/subscription/__tests__/revenueCatWebhook.test.ts`
- Create: `web/lib/subscription/__tests__/mapStoreProductIdToPlan.test.ts`

**Interfaces:**
- Produces:
  - `mapStoreProductIdToPlan(productId: string): { planKey; billingPeriod } | null`
  - `mapRevenueCatEventToSubscription(event: RevenueCatEventPayload): StoredSubscriptionState | null`
  - `isRevenueCatWebhookAuthorized(authHeader: string | null, secret: string): boolean`

- [ ] **Step 1: Write failing mapper tests**

```typescript
// web/lib/subscription/__tests__/mapStoreProductIdToPlan.test.ts
import { mapStoreProductIdToPlan } from '../mapStoreProductIdToPlan';

describe('mapStoreProductIdToPlan', () => {
  const prev = { ...process.env };
  beforeEach(() => {
    process.env.PLAY_SUB_CARE_PLUS_MONTHLY = 'care_plus_monthly';
    process.env.PLAY_SUB_CARE_PLUS_ANNUAL = 'care_plus_annual';
    process.env.PLAY_SUB_FAMILY_MONTHLY = 'family_monthly';
    process.env.PLAY_SUB_FAMILY_ANNUAL = 'family_annual';
  });
  afterAll(() => {
    process.env = prev;
  });

  it('maps care_plus_monthly', () => {
    expect(mapStoreProductIdToPlan('care_plus_monthly')).toEqual({
      planKey: 'care_plus',
      billingPeriod: 'monthly',
    });
  });

  it('maps family_annual', () => {
    expect(mapStoreProductIdToPlan('family_annual')).toEqual({
      planKey: 'family',
      billingPeriod: 'annual',
    });
  });
});
```

```typescript
// web/lib/subscription/__tests__/revenueCatWebhook.test.ts
import {
  isRevenueCatWebhookAuthorized,
  mapRevenueCatEventToSubscription,
} from '../revenueCatWebhook';

describe('revenueCatWebhook', () => {
  it('authorizes matching Bearer secret', () => {
    expect(
      isRevenueCatWebhookAuthorized('Bearer test-secret', 'test-secret'),
    ).toBe(true);
    expect(isRevenueCatWebhookAuthorized('Bearer nope', 'test-secret')).toBe(
      false,
    );
  });

  it('maps INITIAL_PURCHASE to active care_plus', () => {
    const sub = mapRevenueCatEventToSubscription({
      type: 'INITIAL_PURCHASE',
      app_user_id: 'firebase-uid-1',
      product_id: 'care_plus_monthly',
      expiration_at_ms: Date.parse('2026-10-13T00:00:00.000Z'),
      entitlement_ids: ['care_plus'],
    });
    expect(sub).toMatchObject({
      provider: 'revenuecat',
      planKey: 'care_plus',
      billingPeriod: 'monthly',
      status: 'active',
      revenueCatProductId: 'care_plus_monthly',
    });
    expect(sub?.currentPeriodEnd).toBe('2026-10-13T00:00:00.000Z');
  });

  it('maps EXPIRATION to cancelled', () => {
    const sub = mapRevenueCatEventToSubscription({
      type: 'EXPIRATION',
      app_user_id: 'firebase-uid-1',
      product_id: 'care_plus_monthly',
      expiration_at_ms: Date.parse('2026-09-01T00:00:00.000Z'),
      entitlement_ids: ['care_plus'],
    });
    expect(sub?.status).toBe('cancelled');
  });

  it('maps BILLING_ISSUE to past_due with grace end', () => {
    const sub = mapRevenueCatEventToSubscription({
      type: 'BILLING_ISSUE',
      app_user_id: 'firebase-uid-1',
      product_id: 'family_monthly',
      expiration_at_ms: Date.parse('2026-09-20T00:00:00.000Z'),
      entitlement_ids: ['family'],
      event_timestamp_ms: Date.parse('2026-09-13T00:00:00.000Z'),
    });
    expect(sub?.status).toBe('past_due');
    expect(sub?.gracePeriodEndsAt).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
yarn test --watchman=false web/lib/subscription/__tests__/mapStoreProductIdToPlan.test.ts web/lib/subscription/__tests__/revenueCatWebhook.test.ts
```

- [ ] **Step 3: Implement mappers**

`mapStoreProductIdToPlan.ts` — move body of current `mapGoogleProductIdToPlan` here; `googlePlayPlanMap.ts` becomes:

```typescript
export { mapStoreProductIdToPlan as mapGoogleProductIdToPlan } from './mapStoreProductIdToPlan';
```

`revenueCatWebhook.ts` — status rules:

| Event type | status |
|------------|--------|
| `INITIAL_PURCHASE`, `RENEWAL`, `PRODUCT_CHANGE`, `UNCANCELLATION` | `active` |
| `BILLING_ISSUE` | `past_due` + `gracePeriodEndsAt` = event time + 7 days (`GRACE_PERIOD_AFTER_PAYMENT_FAILURE_DAYS`) |
| `CANCELLATION` | keep `active` until period end if `expiration_at_ms` in future; else `cancelled` |
| `EXPIRATION` | `cancelled` |

Prefer plan from `product_id` via `mapStoreProductIdToPlan`; if missing, map entitlement id `family` → family / `care_plus` → care_plus with billingPeriod default `monthly`.

- [ ] **Step 4: Re-run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add web/lib/subscription/mapStoreProductIdToPlan.ts \
  web/lib/subscription/googlePlayPlanMap.ts \
  web/lib/subscription/revenueCatWebhook.ts \
  web/lib/subscription/__tests__/
git commit -m "$(cat <<'EOF'
feat(subscription): add RevenueCat webhook mapping helpers

EOF
)"
```

---

### Task 3: Webhook API route

**Files:**
- Create: `web/app/api/subscription/revenuecat/route.ts`
- Modify: `web/.env.example` — add `REVENUECAT_WEBHOOK_SECRET=`
- Create: `web/app/api/subscription/revenuecat/__tests__/route.auth.test.ts` (or unit-test auth helper already covered; prefer a thin route integration test if the repo already tests routes — otherwise rely on Task 2 + manual smoke)

**Interfaces:**
- Consumes: `isRevenueCatWebhookAuthorized`, `mapRevenueCatEventToSubscription`, `parseUserBillingSeed`, `writeComputedEntitlement`, `getAdminDb`
- Produces: `POST` handler returning `{ ok: true }` or error JSON

- [ ] **Step 1: Implement route**

```typescript
// web/app/api/subscription/revenuecat/route.ts
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';

import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { writeComputedEntitlement } from '@/lib/subscription/persistEntitlement';
import { parseUserBillingSeed } from '@/lib/subscription/parseUserBilling';
import {
  isRevenueCatWebhookAuthorized,
  mapRevenueCatEventToSubscription,
  type RevenueCatWebhookBody,
} from '@/lib/subscription/revenueCatWebhook';

export async function POST(request: Request): Promise<NextResponse> {
  if (!hasFirebaseAdminConfig()) {
    return NextResponse.json({ error: 'Firebase Admin not configured.' }, { status: 503 });
  }

  const secret = process.env.REVENUECAT_WEBHOOK_SECRET?.trim() ?? '';
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 503 });
  }

  const auth = request.headers.get('authorization');
  if (!isRevenueCatWebhookAuthorized(auth, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: RevenueCatWebhookBody;
  try {
    body = (await request.json()) as RevenueCatWebhookBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = body.event;
  if (!event?.app_user_id || !event.type) {
    return NextResponse.json({ error: 'Missing event' }, { status: 400 });
  }

  // Ignore anonymous / RC sandbox placeholders that are not Firebase uids
  const uid = event.app_user_id.trim();
  if (!uid || uid.startsWith('$RCAnonymousID:')) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const subscription = mapRevenueCatEventToSubscription(event);
  if (!subscription) {
    return NextResponse.json({ error: 'Unmapped product/entitlement' }, { status: 400 });
  }

  const db = getAdminDb();
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: 'Unknown user' }, { status: 404 });
  }

  const userData = userSnap.data() as Record<string, unknown> | undefined;
  const paidLike =
    subscription.status === 'active' ||
    subscription.status === 'authenticated' ||
    subscription.status === 'past_due';

  await userRef.set(
    {
      subscription,
      ...(paidLike ? { trialConsumed: true } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const seed = parseUserBillingSeed({
    ...userData,
    subscription,
    trialConsumed: paidLike ? true : userData?.trialConsumed === true,
  });
  await writeComputedEntitlement(db, uid, seed);
  return NextResponse.json({ ok: true });
}
```

Shape `RevenueCatWebhookBody` as `{ api_version?: string; event: RevenueCatEventPayload }` matching RC docs.

- [ ] **Step 2: Add env example line**

```bash
# RevenueCat (mobile store webhooks)
REVENUECAT_WEBHOOK_SECRET=
```

- [ ] **Step 3: Typecheck web / run related tests**

```bash
cd web && npx tsc --noEmit
cd .. && yarn test --watchman=false web/lib/subscription/__tests__/
```

- [ ] **Step 4: Commit**

```bash
git add web/app/api/subscription/revenuecat/route.ts web/.env.example web/lib/subscription/
git commit -m "$(cat <<'EOF'
feat(api): add RevenueCat subscription webhook endpoint

EOF
)"
```

---

### Task 4: RevenueCat client + env keys (mobile)

**Files:**
- Create: `src/infrastructure/purchases/revenueCatClient.ts`
- Create: `src/infrastructure/purchases/__tests__/revenueCatClient.config.test.ts` (pure helpers only — mock Purchases)
- Modify: `src/types/env.d.ts`
- Modify: project `.env.example` / env docs if the repo has one for RN (add keys next to PostHog)

**Interfaces:**
- Produces:
  - `configureRevenueCat(): void`
  - `loginRevenueCatUser(uid: string): Promise<void>`
  - `logoutRevenueCatUser(): Promise<void>`
  - `purchaseStorePackage(planKey, billingPeriod): Promise<void>`
  - `restoreRevenueCatPurchases(): Promise<void>`
  - `waitForEntitlementSync(refresh: () => Promise<unknown>, attempts?: number): Promise<void>`

- [ ] **Step 1: Extend env types**

```typescript
// src/types/env.d.ts
declare module 'react-native-config' {
  export interface NativeConfig {
    POSTHOG_PROJECT_TOKEN?: string;
    POSTHOG_HOST?: string;
    REVENUECAT_GOOGLE_API_KEY?: string;
    REVENUECAT_APPLE_API_KEY?: string;
  }
  export const Config: NativeConfig;
  export default Config;
}
```

- [ ] **Step 2: Add dependency**

```bash
yarn add react-native-purchases
```

Rebuild native apps after install (`yarn android` / pod install for iOS).

- [ ] **Step 3: Implement client**

```typescript
// src/infrastructure/purchases/revenueCatClient.ts
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
```

Keep domain free of Purchases types — only this file imports the SDK.

- [ ] **Step 4: Commit**

```bash
git add package.json yarn.lock src/infrastructure/purchases/ src/types/env.d.ts
git commit -m "$(cat <<'EOF'
feat(purchases): add RevenueCat client wrapper and env keys

EOF
)"
```

---

### Task 5: Wire auth session ↔ RevenueCat identity

**Files:**
- Modify: `src/app/navigation/RootNavigator.tsx` (session effects around auth)
- Optionally thin use case wrappers if composition root prefers — not required if RootNavigator already orchestrates subscription listen/bootstrap

**Interfaces:**
- Consumes: `configureRevenueCat`, `loginRevenueCatUser`, `logoutRevenueCatUser`
- Produces: RC user id always equals Firebase `userId` while authenticated

- [ ] **Step 1: On app start / module load path, call `configureRevenueCat()` once**

Near other bootstrap in `RootNavigator` (or `App.tsx` if that is where PostHog is configured — match existing infra init style). Prefer next to first authenticated session effect.

- [ ] **Step 2: When `isAuthenticated && userId`, after `startListening`:**

```typescript
void loginRevenueCatUser(userId).catch(() => {});
```

- [ ] **Step 3: When logging out / `!isAuthenticated`:**

```typescript
void logoutRevenueCatUser().catch(() => {});
```

Call this in the same effect branch that already calls `subscriptionApi.stopListening()`.

- [ ] **Step 4: Manual sanity** — sign in, confirm RC dashboard shows the Firebase uid (not only anonymous).

- [ ] **Step 5: Commit**

```bash
git add src/app/navigation/RootNavigator.tsx
git commit -m "$(cat <<'EOF'
feat(subscription): bind RevenueCat identity to Firebase uid

EOF
)"
```

---

### Task 6: Replace Play IAP checkout with RevenueCat

**Files:**
- Modify: `src/modules/subscription/domain/repositories/SubscriptionRepository.ts`
- Create: `src/modules/subscription/domain/usecases/CheckoutStoreSubscription.ts`
- Create: `src/modules/subscription/domain/usecases/RestoreStorePurchases.ts`
- Modify or deprecate: `CheckoutPlayStoreSubscription.ts` (replace call sites; delete if unused)
- Modify: `src/modules/subscription/data/datasources/SubscriptionRemoteDataSource.ts`
- Modify: `src/modules/subscription/data/repositories/SubscriptionRepositoryImpl.ts`
- Modify: `src/modules/subscription/subscriptionComposition.ts`
- Modify: `src/modules/subscription/store/subscriptionStore.ts`
- Modify: `src/modules/subscription/data/subscriptionApi.ts` — stop requiring `postVerifyGooglePlaySubscription` for new checkout (keep function exported for legacy if desired)

**Interfaces:**
- Produces repository methods:
  - `checkoutStore(planKey, billingPeriod): Promise<ComputedEntitlement>`
  - `restorePurchases(): Promise<ComputedEntitlement>`
- Store methods:
  - `startStoreCheckout(...)` (keep `startPlayStoreCheckout` as alias that calls the new method for one release if Paywall still references old name — prefer rename + update Paywall in Task 7)

- [ ] **Step 1: Update repository interface**

```typescript
checkoutStore(
  planKey: PlayStorePlanKey,
  billingPeriod: 'monthly' | 'annual',
): Promise<ComputedEntitlement>;
restorePurchases(): Promise<ComputedEntitlement>;
```

Remove `checkoutPlayStore` once call sites updated (or make it call `checkoutStore`).

- [ ] **Step 2: Implement data source**

```typescript
async checkoutStore(planKey, billingPeriod) {
  if (Platform.OS === 'ios') {
    throw new Error(
      'App Store subscriptions are not available in this build yet.',
    );
  }
  await purchaseStorePackage(planKey, billingPeriod);
  await waitForEntitlementSync(() => this.refreshBootstrap());
  const entitlement = await this.refreshBootstrap();
  return entitlement;
}

async restorePurchases() {
  await restoreRevenueCatPurchases();
  await waitForEntitlementSync(() => this.refreshBootstrap());
  return this.refreshBootstrap();
}
```

Do **not** call `postVerifyGooglePlaySubscription` anymore.

- [ ] **Step 3: Wire use cases + composition + store**

Mirror existing `CheckoutPlayStoreSubscription` pattern; on success set entitlement like today.

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/modules/subscription/
git commit -m "$(cat <<'EOF'
feat(subscription): checkout and restore via RevenueCat

EOF
)"
```

---

### Task 7: Paywall UX — restore, iOS gate, copy

**Files:**
- Modify: `src/modules/subscription/ui/screens/PaywallScreen.tsx`

**Interfaces:**
- Consumes: `startStoreCheckout`, `restorePurchases`, `checkoutLoading`, `checkoutError` from store

- [ ] **Step 1: Replace `startPlayStoreCheckout` calls with `startStoreCheckout`**

- [ ] **Step 2: Disable purchase CTAs on iOS**

```typescript
const storeCheckoutEnabled = Platform.OS === 'android';
```

When disabled, show caption: `App Store billing is coming soon. You can still continue on Free / trial.`

- [ ] **Step 3: Add Restore purchases control** (Android + iOS)

```typescript
<Pressable
  disabled={checkoutLoading}
  onPress={() => {
    void trackEvent('subscription_restore_started', { source });
    void restorePurchases();
  }}
>
  <Text>Restore purchases</Text>
</Pressable>
```

Use theme tokens / existing styles — no hardcoded hex.

- [ ] **Step 4: Update footer copy**

From Play-only verification wording to something like:  
`Subscriptions are billed by Google Play. Your plan updates after purchase confirmation.`

- [ ] **Step 5: Commit**

```bash
git add src/modules/subscription/ui/screens/PaywallScreen.tsx src/modules/subscription/store/subscriptionStore.ts
git commit -m "$(cat <<'EOF'
feat(paywall): RevenueCat restore and Android-first store CTAs

EOF
)"
```

---

### Task 8: Remove dead IAP checkout path + docs

**Files:**
- Modify: `package.json` — remove `react-native-iap` if no remaining imports
- Grep and delete unused IAP-only code paths
- Modify: `docs/subscription-launch-checklist.md`
- Modify: `docs/superpowers/specs/2026-09-13-revenuecat-integration-design.md` status already Approved

- [ ] **Step 1: Grep for `react-native-iap` and `postVerifyGooglePlaySubscription` usage**

If only legacy verify remains unused from app, leave the API route but remove the RN dependency and require/import.

- [ ] **Step 2: Update launch checklist** with RC steps:

1. Fix Play payments profile  
2. Create RC project + entitlements `care_plus` / `family`  
3. Attach four Play products; publish `default` offering  
4. Set `REVENUECAT_GOOGLE_API_KEY` in RN env; `REVENUECAT_WEBHOOK_SECRET` on Vercel  
5. Webhook URL → `/api/subscription/revenuecat`  
6. Internal track purchase test  

- [ ] **Step 3: Run full subscription-related tests**

```bash
yarn test --watchman=false src/shared/subscription web/lib/subscription src/modules/subscription
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add package.json yarn.lock docs/subscription-launch-checklist.md src/ modules/ 2>/dev/null; git add -u
git commit -m "$(cat <<'EOF'
chore(subscription): drop IAP checkout path and document RevenueCat launch

EOF
)"
```

---

## Manual QA (after code)

1. Fix Play Console payments profile.  
2. RC dashboard: offerings return the four products for the Android app.  
3. Internal test account: purchase Care+ monthly → Firestore `subscription.provider === 'revenuecat'` and `entitlement.source === 'paid'`.  
4. Restore on second device / reinstall with same Google account + Firebase user.  
5. Cancel / expire in Play → webhook updates entitlement.  
6. Confirm Razorpay web subscription still writes entitlement.  
7. iOS build: paywall shows coming soon; no crash on configure without Apple key.

---

## Spec coverage self-check

| Spec item | Task |
|-----------|------|
| Hybrid Firestore truth | 3, 6 |
| RC replace IAP checkout | 4, 6, 8 |
| Webhook → writeComputedEntitlement | 2, 3 |
| provider `revenuecat` | 1 |
| Product IDs / offerings | 2, 4, ops QA |
| logIn Firebase uid | 5 |
| Android-first / iOS gate | 6, 7 |
| Restore | 6, 7 |
| Razorpay unchanged | (no task mutates Razorpay) |
| Launch checklist | 8 |
| Payments profile blocker | Manual QA + checklist |

## Placeholder scan

No TBD/TODO steps; commands and code included per task.
