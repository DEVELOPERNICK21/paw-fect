import { createMMKV, type MMKV } from 'react-native-mmkv';

let instance: MMKV | null = null;

/** Returns the shared MMKV instance for wellness and local prefs. */
export function getMmkvInstance(): MMKV {
  if (instance == null) {
    instance = createMMKV({ id: 'pawfect-wellness' });
  }
  return instance;
}

/** Reads a JSON value from MMKV, or null when missing or invalid. */
export function mmkvGetJson<T>(key: string): T | null {
  const raw = getMmkvInstance().getString(key);
  if (raw == null) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Serializes and stores a JSON value in MMKV. */
export function mmkvSetJson<T>(key: string, value: T): void {
  getMmkvInstance().set(key, JSON.stringify(value));
}

/** Removes a key from MMKV. */
export function mmkvDelete(key: string): void {
  getMmkvInstance().remove(key);
}

/** Lists all MMKV keys (for pruning old task entries). */
export function mmkvGetAllKeys(): string[] {
  return getMmkvInstance().getAllKeys();
}
