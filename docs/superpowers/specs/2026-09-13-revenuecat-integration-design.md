# RevenueCat Integration Design

**Date:** 2026-09-13  
**Status:** Approved for planning  

**App:** Pawsoul (React Native) + `web/` Next.js backend  

## Goal

Use **RevenueCat** as the mobile store purchase layer (Google Play now, App Store when products exist), while keeping **Firestore entitlement** as the single source of truth for plan limits, trial, and paid access — including web Razorpay.

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Scope | Full RC for Android + iOS SDK wiring; **ship/test Android first** |
| Entitlement model | **Hybrid:** RC for checkout/restore; Firestore remains source of truth |
| Razorpay | Keep web Razorpay as-is; same Firestore entitlement writer |
| Play products | Already in Play Console; IDs match `playStoreCatalog.ts` |
| iOS products | Not created yet — code ready, purchase gated until App Store + RC link |
| Approach | Replace `react-native-iap` checkout with `react-native-purchases`; webhook → backend → `writeComputedEntitlement` |

## Context (current system)

- Plans: `free` / `care_plus` / `family` in `src/shared/subscription/planCatalog.ts`
- Play product IDs: `care_plus_monthly`, `care_plus_annual`, `family_monthly`, `family_annual`
- Mobile checkout today: `react-native-iap` → `POST /api/subscription/google/verify`
- Entitlement: bootstrap + Firestore listener on `users/{uid}.entitlement`
- Web: Razorpay subscription APIs + webhooks (unchanged)

## Architecture

```
Paywall
  → Purchases.purchasePackage(package)
  → RevenueCat validates with Play / App Store
  → Webhook POST /api/subscription/revenuecat
  → Map product/entitlement → care_plus | family
  → writeComputedEntitlement(Firestore)
  → Existing subscriptionStore listener updates UI
```

- After Firebase auth: `Purchases.logIn(firebaseUid)`
- On logout: `Purchases.logOut()`
- Restore: `Purchases.restorePurchases()` then rely on webhook + listener (optional bootstrap refresh)

## Offerings & mapping

### RevenueCat dashboard

| RC concept | Value |
|------------|--------|
| Entitlements | `care_plus`, `family` |
| Play products | `care_plus_monthly`, `care_plus_annual`, `family_monthly`, `family_annual` |
| iOS products | Same IDs when created (or explicit aliases documented in plan) |
| Offering | `default` with packages covering Care Plus / Family × monthly / annual |

### App resolution

Paywall continues to select `planKey` + `billingPeriod` → resolve package via product id from `PLAY_STORE_PLANS` / shared catalog → `purchasePackage`.

### Webhook events (minimum)

Handle at least: `INITIAL_PURCHASE`, `RENEWAL`, `PRODUCT_CHANGE`, `CANCELLATION`, `EXPIRATION`, `BILLING_ISSUE` (and RC’s current equivalents if renamed).

For each event:

1. Authenticate webhook (`REVENUECAT_WEBHOOK_SECRET` / Authorization header).
2. Resolve Firebase uid from RC `app_user_id` (must be Firebase uid via `logIn`).
3. Map active entitlement / product id → `planKey` + `billingPeriod`.
4. Build `StoredSubscriptionState` with `provider: 'revenuecat'`.
5. Merge with existing trial seed fields; call `writeComputedEntitlement`.

### Domain model change

Extend `StoredSubscriptionState.provider` from `'razorpay' | 'google_play'` to include `'revenuecat'`. Update entitlement engine / parsers as needed so paid source still resolves to `source: 'paid'`.

## App touchpoints

| Area | Change |
|------|--------|
| Dependency | Add `react-native-purchases`; remove checkout use of `react-native-iap` |
| Keys | Public SDK keys (Android / iOS) via env — secret key never in the app |
| Auth bridge | `logIn(uid)` / `logOut()` wired with session lifecycle (`RootNavigator` / auth) |
| Data source | `SubscriptionRemoteDataSource.checkoutPlayStore` → RC purchase path (rename use case to store-agnostic if clean) |
| Paywall | Same screens; restore via RC; copy reflects store billing |
| iOS | Compiles; purchase CTA disabled / “Coming soon” until products linked |
| Entitlement reads | Unchanged (Firestore + bootstrap) |

## Backend touchpoints (`web/`)

| Area | Change |
|------|--------|
| New route | `POST /api/subscription/revenuecat` |
| Env | `REVENUECAT_WEBHOOK_SECRET`; keep `PLAY_SUB_*` for product id mapping |
| Persist | Reuse `writeComputedEntitlement` / `parseUserBillingSeed` patterns |
| Legacy | Keep `/api/subscription/google/verify` temporarily for any in-flight tokens; new checkout does not call it |
| Razorpay | No change |

## Ops prerequisites (manual)

1. Fix Play Console **payments profile** issue (blocks real/test charges).
2. Create RevenueCat project; connect Google Play (service account / app).
3. Create entitlements `care_plus` / `family`; attach four Play products; publish `default` offering.
4. Configure webhook → production `https://<site>/api/subscription/revenuecat`.
5. Add license testers; exercise internal testing track purchase end-to-end.
6. Later: App Store Connect subscriptions + RC App Store app + ungate iOS purchase.

## Success criteria

- Android user can purchase Care Plus / Family (monthly or annual) via paywall using RC.
- Firestore `entitlement` updates without the app calling Google verify directly.
- Restore purchases recovers access for the same Firebase uid.
- Trial + Razorpay web entitlements still work unchanged.
- iOS builds; purchase path is gated until products exist.
- Related unit/integration tests for webhook mapping + provider enum.

## Out of scope

- RevenueCat Paywalls / Experiments UI builder
- Migrating historical Play purchase tokens into RC
- Shipping live iOS IAP in this first pass
- Replacing Firestore entitlement reads with CustomerInfo as source of truth

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Payments profile broken in Play | Fix before QA; document as launch blocker |
| Webhook delayed after purchase | Optimistic UX: wait on listener + timeout + bootstrap refresh |
| Anonymous RC user vs Firebase uid | Always `logIn(uid)` before purchase; reject webhook if `app_user_id` unknown |
| Dual providers on one user | Engine stores one `subscription` seed; webhook/Razorpay writers overwrite that field — document last-write / cancel so web vs store don’t clobber unexpectedly |
| iOS accidentally offered | Hard gate on `Platform.OS === 'ios'` until flag/products ready |

## Implementation notes (for plan)

- Prefer Clean Architecture: RC SDK behind subscription data source; domain use cases stay free of SDK types.
- Shared product id constants remain the bridge between app, RC, and webhook mapping.
- Update `docs/subscription-launch-checklist.md` with RC steps after implementation.
