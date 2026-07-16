import type { CareInterest } from '../../../settings/domain/models/Settings';

export type OnboardingProblem =
  | 'missed_vaccines'
  | 'no_records'
  | 'chaotic_routine'
  | 'vet_bill_surprises';

export type OnboardingGoal =
  | 'never_miss_care'
  | 'health_history'
  | 'multi_pet_calm';

export type PetDraft = {
  species: 'dog' | 'cat' | 'both';
  ageBand: 'puppy_kitten' | 'adult' | 'senior';
  nickname: string;
};

export type OnboardingPhase = 'quiz' | 'paywall' | 'tips' | 'done';

/** Quiz UI steps 0..7 (trust → commitment). Auth/paywall/tips are phases. */
export const QUIZ_STEP_COUNT = 8;

export type OnboardingDraft = {
  step: number;
  problems: OnboardingProblem[];
  petDraft: PetDraft | null;
  goal: OnboardingGoal | null;
  careInterests: CareInterest[];
  commitmentAccepted: boolean;
  phase: OnboardingPhase;
  skippedPaywall: boolean;
};
