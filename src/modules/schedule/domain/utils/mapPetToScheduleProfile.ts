import type { Pet } from '../../../pets/domain/models/Pet';
import type {
  PetCoatType,
  PetEnergyLevel,
  PetProfile,
  PetSize,
} from '../models/PetProfile';

/** Indie / desi / street-dog style names common in India. */
const INDIE_BREED_MARKERS = [
  'indie',
  'indi',
  'desi',
  'street',
  'mongrel',
  'pariah',
  'indian',
  'desi dog',
  'indian pariah',
] as const;

export function isIndieBreed(breed: string | undefined): boolean {
  const normalized = breed?.toLowerCase().trim() ?? '';
  if (!normalized) {
    return false;
  }
  return INDIE_BREED_MARKERS.some(marker => normalized.includes(marker));
}

function defaultDogSize(breed: string | undefined): PetSize {
  const normalized = breed?.toLowerCase() ?? '';
  if (isIndieBreed(breed)) {
    return 'medium';
  }
  if (normalized.includes('great dane') || normalized.includes('mastiff')) {
    return 'giant';
  }
  if (
    normalized.includes('labrador') ||
    normalized.includes('retriever') ||
    normalized.includes('shepherd') ||
    normalized.includes('husky')
  ) {
    return 'large';
  }
  if (normalized.includes('pug') || normalized.includes('pomeranian')) {
    return 'small';
  }
  return 'medium';
}

function defaultCoatType(breed: string | undefined, species: Pet['type']): PetCoatType {
  const normalized = breed?.toLowerCase() ?? '';
  if (isIndieBreed(breed) && species === 'dog') {
    return 'short';
  }
  if (normalized.includes('husky') || normalized.includes('collie')) {
    return 'double';
  }
  if (normalized.includes('persian') || normalized.includes('maine coon')) {
    return 'long';
  }
  if (species === 'cat' && normalized.includes('shorthair')) {
    return 'short';
  }
  return species === 'cat' ? 'short' : 'medium';
}

/**
 * Indie/desi dogs are typically medium-high energy working street dogs.
 * PetEnergyLevel has no "medium-high", so we map to `high` for walk/play intensity.
 */
function defaultEnergyLevel(breed: string | undefined): PetEnergyLevel {
  const normalized = breed?.toLowerCase() ?? '';
  if (isIndieBreed(breed)) {
    return 'high';
  }
  if (
    normalized.includes('border collie') ||
    normalized.includes('husky') ||
    normalized.includes('bengal')
  ) {
    return 'high';
  }
  if (normalized.includes('pug') || normalized.includes('persian')) {
    return 'low';
  }
  return 'medium';
}

export function mapPetToScheduleProfile(pet: Pet): PetProfile {
  return {
    id: pet.id,
    name: pet.name,
    dob: pet.dob ?? '2020-01-01',
    species: pet.type,
    breed: pet.breed,
    size: pet.type === 'dog' ? defaultDogSize(pet.breed) : undefined,
    lifestyle: pet.lifestyle?.type ?? 'indoor',
    energyLevel: defaultEnergyLevel(pet.breed),
    coatType: defaultCoatType(pet.breed, pet.type),
  };
}
