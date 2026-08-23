import { createDefaultOnboardingDraft } from '../onboardingDraftReducers';
import { buildOnboardingProfile } from '../buildOnboardingProfile';
import { ONBOARDING_QUIZ_VERSION } from '../OnboardingProfile';

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
    expect(profile.committedAt).toBe('2026-08-10T11:00:00.000Z');
    expect(profile.paywallOutcome).toBe('skipped');
    expect(profile.completedAt).toBe('2026-08-10T11:00:00.000Z');
    expect(profile.quizVersion).toBe(ONBOARDING_QUIZ_VERSION);
    expect(profile.quizVersion).toBe('activation_v1_2026-08');
  });

  it('allows empty problems and goal on activation path', () => {
    const draft = {
      ...createDefaultOnboardingDraft(),
      petDraft: {
        species: 'cat' as const,
        ageBand: 'adult' as const,
        nickname: 'Milo',
      },
      problems: [],
      goal: null,
      skippedPaywall: true,
      paywallOutcome: 'skipped' as const,
    };

    const profile = buildOnboardingProfile(draft, '2026-08-10T12:00:00.000Z');

    expect(profile.problems).toEqual([]);
    expect(profile.goal).toBeNull();
    expect(profile.pet.nickname).toBe('Milo');
    expect(profile.committedAt).toBe('2026-08-10T12:00:00.000Z');
  });

  it('falls back pet defaults when petDraft is null', () => {
    const profile = buildOnboardingProfile(createDefaultOnboardingDraft());
    expect(profile.pet.species).toBe('dog');
    expect(profile.pet.nickname).toBe('');
  });
});
