import type { OnboardingDraft } from '../onboarding/OnboardingDraft';
import type { OnboardingDraftRepository } from '../repositories/OnboardingDraftRepository';

export class GetOnboardingDraft {
  constructor(private readonly repository: OnboardingDraftRepository) {}

  async execute(): Promise<OnboardingDraft> {
    return this.repository.getDraft();
  }
}
