import type { OnboardingDraft } from '../../domain/onboarding/OnboardingDraft';
import type { OnboardingDraftRepository } from '../../domain/repositories/OnboardingDraftRepository';
import {
  createOnboardingDraftDataSource,
  type OnboardingDraftDataSource,
} from '../onboarding/OnboardingDraftDataSource';

export class OnboardingDraftRepositoryImpl implements OnboardingDraftRepository {
  constructor(private readonly local: OnboardingDraftDataSource) {}

  getDraft(): Promise<OnboardingDraft> {
    return this.local.getDraft();
  }

  saveDraft(draft: OnboardingDraft): Promise<void> {
    return this.local.saveDraft(draft);
  }

  clearDraft(): Promise<void> {
    return this.local.clearDraft();
  }
}

export const createOnboardingDraftRepository = (): OnboardingDraftRepository =>
  new OnboardingDraftRepositoryImpl(createOnboardingDraftDataSource());
