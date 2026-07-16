import type { OnboardingDraft } from '../../domain/onboarding/OnboardingDraft';
import { createDefaultOnboardingDraft } from '../../domain/onboarding/onboardingDraftReducers';
import { storageService } from '../../../../infrastructure/storage/storageService';

const ONBOARDING_DRAFT_STORAGE_KEY = 'onboarding_draft';

export interface OnboardingDraftDataSource {
  getDraft(): Promise<OnboardingDraft>;
  saveDraft(draft: OnboardingDraft): Promise<void>;
  clearDraft(): Promise<void>;
}

class OnboardingDraftDataSourceImpl implements OnboardingDraftDataSource {
  async getDraft(): Promise<OnboardingDraft> {
    const stored = await storageService.getItem<Partial<OnboardingDraft> | null>(
      ONBOARDING_DRAFT_STORAGE_KEY,
    );
    if (!stored) {
      return createDefaultOnboardingDraft();
    }

    return {
      ...createDefaultOnboardingDraft(),
      ...stored,
    };
  }

  async saveDraft(draft: OnboardingDraft): Promise<void> {
    await storageService.setItem(ONBOARDING_DRAFT_STORAGE_KEY, draft);
  }

  async clearDraft(): Promise<void> {
    await storageService.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
  }
}

export const createOnboardingDraftDataSource = (): OnboardingDraftDataSource =>
  new OnboardingDraftDataSourceImpl();
