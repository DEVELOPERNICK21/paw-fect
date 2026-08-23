import { createDefaultOnboardingDraft } from '../onboardingDraftReducers';
import {
  isLegacyQuizDraft,
  normalizeOnboardingDraft,
} from '../normalizeOnboardingDraft';
import type { ReminderDraft } from '../OnboardingDraft';

describe('isLegacyQuizDraft', () => {
  it('detects quiz phase', () => {
    expect(isLegacyQuizDraft({ phase: 'quiz' as never })).toBe(true);
  });

  it('detects tips phase', () => {
    expect(isLegacyQuizDraft({ phase: 'tips' as never })).toBe(true);
  });

  it('detects in-progress quiz with problems and no reminder draft', () => {
    expect(
      isLegacyQuizDraft({
        phase: 'activate',
        problems: ['missed_vaccines'],
        reminderDraft: null,
      }),
    ).toBe(true);
  });

  it('detects commitment accepted outside paywall/done/persist', () => {
    expect(
      isLegacyQuizDraft({
        phase: 'activate',
        commitmentAccepted: true,
      }),
    ).toBe(true);
  });

  it('does not flag activation draft with reminder', () => {
    const reminderDraft: ReminderDraft = {
      kind: 'walk',
      title: "Milo's walk",
      date: '2026-08-24',
      time: '08:00',
      repeat: 'daily',
      reminderType: 'other',
    };
    expect(
      isLegacyQuizDraft({
        phase: 'activate',
        step: 1,
        reminderDraft,
        problems: [],
        commitmentAccepted: false,
      }),
    ).toBe(false);
  });

  it('does not flag persist phase with commitment', () => {
    expect(
      isLegacyQuizDraft({
        phase: 'persist',
        commitmentAccepted: true,
      }),
    ).toBe(false);
  });
});

describe('normalizeOnboardingDraft', () => {
  it('returns default welcome draft when raw is null', () => {
    expect(normalizeOnboardingDraft(null)).toEqual(createDefaultOnboardingDraft());
  });

  it('resets legacy quiz draft to welcome defaults', () => {
    const normalized = normalizeOnboardingDraft({
      phase: 'quiz' as never,
      step: 5,
      problems: ['missed_vaccines'],
      commitmentAccepted: true,
      petDraft: {
        species: 'dog',
        ageBand: 'adult',
        nickname: 'Milo',
      },
    });
    expect(normalized).toEqual(createDefaultOnboardingDraft());
  });

  it('merges valid activation draft fields', () => {
    const reminderDraft: ReminderDraft = {
      kind: 'walk',
      title: "Milo's walk",
      date: '2026-08-24',
      time: '08:00',
      repeat: 'daily',
      reminderType: 'other',
    };
    const normalized = normalizeOnboardingDraft({
      phase: 'activate',
      step: 1,
      petDraft: {
        species: 'dog',
        ageBand: 'adult',
        nickname: 'Milo',
      },
      reminderDraft,
      createdPetId: 'pet-123',
    });
    expect(normalized.phase).toBe('activate');
    expect(normalized.step).toBe(1);
    expect(normalized.petDraft?.nickname).toBe('Milo');
    expect(normalized.reminderDraft).toEqual(reminderDraft);
    expect(normalized.createdPetId).toBe('pet-123');
    expect(normalized.problems).toEqual([]);
    expect(normalized.careInterests).toEqual([]);
    expect(normalized.entryIntent).toBeNull();
  });

  it('preserves entryIntent when present', () => {
    const normalized = normalizeOnboardingDraft({
      phase: 'welcome',
      entryIntent: 'sign_in',
    });
    expect(normalized.entryIntent).toBe('sign_in');
  });

  it('rejects invalid entryIntent values', () => {
    expect(
      normalizeOnboardingDraft({
        phase: 'welcome',
        entryIntent: 'garbage' as never,
      }).entryIntent,
    ).toBeNull();
  });
});
