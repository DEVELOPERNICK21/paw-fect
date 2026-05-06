export type PetAccessLevel = 'full' | 'read_only';

export interface PetCreatedOrder {
  readonly id: string;
  readonly createdAt: string;
}

/**
 * Oldest pets (by createdAt) stay fully editable up to maxPets; extras are read-only after downgrade.
 */
export function classifyPetAccessByCreatedAt(
  pets: readonly PetCreatedOrder[],
  maxPets: number,
): Map<string, PetAccessLevel> {
  const sorted = [...pets].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  const map = new Map<string, PetAccessLevel>();
  sorted.forEach((pet, index) => {
    map.set(pet.id, index < maxPets ? 'full' : 'read_only');
  });
  return map;
}

export function getPetAccess(
  pets: readonly PetCreatedOrder[],
  maxPets: number,
  petId: string,
): PetAccessLevel {
  return classifyPetAccessByCreatedAt(pets, maxPets).get(petId) ?? 'read_only';
}
