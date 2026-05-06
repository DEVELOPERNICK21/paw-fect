import {
  assertDateNotBeforePetDob,
  toIsoDateOnly,
} from '../healthRecordDateGuards';

describe('healthRecordDateGuards', () => {
  describe('toIsoDateOnly', () => {
    it('truncates ISO datetime to date', () => {
      expect(toIsoDateOnly('2026-05-01T12:00:00Z')).toBe('2026-05-01');
    });
  });

  describe('assertDateNotBeforePetDob', () => {
    it('throws when event is strictly before DOB', () => {
      expect(() =>
        assertDateNotBeforePetDob('2024-01-01', '2025-06-01', 'Due date'),
      ).toThrow(/cannot be before the pet's date of birth/);
    });

    it('allows event on DOB', () => {
      expect(() =>
        assertDateNotBeforePetDob('2025-06-01', '2025-06-01', 'Due date'),
      ).not.toThrow();
    });

    it('allows event after DOB', () => {
      expect(() =>
        assertDateNotBeforePetDob('2026-01-01', '2025-06-01', 'Due date'),
      ).not.toThrow();
    });

    it('skips when DOB missing', () => {
      expect(() =>
        assertDateNotBeforePetDob('2020-01-01', undefined, 'Due date'),
      ).not.toThrow();
    });

    it('INT-03: compares date-only — DOB as UTC midnight does not reject same local calendar log date', () => {
      expect(() =>
        assertDateNotBeforePetDob(
          '2024-03-01',
          '2024-03-01T00:00:00.000Z',
          'Completion date',
        ),
      ).not.toThrow();
    });
  });
});
