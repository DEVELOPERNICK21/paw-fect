import {
  advanceStep,
  createDefaultOnboardingDraft,
  setProblems,
  acceptCommitment,
  setPhase,
} from '../onboardingDraftReducers';

describe('onboardingDraftReducers', () => {
  it('starts at step 0 quiz phase', () => {
    const d = createDefaultOnboardingDraft();
    expect(d.step).toBe(0);
    expect(d.phase).toBe('quiz');
    expect(d.commitmentAccepted).toBe(false);
  });

  it('advanceStep increments within quiz bounds', () => {
    const d = advanceStep(createDefaultOnboardingDraft());
    expect(d.step).toBe(1);
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
});
