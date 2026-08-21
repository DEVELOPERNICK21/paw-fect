import type { OnboardingDraft } from '../onboarding/OnboardingDraft';

export interface OnboardingDraftRepository {
  getDraft(): Promise<OnboardingDraft>;
  saveDraft(draft: OnboardingDraft): Promise<void>;
  clearDraft(): Promise<void>;
}
