import type {
  Pet,
  PetGender,
  PetLifestyleRiskLevel,
  PetLifestyleType,
  PetRegion,
  PetSyncStatus,
  PetType,
} from './Pet';

const isPetType = (v: unknown): v is PetType => v === 'dog' || v === 'cat';

const isPetGender = (v: unknown): v is PetGender =>
  v === 'male' || v === 'female' || v === 'unknown';

const isPetSyncStatus = (v: unknown): v is PetSyncStatus =>
  v === 'pending' || v === 'synced' || v === 'failed';
const isPetLifestyleType = (v: unknown): v is PetLifestyleType =>
  v === 'indoor' || v === 'outdoor' || v === 'mixed';
const isPetLifestyleRiskLevel = (v: unknown): v is PetLifestyleRiskLevel =>
  v === 'low' || v === 'medium' || v === 'high';
const isPetRegion = (v: unknown): v is PetRegion =>
  v === 'IN' || v === 'US' || v === 'EU' || v === 'OTHER';

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
  const rawLifestyle =
    o.lifestyle && typeof o.lifestyle === 'object'
      ? (o.lifestyle as Record<string, unknown>)
      : null;
  const lifestyleType = rawLifestyle?.type;
  const lifestyleRisk = rawLifestyle?.riskLevel;

  return {
    id: o.id,
    userId: uid,
    name: o.name,
    type: o.type,
    breed: typeof o.breed === 'string' ? o.breed : undefined,
    gender,
    dob: typeof o.dob === 'string' ? o.dob : undefined,
    lifestyle:
      isPetLifestyleType(lifestyleType) && isPetLifestyleRiskLevel(lifestyleRisk)
        ? {
            type: lifestyleType,
            riskLevel: lifestyleRisk,
          }
        : {
            type: 'indoor',
            riskLevel: 'low',
          },
    region: isPetRegion(o.region) ? o.region : 'OTHER',
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
