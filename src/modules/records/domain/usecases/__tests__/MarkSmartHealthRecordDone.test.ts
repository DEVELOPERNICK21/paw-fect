import { MarkSmartHealthRecordDone } from '../MarkSmartHealthRecordDone';
import type { SmartHealthRecordRepository } from '../../repositories/SmartHealthRecordRepository';
import type { SmartHealthRecord } from '../../models/SmartHealthRecord';

const deworm = (overrides: Partial<SmartHealthRecord>): SmartHealthRecord =>
  ({
    id: 'd1',
    userId: 'u1',
    petId: 'p1',
    type: 'deworming',
    name: 'Deworming',
    dueDate: '2026-04-01',
    completedDate: '2026-04-01',
    status: 'completed',
    cadence: 'every_3_months',
    recurrenceType: 'quarterly',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }) as SmartHealthRecord;

describe('MarkSmartHealthRecordDone', () => {
  it('OFF-02 / idempotent: does nothing when record already completed (no repository reads)', async () => {
    const repository: SmartHealthRecordRepository = {
      listByPet: jest.fn(async () => []),
      upsertMany: jest.fn(async () => {}),
      updateOne: jest.fn(async () => {}),
      appendHistory: jest.fn(async () => {}),
      deleteOne: jest.fn(async () => {}),
      deleteAll: jest.fn(async () => {}),
    };
    const useCase = new MarkSmartHealthRecordDone(repository);
    await useCase.execute(
      deworm({ status: 'completed', completedDate: '2026-04-01' }),
      '2026-04-01',
      '2020-01-01',
    );

    expect(repository.listByPet).not.toHaveBeenCalled();
    expect(repository.updateOne).not.toHaveBeenCalled();
  });
});
