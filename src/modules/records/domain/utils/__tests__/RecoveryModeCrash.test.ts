import {
  detectRecoveryMode,
  calculatePostRecoverySchedule,
} from '../recoveryMode';
import { createNextRecurringRecord } from '../SmartHealthScheduleUtils';
import { validateLogDateForCadence } from '../DewormingEngine';

describe('RecoveryMode and Health Utils Crash Prevention', () => {
  it('does not throw RangeError when todayDate is malformed in detectRecoveryMode', () => {
    expect(() => {
      detectRecoveryMode(
        [
          {
            id: 'd1',
            petId: 'p1',
            dueDate: '2025-01-01',
            phaseType: 'MONTHLY',
            sequenceNumber: 1,
            generatedAt: '2025-01-01',
            sourcePetDob: '2020-01-01',
          },
          {
            id: 'd2',
            petId: 'p1',
            dueDate: '2025-02-01',
            phaseType: 'MONTHLY',
            sequenceNumber: 2,
            generatedAt: '2025-01-01',
            sourcePetDob: '2020-01-01',
          },
        ],
        'malformed-date',
        '2020-01-01',
      );
    }).not.toThrow(RangeError);
  });

  it('does not throw RangeError when recoveryDate is malformed in calculatePostRecoverySchedule', () => {
    expect(() => {
      calculatePostRecoverySchedule('invalid-date', '2020-01-01', 3);
    }).not.toThrow(RangeError);
  });

  it('does not throw RangeError when completedDate is malformed in createNextRecurringRecord', () => {
    expect(() => {
      createNextRecurringRecord(
        {
          id: 'rec-1',
          userId: 'u1',
          petId: 'p1',
          type: 'deworming',
          key: 'DEWORM',
          family: 'Deworming',
          name: 'Deworming',
          dueDate: '2025-01-01',
          completedDate: null,
          status: 'upcoming',
          recurrenceType: 'quarterly',
          cadence: 'monthly',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        'malformed-date',
      );
    }).not.toThrow(RangeError);
  });

  it('does not throw RangeError when dates are malformed in validateLogDateForCadence', () => {
    expect(() => {
      validateLogDateForCadence(
        'invalid-dob',
        '2025-01-01',
        '2025-01-01',
        'monthly',
      );
    }).not.toThrow(RangeError);
  });
});
