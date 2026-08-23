import type {
  OnboardingDraft,
  OnboardingEntryIntent,
  OnboardingPhase,
} from './OnboardingDraft';

export type OnboardingGate =
  | 'welcome'
  | 'activate'
  | 'auth'
  | 'persist'
  | 'paywall'
  | 'complete';

export function isActivationReady(draft: OnboardingDraft): boolean {
  return Boolean(
    draft.petDraft?.nickname.trim() &&
      (draft.petDraft.species === 'dog' || draft.petDraft.species === 'cat') &&
      draft.reminderDraft?.title.trim() &&
      draft.reminderDraft.date &&
      draft.reminderDraft.time,
  );
}

export function isFirstWinPersisted(
  draft: Pick<OnboardingDraft, 'createdPetId' | 'phase'>,
): boolean {
  return (
    draft.createdPetId != null &&
    draft.phase !== 'activate' &&
    draft.phase !== 'welcome'
  );
}

export function resolveOnboardingGate(input: {
  onboardingCompleted: boolean;
  phase: OnboardingPhase;
  entryIntent: OnboardingEntryIntent;
  isAuthenticated: boolean;
  hasPets: boolean;
  activationSubmitted: boolean;
  firstWinPersisted: boolean;
}): OnboardingGate {
  if (input.onboardingCompleted || input.phase === 'done') return 'complete';
  if (input.isAuthenticated && input.hasPets && input.phase === 'welcome') {
    return 'complete';
  }
  if (input.entryIntent === 'sign_in' && !input.isAuthenticated) {
    return 'auth';
  }
  if (input.entryIntent === 'sign_in' && input.isAuthenticated) {
    if (input.onboardingCompleted || input.hasPets) return 'complete';
    return 'activate';
  }
  if (input.phase === 'paywall') {
    if (!input.isAuthenticated) return 'auth';
    return 'paywall';
  }
  if (input.phase === 'persist') {
    if (!input.isAuthenticated) return 'auth';
    return 'persist';
  }
  if (input.activationSubmitted && !input.isAuthenticated) return 'auth';
  if (
    input.activationSubmitted &&
    input.isAuthenticated &&
    !input.firstWinPersisted
  ) {
    return 'persist';
  }
  if (input.phase === 'activate') return 'activate';
  if (input.phase === 'welcome') return 'welcome';
  return 'welcome';
}
