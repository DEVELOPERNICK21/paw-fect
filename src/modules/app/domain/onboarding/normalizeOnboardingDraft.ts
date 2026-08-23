import type {
  OnboardingDraft,
  OnboardingDraftInput,
  OnboardingEntryIntent,
  OnboardingPhase,
  LegacyOnboardingPhase,
} from './OnboardingDraft';
import { createDefaultOnboardingDraft } from './onboardingDraftReducers';

function normalizeEntryIntent(raw: unknown): OnboardingEntryIntent {
  if (raw === 'activate' || raw === 'sign_in') return raw;
  return null;
}

function normalizePhase(
  raw: OnboardingPhase | LegacyOnboardingPhase | undefined,
  fallback: OnboardingPhase,
): OnboardingPhase {
  if (
    raw === 'welcome' ||
    raw === 'activate' ||
    raw === 'persist' ||
    raw === 'paywall' ||
    raw === 'done'
  ) {
    return raw;
  }
  return fallback;
}

export function isLegacyQuizDraft(draft: OnboardingDraftInput): boolean {
  if (draft.phase === 'quiz' || draft.phase === 'tips') {
    return true;
  }
  if ((draft.problems?.length ?? 0) > 0 && !draft.reminderDraft) {
    return true;
  }
  if (
    draft.commitmentAccepted &&
    draft.phase !== 'paywall' &&
    draft.phase !== 'done' &&
    draft.phase !== 'persist'
  ) {
    return true;
  }
  return false;
}

export function normalizeOnboardingDraft(
  raw: OnboardingDraftInput | null,
): OnboardingDraft {
  const base = createDefaultOnboardingDraft();
  if (!raw) {
    return base;
  }
  if (isLegacyQuizDraft(raw)) {
    return base;
  }
  return {
    ...base,
    ...raw,
    phase: normalizePhase(raw.phase, base.phase),
    problems: raw.problems ?? [],
    careInterests: raw.careInterests ?? [],
    reminderDraft: raw.reminderDraft ?? null,
    createdPetId: raw.createdPetId ?? null,
    petDraft: raw.petDraft ?? null,
    entryIntent: normalizeEntryIntent(raw.entryIntent),
  };
}
