import type { OnboardingDraftRepository } from '../repositories/OnboardingDraftRepository';

export class ClearOnboardingDraft {
  constructor(private readonly repository: OnboardingDraftRepository) {}

  async execute(): Promise<void> {
    return this.repository.clearDraft();
  }
}
