import type { CareInterest } from '../../../settings/domain/models/Settings';

import type {
  OnboardingDraft,
  OnboardingGoal,
  OnboardingProblem,
} from './OnboardingDraft';

export type CarePlanSummary = {
  title: string;
  bullets: string[];
  tip: string;
  paywallHeadline: string;
};

const PROBLEM_FOCUS_LINES: Record<OnboardingProblem, string> = {
  missed_vaccines:
    'Stay on top of vaccination dates without juggling clinic papers.',
  no_records:
    'Keep vet visits and notes in one place, easy to find when you need them.',
  chaotic_routine:
    'Build a gentle daily rhythm for meals, walks, and rest.',
  vet_bill_surprises:
    'Plan routine check-ups ahead so costs feel predictable.',
};

const GOAL_OUTCOME_LINES: Record<OnboardingGoal, string> = {
  never_miss_care:
    'Gentle reminders help you show up on time for what matters.',
  health_history:
    'A clear care timeline grows as you log each visit and milestone.',
  multi_pet_calm: 'One calm view for every pet in your home.',
};

const CARE_INTEREST_REMINDER_LINES: Record<CareInterest, string> = {
  vaccines:
    'Vaccination reminders aligned with common Indian clinic schedules.',
  walks: 'Walk reminders that fit morning and evening routines.',
  meds: 'Medicine reminders with clear daily slots.',
  grooming: 'Grooming nudges for baths, brushes, and seasonal care.',
};

const DEFAULT_TIP =
  'Small, steady steps beat perfect routines — start with one reminder and build from there.';

const getPetLabel = (draft: OnboardingDraft): string => {
  const nickname = draft.petDraft?.nickname?.trim();
  return nickname && nickname.length > 0 ? nickname : 'your pet';
};

const getPossessiveLabel = (draft: OnboardingDraft): string => {
  const nickname = draft.petDraft?.nickname?.trim();
  return nickname && nickname.length > 0 ? `${nickname}'s` : "your pet's";
};

export const buildCarePlanSummary = (
  draft: OnboardingDraft,
): CarePlanSummary => {
  const petLabel = getPetLabel(draft);
  const possessiveLabel = getPossessiveLabel(draft);

  const bullets: string[] = [];

  for (const problem of draft.problems) {
    bullets.push(PROBLEM_FOCUS_LINES[problem]);
  }

  if (draft.goal) {
    bullets.push(GOAL_OUTCOME_LINES[draft.goal]);
  }

  for (const interest of draft.careInterests) {
    bullets.push(CARE_INTEREST_REMINDER_LINES[interest]);
  }

  if (bullets.length === 0) {
    bullets.push(
      'A simple starting plan for daily care, ready when you are.',
    );
  }

  return {
    title: `${possessiveLabel} personalised care plan`,
    bullets,
    tip: DEFAULT_TIP,
    paywallHeadline: `Keep ${petLabel}'s care plan on track`,
  };
};
