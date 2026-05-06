# Subscription launch checklist

The mobile app syncs entitlement by:

1. **`POST /api/entitlement/bootstrap`** after sign-in (trial seed + computed entitlement).
2. **Firestore listener** on `users/{uid}` reading `entitlement` (updates after Play verify / webhooks).

Root wiring lives in `RootNavigator.tsx` (`startListening`, `refreshBootstrap`, `stopListening` on logout).

---

## Step A — Production API URL

1. **`src/shared/constants/releaseBackend.ts`** — currently points at **`https://paw-fect.vercel.app`** (no trailing slash). Change there if you add a custom domain later; then rebuild the release app.
2. On Vercel, set **`NEXT_PUBLIC_SITE_URL=https://paw-fect.vercel.app`** (or your custom domain) so server-side URLs match production.

---

## Step B — Deploy Next.js (`web/`)

1. Copy **`web/.env.example`** → `.env` / Vercel env.
2. Configure **Firebase Admin** (same project as the RN app).
3. Configure **Google Play** service account for **`/api/subscription/google/verify`** (`GOOGLE_PLAY_*` in `.env.example`).
4. Optionally configure **Razorpay** for web/Android checkout alternatives (`subscription/razorpay/*`, webhooks).

---

## Step C — Google Play (Android)

1. Create subscription products in Play Console; IDs must match:

   - **`src/shared/subscription/playStoreCatalog.ts`** (`PLAY_STORE_PLANS`)
   - **`web/.env.example`** (`PLAY_SUB_*`)

2. Add license testers and run an internal testing track purchase.
3. Confirm logs: verify route returns entitlement and Firestore updates.

---

## Step D — Firestore rules

- Ensure users can **read** their own `users/{uid}` document (including `entitlement`).
- Only **backend / Admin SDK** should **write** billing and entitlement fields.

---

## Follow-ups (not done in core wiring)

| Item | Notes |
|------|--------|
| **iOS IAP** | Paywall currently uses Play Billing only; add StoreKit + backend verification. |
| **Razorpay in Paywall** | API client exists (`postCreateRazorpaySubscription`); UI + RN Razorpay flow still to wire. |
| **Crash / analytics** | Recommended before scaling traffic. |
