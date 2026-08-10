import type { CareInterest } from '../../../settings/domain/models/Settings';

import type {
  OnboardingDraft,
  OnboardingGoal,
  OnboardingPhase,
  OnboardingProblem,
  PetDraft,
} from './OnboardingDraft';
import { QUIZ_STEP_COUNT } from './OnboardingDraft';

export const createDefaultOnboardingDraft = (): OnboardingDraft => ({
  step: 0,
  problems: [],
  petDraft: null,
  goal: null,
  careInterests: [],
  commitmentAccepted: false,
  committedAt: null,
  phase: 'quiz',
  skippedPaywall: false,
  paywallOutcome: null,
});

export const advanceStep = (draft: OnboardingDraft): OnboardingDraft => ({
  ...draft,
  step: Math.min(draft.step + 1, QUIZ_STEP_COUNT - 1),
});

export const setProblems = (
  draft: OnboardingDraft,
  problems: OnboardingProblem[],
): OnboardingDraft => ({
  ...draft,
  problems: [...problems],
});

export const setPetDraft = (
  draft: OnboardingDraft,
  petDraft: PetDraft,
): OnboardingDraft => ({
  ...draft,
  petDraft: { ...petDraft },
});

export const setGoal = (
  draft: OnboardingDraft,
  goal: OnboardingGoal,
): OnboardingDraft => ({
  ...draft,
  goal,
});

export const setCareInterests = (
  draft: OnboardingDraft,
  careInterests: CareInterest[],
): OnboardingDraft => ({
  ...draft,
  careInterests: [...careInterests],
});

export const acceptCommitment = (
  draft: OnboardingDraft,
  committedAt: string = new Date().toISOString(),
): OnboardingDraft => ({
  ...draft,
  commitmentAccepted: true,
  committedAt: draft.committedAt ?? committedAt,
});

export const setPhase = (
  draft: OnboardingDraft,
  phase: OnboardingPhase,
): OnboardingDraft => ({
  ...draft,
  phase,
});
