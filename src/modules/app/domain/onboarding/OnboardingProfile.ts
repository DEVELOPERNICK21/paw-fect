import type { CareInterest } from '../../../settings/domain/models/Settings';

import type {
  OnboardingGoal,
  OnboardingProblem,
  PetDraft,
} from './OnboardingDraft';

export const ONBOARDING_QUIZ_VERSION = 'psychology_v1_2026-07';

export type PaywallOutcome =
  | 'purchased'
  | 'skipped'
  | 'entitled_auto_skip';

export type OnboardingProfile = {
  problems: OnboardingProblem[];
  pet: PetDraft;
  goal: OnboardingGoal | null;
  careInterests: CareInterest[];
  committedAt: string;
  paywallOutcome: PaywallOutcome;
  completedAt: string;
  quizVersion: string;
};
