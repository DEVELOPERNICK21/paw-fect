import type { OnboardingDraft } from './OnboardingDraft';
import type {
  OnboardingProfile,
  PaywallOutcome,
} from './OnboardingProfile';
import { ONBOARDING_QUIZ_VERSION } from './OnboardingProfile';

const DEFAULT_PET: OnboardingProfile['pet'] = {
  species: 'dog',
  ageBand: 'adult',
  nickname: '',
};

export function resolvePaywallOutcome(
  draft: OnboardingDraft,
): PaywallOutcome {
  if (draft.paywallOutcome) {
    return draft.paywallOutcome;
  }
  if (draft.skippedPaywall) {
    return 'skipped';
  }
  return 'purchased';
}

export function buildOnboardingProfile(
  draft: OnboardingDraft,
  nowIso: string = new Date().toISOString(),
): OnboardingProfile {
  return {
    problems: [...draft.problems],
    pet: draft.petDraft ? { ...draft.petDraft } : { ...DEFAULT_PET },
    goal: draft.goal,
    careInterests: [...draft.careInterests],
    committedAt: nowIso,
    paywallOutcome: resolvePaywallOutcome(draft),
    completedAt: nowIso,
    quizVersion: ONBOARDING_QUIZ_VERSION,
  };
}
