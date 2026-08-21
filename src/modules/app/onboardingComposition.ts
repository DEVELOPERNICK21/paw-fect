import { createOnboardingDraftRepository } from './data/repositories/OnboardingDraftRepositoryImpl';
import { ClearOnboardingDraft } from './domain/usecases/ClearOnboardingDraft';
import { GetOnboardingDraft } from './domain/usecases/GetOnboardingDraft';
import { SaveOnboardingDraft } from './domain/usecases/SaveOnboardingDraft';

const repository = createOnboardingDraftRepository();

export const onboardingComposition = {
  getOnboardingDraft: new GetOnboardingDraft(repository),
  saveOnboardingDraft: new SaveOnboardingDraft(repository),
  clearOnboardingDraft: new ClearOnboardingDraft(repository),
} as const;
