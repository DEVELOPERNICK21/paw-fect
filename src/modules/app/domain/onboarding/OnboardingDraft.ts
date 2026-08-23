import type { CareInterest } from '../../../settings/domain/models/Settings';

import type { PaywallOutcome } from './OnboardingProfile';

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

export type ActivationReminderKind =
  | 'walk'
  | 'vaccination'
  | 'medication'
  | 'checkup';

export type ReminderDraft = {
  kind: ActivationReminderKind;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  repeat: 'once' | 'daily' | 'yearly';
  reminderType: 'vaccination' | 'medication' | 'checkup' | 'other';
};

export type OnboardingPhase =
  | 'welcome'
  | 'activate'
  | 'persist'
  | 'paywall'
  | 'done';

export type OnboardingEntryIntent = 'activate' | 'sign_in' | null;

/** Legacy quiz phases — detected by normalizeOnboardingDraft for reset. */
export type LegacyOnboardingPhase = 'quiz' | 'tips';

/** Activation UI steps 0..1 (pet, reminder). Gates follow activate. */
export const ACTIVATION_STEP_COUNT = 2;

/** @deprecated Legacy quiz funnel step count; retained for in-flight UI until removed. */
export const QUIZ_STEP_COUNT = 8;

export type OnboardingDraft = {
  step: number;
  petDraft: PetDraft | null;
  reminderDraft: ReminderDraft | null;
  createdPetId: string | null;
  phase: OnboardingPhase;
  /** Welcome path: new activation vs returning sign-in. */
  entryIntent: OnboardingEntryIntent;
  skippedPaywall: boolean;
  paywallOutcome: PaywallOutcome | null;
  /** Legacy optional — left empty on activation path. */
  problems: OnboardingProblem[];
  goal: OnboardingGoal | null;
  careInterests: CareInterest[];
  commitmentAccepted: boolean;
  /** ISO timestamp set when the commitment pledge is accepted. */
  committedAt: string | null;
};

export type OnboardingDraftInput = Partial<OnboardingDraft> & {
  phase?: OnboardingPhase | LegacyOnboardingPhase;
};
