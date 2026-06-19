import { createNextRecurringRecord } from '../SmartHealthScheduleUtils';
import { SmartHealthRecord } from '../../models/SmartHealthRecord';

describe('SmartHealthScheduleUtils Crash Reproduction', () => {
  it('crashes when completing a record with a malformed date', () => {
    const record: SmartHealthRecord = {
      id: 'pet-1-deworming-1',
      userId: 'user-1',
      petId: 'pet-1',
      type: 'deworming',
      key: 'DEWORM_2024-01-01',
      family: 'Deworming',
      category: 'core',
      name: 'Deworming',
      dueDate: '2024-01-01',
      recommendedDate: '2024-01-01',
      completedDate: null,
      status: 'upcoming',
      recurrenceType: 'quarterly',
      cadence: 'every_3_months',
      source: 'system',
      isLocked: false,
      priority: 'high',
      recovery: { isRecovered: false, recoveredFrom: null },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    // This should NOT crash the process with RangeError: Invalid time value
    // But with malformed input it currently does.
    expect(() => {
      createNextRecurringRecord(record, 'malformed-date');
    }).not.toThrow(RangeError);
  });
});
