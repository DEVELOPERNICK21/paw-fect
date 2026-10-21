/**
 * Public support inbox. Gmail plus-aliases deliver to the base account
 * (developernick1@gmail.com) and can be filtered by the +tag.
 */
export const SUPPORT_EMAIL = "developernick1+pawfect@gmail.com";

export function supportMailto(subject?: string): string {
  if (subject == null || subject.trim().length === 0) {
    return `mailto:${SUPPORT_EMAIL}`;
  }
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
