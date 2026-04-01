/**
 * Firestore rejects `undefined` field values. Strip them recursively for plain objects.
 */
export function stripUndefinedDeep<T>(value: T): T {
  if (value === undefined || value === null) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(item => stripUndefinedDeep(item)) as T;
  }
  if (typeof value !== 'object') {
    return value;
  }
  if (value instanceof Date) {
    return value;
  }

  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (v === undefined) {
      continue;
    }
    out[key] =
      v !== null &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      !(v instanceof Date)
        ? stripUndefinedDeep(v)
        : v;
  }
  return out as T;
}
