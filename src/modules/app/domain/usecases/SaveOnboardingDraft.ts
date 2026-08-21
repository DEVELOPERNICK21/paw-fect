import type { OnboardingDraft } from '../onboarding/OnboardingDraft';
import type { OnboardingDraftRepository } from '../repositories/OnboardingDraftRepository';

export class SaveOnboardingDraft {
  constructor(private readonly repository: OnboardingDraftRepository) {}

  async execute(draft: OnboardingDraft): Promise<void> {
    return this.repository.saveDraft(draft);
  }
}
