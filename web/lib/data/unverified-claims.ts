/**
 * Public marketing copy must only describe what the shipped app does.
 * The CMS (Firestore) can still hold older copy, so these checks keep claims
 * we cannot back yet off the website until the product catches up.
 *
 * Remove a pattern here once the matching feature has genuinely shipped
 * (e.g. "vet-validated" after the schedules are reviewed by a vet).
 */
const UNVERIFIED_CLAIMS: readonly RegExp[] = [
  /vet[- ]?(validated|aligned)/i,
  /\bpdf\b/i,
  /vet sharing|share with (your )?vet/i,
  /multi[- ]?user/i,
];

export function hasUnverifiedClaim(text: string): boolean {
  return UNVERIFIED_CLAIMS.some((pattern) => pattern.test(text));
}
