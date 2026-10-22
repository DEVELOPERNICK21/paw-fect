/**
 * Production origin of the Next.js app (scheme + host, no trailing slash).
 * Used for `/api/entitlement/bootstrap`, Play verify, Razorpay create, etc.
 *
 * Deployed site: https://paw-fect.vercel.app/
 */
export const RELEASE_BACKEND_BASE_URL = 'https://paw-fect.vercel.app';

/**
 * Public install / marketing page used as the trailing link in share-card
 * captions and on the card footer. v1 points to the static download page;
 * v1.1 will swap this for per-pet deep-link tokens.
 */
export const SHARE_INSTALL_URL = `${RELEASE_BACKEND_BASE_URL}/download`;

/** Public legal pages served by the marketing site (also used in store listings). */
export const PRIVACY_POLICY_URL = `${RELEASE_BACKEND_BASE_URL}/privacy`;
export const TERMS_OF_USE_URL = `${RELEASE_BACKEND_BASE_URL}/terms`;
