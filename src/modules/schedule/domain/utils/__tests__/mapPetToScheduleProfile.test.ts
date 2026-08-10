import type { Pet } from '../../../../pets/domain/models/Pet';
import {
  isIndieBreed,
  mapPetToScheduleProfile,
} from '../mapPetToScheduleProfile';

function basePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: 'p1',
    userId: 'u1',
    name: 'Rocky',
    type: 'dog',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('mapPetToScheduleProfile', () => {
  it('detects Indie / desi / street / mongrel / pariah breed strings', () => {
    expect(isIndieBreed('Indie')).toBe(true);
    expect(isIndieBreed('Desi mix')).toBe(true);
    expect(isIndieBreed('Street dog')).toBe(true);
    expect(isIndieBreed('Mongrel')).toBe(true);
    expect(isIndieBreed('Indian Pariah')).toBe(true);
    expect(isIndieBreed('Labrador Retriever')).toBe(false);
  });

  it('maps Indie dogs to medium size and high (medium-high) energy', () => {
    const profile = mapPetToScheduleProfile(
      basePet({ breed: 'Indie / desi', lifestyle: { type: 'outdoor', riskLevel: 'medium' } }),
    );
    expect(profile.size).toBe('medium');
    expect(profile.energyLevel).toBe('high');
    expect(profile.coatType).toBe('short');
  });

  it('keeps Labrador as large', () => {
    const profile = mapPetToScheduleProfile(basePet({ breed: 'Labrador Retriever' }));
    expect(profile.size).toBe('large');
  });
});
