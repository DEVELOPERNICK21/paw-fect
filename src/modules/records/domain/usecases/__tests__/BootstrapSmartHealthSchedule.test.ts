import { BootstrapSmartHealthSchedule } from '../BootstrapSmartHealthSchedule';
import type { SmartHealthRecordRepository } from '../../repositories/SmartHealthRecordRepository';
import type { SmartHealthRecord } from '../../models/SmartHealthRecord';

const makeRecord = (overrides: Partial<SmartHealthRecord>): SmartHealthRecord => ({
  id: 'r1',
  userId: 'u1',
  petId: 'pet-1',
  type: 'deworming',
  key: 'DEWORM_2026-01-01',
  family: 'Deworming',
  category: 'core',
  name: 'Deworming',
  dueDate: '2026-01-01',
  completedDate: null,
  status: 'upcoming',
  recurrenceType: 'quarterly',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('BootstrapSmartHealthSchedule', () => {
  it('throws when stale delete candidate has mismatched petId', async () => {
    const repository: SmartHealthRecordRepository = {
      listByPet: jest.fn(async () => [
        makeRecord({
          id: 'stale-1',
          petId: 'pet-2',
          key: 'DEWORM_2024-01-01',
          dueDate: '2024-01-01',
          status: 'overdue',
        }),
      ]),
      upsertMany: jest.fn(async () => {}),
      updateOne: jest.fn(async () => {}),
      appendHistory: jest.fn(async () => {}),
      deleteOne: jest.fn(async () => {}),
      deleteAll: jest.fn(async () => {}),
    };
    const usecase = new BootstrapSmartHealthSchedule(repository);

    await expect(
      usecase.execute({
        userId: 'u1',
        petId: 'pet-1',
        petType: 'dog',
        dateOfBirth: '2025-01-01',
        region: 'IN',
        lifestyleType: 'indoor',
      }),
    ).rejects.toThrow('mismatched petId');

    expect(repository.deleteOne).not.toHaveBeenCalled();
  });
});
