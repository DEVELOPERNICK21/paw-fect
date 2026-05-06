import {
  resolvePrerequisiteCompletedDate,
  validateVaccinationLogDate,
} from '../vaccinationLogValidation';
import type { SmartHealthRecord } from '../../models/SmartHealthRecord';

const baseRecord = (overrides: Partial<SmartHealthRecord>): SmartHealthRecord =>
  ({
    id: 'r1',
    userId: 'u',
    petId: 'p',
    type: 'vaccination',
    name: 'Test',
    dueDate: '2026-06-01',
    completedDate: null,
    status: 'upcoming',
    recurrenceType: 'none',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }) as SmartHealthRecord;

describe('vaccinationLogValidation', () => {
  describe('resolvePrerequisiteCompletedDate', () => {
    it('returns undefined when no dependsOn', () => {
      expect(resolvePrerequisiteCompletedDate([], undefined)).toBeUndefined();
    });

    it('returns prior completedDate when prior is completed', () => {
      const records = [
        baseRecord({
          id: 'prev',
          status: 'completed',
          completedDate: '2026-04-15',
        }),
        baseRecord({ id: 'next', dependsOn: 'prev' }),
      ];
      expect(resolvePrerequisiteCompletedDate(records, 'prev')).toBe(
        '2026-04-15',
      );
    });

    it('returns undefined when prior not completed', () => {
      const records = [
        baseRecord({ id: 'prev', status: 'upcoming', completedDate: null }),
        baseRecord({ id: 'next', dependsOn: 'prev' }),
      ];
      expect(resolvePrerequisiteCompletedDate(records, 'prev')).toBeUndefined();
    });
  });

  describe('validateVaccinationLogDate', () => {
    it('rejects future date', () => {
      const r = validateVaccinationLogDate({
        petDateOfBirth: '2024-01-01',
        today: '2026-05-01',
        selectedDate: '2026-06-01',
        dueDate: '2026-05-01',
      });
      expect(r.ok).toBe(false);
    });

    it('rejects before due date', () => {
      const r = validateVaccinationLogDate({
        petDateOfBirth: '2024-01-01',
        today: '2026-05-10',
        selectedDate: '2026-05-01',
        dueDate: '2026-05-05',
      });
      expect(r.ok).toBe(false);
    });

    it('accepts on due date', () => {
      const r = validateVaccinationLogDate({
        petDateOfBirth: '2024-01-01',
        today: '2026-05-10',
        selectedDate: '2026-05-05',
        dueDate: '2026-05-05',
      });
      expect(r.ok).toBe(true);
    });

    it('rejects before prerequisite completion', () => {
      const r = validateVaccinationLogDate({
        petDateOfBirth: '2024-01-01',
        today: '2026-05-10',
        selectedDate: '2026-05-01',
        dueDate: '2026-05-01',
        prerequisiteCompletedDate: '2026-05-05',
      });
      expect(r.ok).toBe(false);
    });

    it('accepts after prerequisite completion on or after due', () => {
      const r = validateVaccinationLogDate({
        petDateOfBirth: '2024-01-01',
        today: '2026-05-10',
        selectedDate: '2026-05-08',
        dueDate: '2026-05-05',
        prerequisiteCompletedDate: '2026-04-10',
      });
      expect(r.ok).toBe(true);
    });

    it('VS-05: three-dose chain — dose 3 requires dose 2 completion date', () => {
      const failBeforeDose2 = validateVaccinationLogDate({
        petDateOfBirth: '2024-01-01',
        today: '2026-06-20',
        selectedDate: '2026-06-12',
        dueDate: '2026-06-10',
        prerequisiteCompletedDate: '2026-06-14',
      });
      expect(failBeforeDose2.ok).toBe(false);

      const okAfterDose2 = validateVaccinationLogDate({
        petDateOfBirth: '2024-01-01',
        today: '2026-06-20',
        selectedDate: '2026-06-16',
        dueDate: '2026-06-10',
        prerequisiteCompletedDate: '2026-06-14',
      });
      expect(okAfterDose2.ok).toBe(true);
    });

    describe('series window tiers (one-sided)', () => {
      it('returns tier=ideal exactly on due date', () => {
        const r = validateVaccinationLogDate({
          petDateOfBirth: '2024-01-01',
          today: '2026-05-10',
          selectedDate: '2026-05-05',
          dueDate: '2026-05-05',
        });
        expect(r).toEqual({ ok: true, tier: 'ideal' });
      });

      it('returns tier=acceptable inside the +1..+14 day window', () => {
        const r = validateVaccinationLogDate({
          petDateOfBirth: '2024-01-01',
          today: '2026-05-30',
          selectedDate: '2026-05-19',
          dueDate: '2026-05-05',
        });
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.tier).toBe('acceptable');
      });

      it('returns tier=warn with a warning in the +15..+21 day window', () => {
        const r = validateVaccinationLogDate({
          petDateOfBirth: '2024-01-01',
          today: '2026-05-30',
          selectedDate: '2026-05-26',
          dueDate: '2026-05-05',
        });
        expect(r.ok).toBe(true);
        if (r.ok) {
          expect(r.tier).toBe('warn');
          expect(r.warning).toMatch(/vet/i);
        }
      });

      it('rejects beyond +21 days late (series may need reassessment)', () => {
        const r = validateVaccinationLogDate({
          petDateOfBirth: '2024-01-01',
          today: '2026-06-10',
          selectedDate: '2026-05-28',
          dueDate: '2026-05-05',
        });
        expect(r.ok).toBe(false);
      });
    });

    describe('annual booster window (symmetric ±30 days)', () => {
      it('returns tier=ideal within ±7 days', () => {
        const r = validateVaccinationLogDate({
          petDateOfBirth: '2020-01-01',
          today: '2026-06-10',
          selectedDate: '2026-06-04',
          dueDate: '2026-06-01',
          isAnnualBooster: true,
        });
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.tier).toBe('ideal');
      });

      it('returns tier=acceptable in the ±14 day band', () => {
        const r = validateVaccinationLogDate({
          petDateOfBirth: '2020-01-01',
          today: '2026-06-20',
          selectedDate: '2026-06-13',
          dueDate: '2026-06-01',
          isAnnualBooster: true,
        });
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.tier).toBe('acceptable');
      });

      it('returns tier=warn with warning in the ±30 day band', () => {
        const earlyWarn = validateVaccinationLogDate({
          petDateOfBirth: '2020-01-01',
          today: '2026-06-20',
          selectedDate: '2026-05-12',
          dueDate: '2026-06-01',
          isAnnualBooster: true,
        });
        expect(earlyWarn.ok).toBe(true);
        if (earlyWarn.ok) {
          expect(earlyWarn.tier).toBe('warn');
          expect(earlyWarn.warning).toMatch(/before/i);
        }

        const lateWarn = validateVaccinationLogDate({
          petDateOfBirth: '2020-01-01',
          today: '2026-07-15',
          selectedDate: '2026-06-22',
          dueDate: '2026-06-01',
          isAnnualBooster: true,
        });
        expect(lateWarn.ok).toBe(true);
        if (lateWarn.ok) expect(lateWarn.tier).toBe('warn');
      });

      it('rejects beyond ±30 days from due date', () => {
        const r = validateVaccinationLogDate({
          petDateOfBirth: '2020-01-01',
          today: '2026-08-15',
          selectedDate: '2026-08-01',
          dueDate: '2026-06-01',
          isAnnualBooster: true,
        });
        expect(r.ok).toBe(false);
      });

      it('still rejects future dates and pre-DOB even for boosters', () => {
        const future = validateVaccinationLogDate({
          petDateOfBirth: '2020-01-01',
          today: '2026-06-01',
          selectedDate: '2026-06-15',
          dueDate: '2026-06-10',
          isAnnualBooster: true,
        });
        expect(future.ok).toBe(false);

        const beforeDob = validateVaccinationLogDate({
          petDateOfBirth: '2024-01-01',
          today: '2026-06-15',
          selectedDate: '2023-06-10',
          dueDate: '2023-06-10',
          isAnnualBooster: true,
        });
        expect(beforeDob.ok).toBe(false);
      });
    });
  });
});
