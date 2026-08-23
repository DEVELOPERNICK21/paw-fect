import {
  advanceStep,
  createDefaultOnboardingDraft,
  setProblems,
  acceptCommitment,
  setPhase,
  setReminderDraft,
  setCreatedPetId,
} from '../onboardingDraftReducers';
import type { ReminderDraft } from '../OnboardingDraft';
import { ACTIVATION_STEP_COUNT } from '../OnboardingDraft';

describe('onboardingDraftReducers', () => {
  it('starts at step 0 welcome phase with empty activation fields', () => {
    const d = createDefaultOnboardingDraft();
    expect(d.step).toBe(0);
    expect(d.phase).toBe('welcome');
    expect(d.commitmentAccepted).toBe(false);
    expect(d.reminderDraft).toBeNull();
    expect(d.createdPetId).toBeNull();
    expect(d.problems).toEqual([]);
    expect(d.careInterests).toEqual([]);
  });

  it('advanceStep increments within activation bounds', () => {
    const d = advanceStep(createDefaultOnboardingDraft());
    expect(d.step).toBe(1);
    const capped = advanceStep({ ...d, step: ACTIVATION_STEP_COUNT - 1 });
    expect(capped.step).toBe(ACTIVATION_STEP_COUNT - 1);
  });

  it('setProblems replaces problems array immutably', () => {
    const base = createDefaultOnboardingDraft();
    const next = setProblems(base, ['missed_vaccines', 'no_records']);
    expect(next.problems).toEqual(['missed_vaccines', 'no_records']);
    expect(base.problems).toEqual([]);
  });

  it('acceptCommitment sets flag', () => {
    expect(acceptCommitment(createDefaultOnboardingDraft()).commitmentAccepted).toBe(
      true,
    );
  });

  it('setPhase updates phase', () => {
    expect(setPhase(createDefaultOnboardingDraft(), 'paywall').phase).toBe(
      'paywall',
    );
  });

  it('setReminderDraft stores reminder immutably', () => {
    const reminderDraft: ReminderDraft = {
      kind: 'walk',
      title: "Milo's walk",
      date: '2026-08-24',
      time: '08:00',
      repeat: 'daily',
      reminderType: 'other',
    };
    const base = createDefaultOnboardingDraft();
    const next = setReminderDraft(base, reminderDraft);
    expect(next.reminderDraft).toEqual(reminderDraft);
    expect(base.reminderDraft).toBeNull();
  });

  it('setCreatedPetId stores pet id', () => {
    const next = setCreatedPetId(createDefaultOnboardingDraft(), 'pet-42');
    expect(next.createdPetId).toBe('pet-42');
  });
});
