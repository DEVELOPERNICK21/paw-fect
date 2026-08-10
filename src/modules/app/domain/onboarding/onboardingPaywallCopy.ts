import type { CareInterest } from '../../../settings/domain/models/Settings';

import type {
  OnboardingGoal,
  OnboardingProblem,
  PetDraft,
} from './OnboardingDraft';
import type { OnboardingProfile } from './OnboardingProfile';

const SPECIES_LABEL: Record<PetDraft['species'], string> = {
  dog: 'dog',
  cat: 'cat',
  both: 'pets',
};

const CARE_TASK_FOR_PROBLEM: Partial<Record<OnboardingProblem, string>> = {
  missed_vaccines: 'vaccine dates',
  chaotic_routine: 'daily care',
  no_records: 'health history',
  vet_bill_surprises: 'vet prep',
};

const DEFAULT_LOSS_LINE =
  'Most pet parents who skip a plan lose momentum within the first two weeks.';

const SOCIAL_PROOF_QUALITATIVE =
  'Join pet parents who share your goals — stay consistent together.';

export type PlanFeatureId =
  | 'reminders'
  | 'records'
  | 'multi_pet'
  | 'history'
  | 'wellness';

const DEFAULT_FEATURE_ORDER: PlanFeatureId[] = [
  'reminders',
  'records',
  'history',
  'wellness',
  'multi_pet',
];

export const PLAN_FEATURE_COPY: Record<PlanFeatureId, string> = {
  reminders: 'Timely reminders for vaccines, walks, and meds',
  records: 'Health records in one place',
  multi_pet: 'Care for every pet in your home',
  history: 'Unlimited care history',
  wellness: 'Wellness score and Pro care tasks',
};

export function petDisplayName(
  pet: PetDraft | null | undefined,
): string | null {
  const nickname = pet?.nickname?.trim();
  if (nickname) {
    return nickname;
  }
  return null;
}

export function buildOnboardingLossLine(
  profile: Pick<OnboardingProfile, 'problems' | 'goal' | 'pet'> | null | undefined,
): string {
  if (!profile) {
    return DEFAULT_LOSS_LINE;
  }

  const species =
    SPECIES_LABEL[profile.pet.species] ?? 'pet';
  const problems = profile.problems;

  if (problems.includes('missed_vaccines')) {
    return `Without reminders, it's easy for vaccine dates to slip — especially with a ${species}.`;
  }
  if (problems.includes('chaotic_routine')) {
    return `Without a simple plan, daily care is easy to drop — especially with a ${species}.`;
  }
  if (problems.includes('no_records')) {
    return `Without a shared record, ${CARE_TASK_FOR_PROBLEM.no_records} gets scattered fast.`;
  }
  if (problems.includes('vet_bill_surprises')) {
    return `Without prep, vet-bill surprises hit harder — a plan keeps you ready.`;
  }

  if (profile.goal === 'never_miss_care') {
    return `Without reminders, the care you just planned for is easy to miss.`;
  }
  if (profile.goal === 'health_history') {
    return `Without a habit of logging, health history stays incomplete when you need it.`;
  }
  if (profile.goal === 'multi_pet_calm') {
    return `Without a shared plan, multi-pet care gets chaotic fast.`;
  }

  return DEFAULT_LOSS_LINE;
}

export function buildOnboardingSocialProofLine(): string {
  return SOCIAL_PROOF_QUALITATIVE;
}

export function orderPlanFeaturesForOnboarding(input: {
  goal: OnboardingGoal | null;
  careInterests: CareInterest[];
}): PlanFeatureId[] {
  const lead: PlanFeatureId[] = [];

  if (input.goal === 'never_miss_care' || input.careInterests.includes('vaccines') || input.careInterests.includes('meds') || input.careInterests.includes('walks')) {
    lead.push('reminders');
  }
  if (input.goal === 'health_history' || input.careInterests.includes('vaccines')) {
    lead.push('records');
    lead.push('history');
  }
  if (input.goal === 'multi_pet_calm') {
    lead.push('multi_pet');
  }
  if (input.careInterests.includes('grooming')) {
    lead.push('wellness');
  }

  const seen = new Set<PlanFeatureId>();
  const ordered: PlanFeatureId[] = [];
  for (const id of [...lead, ...DEFAULT_FEATURE_ORDER]) {
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    ordered.push(id);
  }
  return ordered;
}

export function buildOnboardingCtaLabel(
  nickname: string | null | undefined,
  planLabel: string,
  billing: 'monthly' | 'annual',
): string {
  const name = nickname?.trim();
  if (name) {
    return `Start ${name}'s ${planLabel} ${billing}`;
  }
  return `Start my plan · ${planLabel} ${billing}`;
}
