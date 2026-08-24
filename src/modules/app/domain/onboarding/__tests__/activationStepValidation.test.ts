import {
  formatActivationReminderSummary,
  isFirstReminderStepValid,
  isPetBasicsStepValid,
} from '../activationStepValidation';
import type { PetDraft, ReminderDraft } from '../OnboardingDraft';

describe('activationStepValidation', () => {
  describe('isPetBasicsStepValid', () => {
    const basePet: PetDraft = {
      species: 'dog',
      ageBand: 'adult',
      nickname: 'Milo',
    };

    it('accepts dog or cat with a trimmed nickname', () => {
      expect(isPetBasicsStepValid(basePet)).toBe(true);
      expect(isPetBasicsStepValid({ ...basePet, species: 'cat' })).toBe(true);
    });

    it('rejects empty nickname', () => {
      expect(isPetBasicsStepValid({ ...basePet, nickname: '   ' })).toBe(false);
    });

    it('rejects both species on activation path', () => {
      expect(isPetBasicsStepValid({ ...basePet, species: 'both' })).toBe(false);
    });
  });

  describe('isFirstReminderStepValid', () => {
    const reminder: ReminderDraft = {
      kind: 'walk',
      title: "Milo's walk",
      date: '2026-08-24',
      time: '08:00',
      repeat: 'daily',
      reminderType: 'other',
    };

    it('accepts a complete reminder draft', () => {
      expect(isFirstReminderStepValid(reminder)).toBe(true);
    });

    it('rejects null or incomplete reminder draft', () => {
      expect(isFirstReminderStepValid(null)).toBe(false);
      expect(
        isFirstReminderStepValid({ ...reminder, title: '   ' }),
      ).toBe(false);
    });
  });

  describe('formatActivationReminderSummary', () => {
    it('formats date and time for display', () => {
      const summary = formatActivationReminderSummary({
        kind: 'walk',
        title: "Milo's walk",
        date: '2026-08-24',
        time: '08:00',
        repeat: 'daily',
        reminderType: 'other',
      });

      expect(summary).toMatch(/Aug/);
      expect(summary).toMatch(/24/);
      expect(summary).toMatch(/8:00/);
      expect(summary).toMatch(/at/i);
    });
  });
});
