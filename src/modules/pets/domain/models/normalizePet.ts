import type { Pet, PetGender, PetSyncStatus, PetType } from './Pet';

const isPetType = (v: unknown): v is PetType => v === 'dog' || v === 'cat';

const isPetGender = (v: unknown): v is PetGender =>
  v === 'male' || v === 'female' || v === 'unknown';

const isPetSyncStatus = (v: unknown): v is PetSyncStatus =>
  v === 'pending' || v === 'synced' || v === 'failed';

/**
 * Coerces stored/API JSON into a canonical {@link Pet} for the given owner.
 */
export function normalizePet(raw: unknown, userId: string): Pet | null {
  if (raw === null || typeof raw !== 'object') {
    return null;
  }
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.name !== 'string') {
    return null;
  }
  if (!isPetType(o.type)) {
    return null;
  }
  const createdAt =
    typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString();
  const updatedAt = typeof o.updatedAt === 'string' ? o.updatedAt : createdAt;
  const uid = typeof o.userId === 'string' ? o.userId : userId;

  const syncStatus: PetSyncStatus | undefined = isPetSyncStatus(o.syncStatus)
    ? o.syncStatus
    : 'synced';

  const gender: PetGender | undefined = isPetGender(o.gender)
    ? o.gender
    : undefined;

  return {
    id: o.id,
    userId: uid,
    name: o.name,
    type: o.type,
    breed: typeof o.breed === 'string' ? o.breed : undefined,
    gender,
    dob: typeof o.dob === 'string' ? o.dob : undefined,
    photo: typeof o.photo === 'string' ? o.photo : undefined,
    createdAt,
    updatedAt,
    syncStatus,
  };
}

export function normalizePetsList(raw: unknown, userId: string): Pet[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map(item => normalizePet(item, userId))
    .filter((p): p is Pet => p !== null);
}
