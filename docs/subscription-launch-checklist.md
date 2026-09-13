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
3. Create entitlements **`care_plus`** and **`family`** in the RC dashboard.
4. Attach the four Play subscription products; IDs must match **`src/shared/subscription/playStoreCatalog.ts`** (`PLAY_STORE_PLANS`) and **`web/.env.example`** (`PLAY_SUB_*`):
   - `care_plus_monthly`, `care_plus_annual`, `family_monthly`, `family_annual`
5. Publish the **`default`** offering with packages for all four products.
6. Set **`REVENUECAT_GOOGLE_API_KEY`** in the RN app env (`.env` / release build config).
7. Configure RevenueCat webhook URL → **`https://<site>/api/subscription/revenuecat`** (production Vercel URL).
8. Add license testers and run an **internal testing track** purchase end-to-end.
9. Confirm Firestore: `subscription.provider === 'revenuecat'` and `entitlement.source === 'paid'` after purchase.

---

## Step D — Firestore rules

- Ensure users can **read** their own `users/{uid}` document (including `entitlement`).
- Only **backend / Admin SDK** should **write** billing and entitlement fields.

---

## Follow-ups (not done in core wiring)

| Item | Notes |
|------|--------|
| **iOS IAP** | RC SDK wired; purchase CTAs gated until App Store products + RC App Store app exist. |
| **Razorpay in Paywall** | API client exists (`postCreateRazorpaySubscription`); UI + RN Razorpay flow still to wire. |
| **Crash / analytics** | Recommended before scaling traffic. |
