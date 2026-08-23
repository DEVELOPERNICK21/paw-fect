import type { OnboardingDraft } from '../../domain/onboarding/OnboardingDraft';
import { normalizeOnboardingDraft } from '../../domain/onboarding/normalizeOnboardingDraft';
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
    return normalizeOnboardingDraft(stored);
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
