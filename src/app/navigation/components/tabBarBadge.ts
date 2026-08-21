/**
 * Compact tab-badge copy. Empty when there is nothing to signal.
 * Caps at 9+ so a two-character chip stays readable at tab size.
 */
export function formatTabBadgeCount(count: number): string | null {
  if (count <= 0) {
    return null;
  }
  if (count > 9) {
    return '9+';
  }
  return String(count);
}
