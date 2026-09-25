# Subscription launch checklist

The mobile app syncs entitlement by:

1. **`POST /api/entitlement/bootstrap`** after sign-in (trial seed + computed entitlement).
2. **Firestore listener** on `users/{uid}` reading `entitlement` (updates after RevenueCat webhook / Razorpay webhooks).

Root wiring lives in `RootNavigator.tsx` (`startListening`, `refreshBootstrap`, `stopListening` on logout).

Mobile checkout uses **RevenueCat** (`react-native-purchases`) — not direct Play Billing. The legacy **`POST /api/subscription/google/verify`** route remains for in-flight tokens but is no longer called from the app.

---

## Step A — Production API URL

1. **`src/shared/constants/releaseBackend.ts`** — currently points at **`https://paw-fect.vercel.app`** (no trailing slash). Change there if you add a custom domain later; then rebuild the release app.
2. On Vercel, set **`NEXT_PUBLIC_SITE_URL=https://paw-fect.vercel.app`** (or your custom domain) so server-side URLs match production.

---

## Step B — Deploy Next.js (`web/`)

1. Copy **`web/.env.example`** → `.env` / Vercel env.
2. Configure **Firebase Admin** (same project as the RN app).
3. Set **`REVENUECAT_WEBHOOK_SECRET`** on Vercel (webhook auth for `/api/subscription/revenuecat`).
4. Keep **`GOOGLE_PLAY_*`** env vars for legacy verify route (`/api/subscription/google/verify`) and product id mapping (`PLAY_SUB_*`).
5. Optionally configure **Razorpay** for web/Android checkout alternatives (`subscription/razorpay/*`, webhooks).

---

## Step C — RevenueCat + Google Play (Android)

1. **Fix Play Console payments profile** — required before real or test charges succeed.
2. Create a **RevenueCat project**; connect the Google Play app (service account / app link).
3. Create entitlement **`pawsoul_pro`** (identifier must match exactly) and attach all four products to it. Optionally keep plan-specific entitlements for analytics; the app unlocks Pro via `pawsoul_pro`, while Firestore plan (`care_plus` / `family`) is mapped from **product_id**.
4. Attach Play / App Store subscription products; IDs must match **`src/shared/subscription/playStoreCatalog.ts`** / **`revenueCatCatalog.ts`**:
   - Care+: `care_plus_weekly` (RC `$rc_weekly`), `care_plus_monthly` (`$rc_monthly`), `care_plus_annual` (`$rc_annual`)
   - Family: `family_monthly` (`custom_monthly_2`), `family_annual` (`custom_yearly_2`)
5. Publish the **`default`** offering with those packages, then attach a **Paywall** (highlight **Annual** as best value; Weekly last among Care+). Enable **Customer Center**.
6. Set **`REVENUECAT_GOOGLE_API_KEY`** and **`REVENUECAT_APPLE_API_KEY`** in the RN app `.env` / release build.
7. Configure RevenueCat webhook URL → **`https://paw-fect.vercel.app/api/subscription/revenuecat`** with **`REVENUECAT_WEBHOOK_SECRET`**.
8. On Vercel, set `PLAY_SUB_CARE_PLUS_WEEKLY=care_plus_weekly` (and existing `PLAY_SUB_*` ids).
9. Add license / Sandbox testers and run purchase end-to-end (Paywall CTA + Settings → Manage subscription).
10. Confirm Firestore: `subscription.provider === 'revenuecat'` and `entitlement.source === 'paid'` after purchase.

### Care+ Weekly store setup

| Store | Create |
|-------|--------|
| **Play** | Product `care_plus_weekly`, base plan `weekly`, ₹49/week |
| **App Store** | Auto-renewable `care_plus_weekly`, 1 week, ₹49/week (same subscription group) |
| **RC Paywall** | Package order: Annual → Monthly → Weekly → Family…; Annual = recommended |

### Canonical India prices (all platforms)

| Product ID | Period | Price |
|------------|--------|-------|
| `care_plus_weekly` | week | **₹49** |
| `care_plus_monthly` | month | **₹149** |
| `care_plus_annual` | year | **₹1,499** |
| `family_monthly` | month | **₹299** |
| `family_annual` | year | **₹2,999** |

Use these exact App Store India tiers on Play as well. Website `pricing_plans` + `planCatalog` must match.

---

## Step D — Firestore rules

- Ensure users can **read** their own `users/{uid}` document (including `entitlement`).
- Only **backend / Admin SDK** should **write** billing and entitlement fields.

---

## Follow-ups (not done in core wiring)

| Item | Notes |
|------|--------|
| **Store products** | Create `care_plus_weekly` in Play + App Store Connect if not live yet; sync in RC. |
| **RC Paywall layout** | Set Annual as default/recommended; Weekly as low-commitment option. |
| **Razorpay in Paywall** | API client exists (`postCreateRazorpaySubscription`); UI + RN Razorpay flow still to wire. |
| **Crash / analytics** | Recommended before scaling traffic. |
