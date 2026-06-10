export function isLikelyOfflineError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes('timed out') ||
    message.includes('network') ||
    message.includes('offline') ||
    message.includes('unavailable') ||
    message.includes('failed to fetch')
  );
}
