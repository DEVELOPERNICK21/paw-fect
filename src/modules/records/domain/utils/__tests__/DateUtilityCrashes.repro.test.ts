import { dewormingEngine } from '../DewormingEngine';
import { generateDewormingTimeline } from '../DewormingTimelineEngine';
import { createNextRecurringRecord } from '../SmartHealthScheduleUtils';
import { SmartHealthRecord } from '../../models/SmartHealthRecord';

describe('Date Utility Crashes Reproduction', () => {
  describe('DewormingEngine', () => {
    it('does NOT crash with malformed date in execute', () => {
      expect(() => {
        dewormingEngine.execute({
          petType: 'dog',
          dateOfBirth: 'garbage',
          lifestyle: 'indoor',
          todayDate: '2024-01-01',
        });
      }).not.toThrow(RangeError);
    });
  });

  describe('DewormingTimelineEngine', () => {
    it('does NOT crash with malformed dateOfBirth in generateDewormingTimeline', () => {
      expect(() => {
        generateDewormingTimeline(
          { id: '1', dateOfBirth: 'invalid', onboardingDate: '2024-01-01' },
          [],
          '2024-01-01'
        );
      }).not.toThrow(RangeError);
    });
  });

  describe('SmartHealthScheduleUtils', () => {
    it('does NOT crash with malformed completedDate in createNextRecurringRecord', () => {
      const mockRecord: Partial<SmartHealthRecord> = {
        userId: 'u1',
        petId: 'p1',
        type: 'vaccination',
        recurrenceType: 'yearly',
        status: 'completed',
        dueDate: '2024-01-01',
        family: 'DHPP',
        category: 'core',
        name: 'DHPP',
      };

      expect(() => {
        createNextRecurringRecord(mockRecord as SmartHealthRecord, 'not-a-date');
      }).not.toThrow(RangeError);
    });
  });
});
