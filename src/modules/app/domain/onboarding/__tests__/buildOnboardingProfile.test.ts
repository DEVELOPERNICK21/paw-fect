import { createDefaultOnboardingDraft } from '../onboardingDraftReducers';
import { buildOnboardingProfile } from '../buildOnboardingProfile';

describe('buildOnboardingProfile', () => {
  it('persists quiz answers and paywall outcome', () => {
    const draft = {
      ...createDefaultOnboardingDraft(),
      problems: ['missed_vaccines' as const],
      petDraft: {
        species: 'dog' as const,
        ageBand: 'adult' as const,
        nickname: 'Luna',
      },
      goal: 'never_miss_care' as const,
      careInterests: ['vaccines' as const],
      commitmentAccepted: true,
      committedAt: '2026-08-10T10:00:00.000Z',
      skippedPaywall: true,
      paywallOutcome: 'skipped' as const,
    };

    const profile = buildOnboardingProfile(draft, '2026-08-10T11:00:00.000Z');

    expect(profile.problems).toEqual(['missed_vaccines']);
    expect(profile.pet.nickname).toBe('Luna');
    expect(profile.goal).toBe('never_miss_care');
    expect(profile.careInterests).toEqual(['vaccines']);
    expect(profile.committedAt).toBe('2026-08-10T10:00:00.000Z');
    expect(profile.paywallOutcome).toBe('skipped');
    expect(profile.completedAt).toBe('2026-08-10T11:00:00.000Z');
    expect(profile.quizVersion).toContain('psychology');
  });

  it('falls back pet defaults when petDraft is null', () => {
    const profile = buildOnboardingProfile(createDefaultOnboardingDraft());
    expect(profile.pet.species).toBe('dog');
    expect(profile.pet.nickname).toBe('');
  });
});
