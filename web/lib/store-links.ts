/**
 * Single source of truth for the live store listings.
 * Region-neutral URLs: each store sends visitors to their own country's page
 * (the `/in/` App Store URL would send everyone to the India storefront).
 */
export const IOS_APP_ID = "6814786946";
export const APP_STORE_URL = `https://apps.apple.com/app/id${IOS_APP_ID}`;
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=app.pawfect";

/** Where on the site a store click came from (shows up in store analytics). */
export type StoreSource = "hero" | "download_page" | "cta_band" | "sticky" | "pricing" | "plan_demo" | "premium" | "quiz" | "rewards" | "together";

/**
 * App Store campaign token (`ct`). For App Store Connect campaign reports add your
 * provider token as `pt=<token>` here (App Store Connect → Analytics → Campaigns).
 */
export function appStoreLink(source: StoreSource): string {
  return `${APP_STORE_URL}?ct=${source}`;
}

/** Google Play install referrer: appears under Play Console acquisition reports. */
export function playStoreLink(source: StoreSource): string {
  const referrer = encodeURIComponent(`utm_source=website&utm_medium=${source}&utm_campaign=landing`);
  return `${PLAY_STORE_URL}&referrer=${referrer}`;
}
