import type { OnboardingPhase } from './OnboardingDraft';

export type OnboardingGate = 'quiz' | 'auth' | 'paywall' | 'tips' | 'complete';

export function resolveOnboardingGate(input: {
  onboardingCompleted: boolean;
  phase: OnboardingPhase;
  commitmentAccepted: boolean;
  isAuthenticated: boolean;
}): OnboardingGate {
  if (input.onboardingCompleted || input.phase === 'done') return 'complete';
  if (input.phase === 'tips') return 'tips';
  if (input.phase === 'paywall') {
    if (!input.isAuthenticated) return 'auth';
    return 'paywall';
  }
  // quiz phase
  if (input.commitmentAccepted && !input.isAuthenticated) return 'auth';
  if (input.commitmentAccepted && input.isAuthenticated) return 'paywall';
  return 'quiz';
}
