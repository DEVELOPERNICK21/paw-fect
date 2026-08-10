import type { CareInterest } from '../../../settings/domain/models/Settings';

import type { OnboardingProblem } from './OnboardingDraft';

const PROBLEM_VALIDATION: Record<OnboardingProblem, string> = {
  missed_vaccines:
    "That's one of the most common challenges pet parents tell us about.",
  no_records:
    "You're not alone — keeping records straight is a frequent struggle.",
  chaotic_routine:
    "That's common — a lot of pet parents feel pulled in too many directions.",
  vet_bill_surprises:
    "You're not alone — unexpected vet costs catch many families off guard.",
};

const CARE_VALIDATION: Record<CareInterest, string> = {
  vaccines:
    'Good choice — vaccines are one of the biggest factors in long-term pet health.',
  walks:
    'Good choice — daily walks are one of the biggest factors in long-term pet health.',
  meds: 'Good choice — medicine routines are one of the biggest factors in long-term pet health.',
  grooming:
    'Good choice — grooming habits are one of the biggest factors in long-term pet health.',
};

/** Returns affirmation copy for the primary selected problem, if any. */
export function validationCopyForProblems(
  selected: OnboardingProblem[],
): string | null {
  if (selected.length === 0) {
    return null;
  }
  const primary = selected[selected.length - 1];
  return PROBLEM_VALIDATION[primary] ?? null;
}

/** Returns affirmation copy for the primary selected care interest, if any. */
export function validationCopyForCareInterests(
  selected: CareInterest[],
): string | null {
  if (selected.length === 0) {
    return null;
  }
  const primary = selected[selected.length - 1];
  return CARE_VALIDATION[primary] ?? null;
}

export function validationVariantIdForProblems(
  selected: OnboardingProblem[],
): string | null {
  if (selected.length === 0) {
    return null;
  }
  return selected[selected.length - 1];
}

export function validationVariantIdForCareInterests(
  selected: CareInterest[],
): string | null {
  if (selected.length === 0) {
    return null;
  }
  return selected[selected.length - 1];
}
