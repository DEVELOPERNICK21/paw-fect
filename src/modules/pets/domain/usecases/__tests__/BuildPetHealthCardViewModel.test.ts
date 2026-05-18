import { BuildPetHealthCardViewModel } from '../BuildPetHealthCardViewModel';
import type { Pet } from '../../models/Pet';
import type { SmartHealthRecord } from '../../../../records/domain/models/SmartHealthRecord';

const REF_NOW = new Date('2026-05-11T12:00:00.000Z');

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: 'pet-1',
    userId: 'user-1',
    name: 'Bruno',
    type: 'dog',
    breed: 'Golden Retriever',
    dob: '2024-01-11',
    createdAt: '2024-01-11T00:00:00.000Z',
    updatedAt: '2024-01-11T00:00:00.000Z',
    ...overrides,
  };
}

function makeRecord(
  overrides: Partial<SmartHealthRecord> = {},
): SmartHealthRecord {
  return {
    id: 'rec-1',
    userId: 'user-1',
    petId: 'pet-1',
    type: 'vaccination',
    name: 'DHPP annual',
    dueDate: '2026-05-22',
    completedDate: null,
    status: 'upcoming',
    recurrenceType: 'yearly',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('BuildPetHealthCardViewModel', () => {
  it('returns view model with name, breed, age, items', async () => {
    const useCase = new BuildPetHealthCardViewModel({
      getPetById: async () => makePet(),
      listSmartHealthRecords: async () => [
        makeRecord({
          id: 'r1',
          name: 'Rabies booster',
          dueDate: '2026-05-22',
          status: 'upcoming',
        }),
        makeRecord({
          id: 'r2',
          name: 'DHPP annual',
          status: 'completed',
          completedDate: '2026-03-01',
          dueDate: '2026-03-01',
        }),
        makeRecord({
          id: 'r3',
          type: 'deworming',
          name: 'Deworming',
          status: 'completed',
          completedDate: '2026-02-01',
          dueDate: '2026-02-01',
        }),
      ],
      now: () => REF_NOW,
    });

    const vm = await useCase.execute({ userId: 'user-1', petId: 'pet-1' });

    expect(vm.pet.name).toBe('Bruno');
    expect(vm.pet.breedLabel).toBe('Golden Retriever');
    expect(vm.pet.ageLabel).toBe('2 yrs 4 mo');
    expect(vm.pet.speciesLabel).toBe('Dog');
    expect(vm.pet.genderLabel).toBeNull();
    expect(vm.highlights.length).toBeGreaterThan(0);
    expect(vm.glance.length).toBeGreaterThan(0);
    expect(vm.snapshot.kind).toBe('items');
    if (vm.snapshot.kind !== 'items') throw new Error();
    expect(vm.snapshot.items).toHaveLength(3);
    expect(vm.snapshot.items[0]).toEqual({
      label: 'Rabies booster',
      status: 'due_in',
      detail: 'Due in 11 days',
    });
    expect(vm.snapshot.items[1].status).toBe('done');
    expect(vm.snapshot.items[2].status).toBe('done');
  });

  it('marks overdue when due date is in the past', async () => {
    const useCase = new BuildPetHealthCardViewModel({
      getPetById: async () => makePet(),
      listSmartHealthRecords: async () => [
        makeRecord({
          id: 'r1',
          name: 'Rabies booster',
          dueDate: '2026-04-01',
          status: 'overdue',
        }),
      ],
      now: () => REF_NOW,
    });

    const vm = await useCase.execute({ userId: 'user-1', petId: 'pet-1' });

    if (vm.snapshot.kind !== 'items') throw new Error();
    expect(vm.snapshot.items[0].status).toBe('overdue');
    expect(vm.snapshot.items[0].detail).toBe('Overdue');
  });

  it('handles pet with no breed or dob', async () => {
    const useCase = new BuildPetHealthCardViewModel({
      getPetById: async () => makePet({ breed: undefined, dob: undefined }),
      listSmartHealthRecords: async () => [],
      now: () => REF_NOW,
    });

    const vm = await useCase.execute({ userId: 'user-1', petId: 'pet-1' });

    expect(vm.pet.breedLabel).toBeNull();
    expect(vm.pet.ageLabel).toBeNull();
  });

  it('returns empty snapshot when pet has no records', async () => {
    const useCase = new BuildPetHealthCardViewModel({
      getPetById: async () => makePet(),
      listSmartHealthRecords: async () => [],
      now: () => REF_NOW,
    });

    const vm = await useCase.execute({ userId: 'user-1', petId: 'pet-1' });

    expect(vm.snapshot.kind).toBe('empty');
    if (vm.snapshot.kind !== 'empty') throw new Error();
    expect(vm.snapshot.speciesEmoji).toBe('🐕');
  });

  it('uses cat emoji for cat pets in empty state', async () => {
    const useCase = new BuildPetHealthCardViewModel({
      getPetById: async () => makePet({ type: 'cat' }),
      listSmartHealthRecords: async () => [],
      now: () => REF_NOW,
    });

    const vm = await useCase.execute({ userId: 'user-1', petId: 'pet-1' });

    if (vm.snapshot.kind !== 'empty') throw new Error();
    expect(vm.snapshot.speciesEmoji).toBe('🐈');
  });

  it('throws when pet is not found', async () => {
    const useCase = new BuildPetHealthCardViewModel({
      getPetById: async () => null,
      listSmartHealthRecords: async () => [],
      now: () => REF_NOW,
    });

    await expect(
      useCase.execute({ userId: 'user-1', petId: 'missing' }),
    ).rejects.toThrow(/Pet not found/i);
  });

  it('caps snapshot at 3 items: 1 upcoming + 2 most recent completed', async () => {
    const useCase = new BuildPetHealthCardViewModel({
      getPetById: async () => makePet(),
      listSmartHealthRecords: async () => [
        makeRecord({
          id: 'r1',
          name: 'Rabies',
          dueDate: '2026-05-22',
          status: 'upcoming',
        }),
        makeRecord({
          id: 'rc1',
          name: 'DHPP',
          status: 'completed',
          completedDate: '2026-03-01',
          dueDate: '2026-03-01',
        }),
        makeRecord({
          id: 'rc2',
          name: 'Deworm Feb',
          type: 'deworming',
          status: 'completed',
          completedDate: '2026-02-01',
          dueDate: '2026-02-01',
        }),
        makeRecord({
          id: 'rc3',
          name: 'Deworm Jan',
          type: 'deworming',
          status: 'completed',
          completedDate: '2026-01-01',
          dueDate: '2026-01-01',
        }),
      ],
      now: () => REF_NOW,
    });

    const vm = await useCase.execute({ userId: 'user-1', petId: 'pet-1' });

    if (vm.snapshot.kind !== 'items') throw new Error();
    expect(vm.snapshot.items.map(i => i.label)).toEqual([
      'Rabies',
      'DHPP',
      'Deworm Feb',
    ]);
  });
});
