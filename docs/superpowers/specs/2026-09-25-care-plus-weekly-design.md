# Care+ Weekly subscription

**Date:** 2026-09-25  
**Status:** Approved for implementation

## Decision

Add **Care+ Weekly** only (`care_plus_weekly`, ₹49/week).  
Same Care+ features / `pawsoul_pro` entitlement. No Family weekly. No new entitlement.

## Cross-platform India prices (canonical)

Use these same amounts on App Store, Play Store, website, and marketing copy.
Annuals use App Store India tiers (₹1,490 / ₹2,990 / ₹3,299 are not available on Apple).

| Product ID | Duration | India price |
|------------|----------|-------------|
| `care_plus_weekly` | 1 week | **₹49** |
| `care_plus_monthly` | 1 month | **₹149** |
| `care_plus_annual` | 1 year | **₹1,499** |
| `family_monthly` | 1 month | **₹299** |
| `family_annual` | 1 year | **₹2,999** |

## Product IDs (RevenueCat)

| Store | Identifier |
|-------|------------|
| App Store | `care_plus_weekly` (1 week) |
| Play | `care_plus_weekly` + base plan `weekly` → RC often `care_plus_weekly:weekly` |
| RC entitlement | `pawsoul_pro` |
| RC package | `$rc_weekly` on offering `default` |

## App changes

- Extend `SubscriptionBillingPeriod` / store checkout types with `'weekly'`
- Catalogs: `playStoreCatalog`, `revenueCatCatalog`, `planCatalog` (INR aligned to Apple tiers)
- Webhook mapping: `mapStoreProductIdToPlan` (+ Play base-plan suffix)
- Parse Firestore subscription `billingPeriod: 'weekly'`
- Paywall remains RevenueCat UI — Annual recommended; **prices always from stores**
- Website defaults + pricing cards use the same INR list

## Out of scope

- Family weekly
- Razorpay weekly
- Hardcoded ₹49 in purchase logic (store localized price via RC)
