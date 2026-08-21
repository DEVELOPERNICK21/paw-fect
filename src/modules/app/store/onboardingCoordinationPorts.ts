import type { OnboardingProfile } from '../domain/onboarding/OnboardingProfile';
import type { CareInterest } from '../../settings/domain/models/Settings';

export interface PersistOnboardingCompletionInput {
  careInterests: CareInterest[];
  onboardingProfile: OnboardingProfile;
}

export interface OnboardingSettingsPort {
  persistOnboardingCompletion: (
    input: PersistOnboardingCompletionInput,
  ) => Promise<boolean>;
}

const unregistered: OnboardingSettingsPort = {
  persistOnboardingCompletion: async () => false,
};

let port: OnboardingSettingsPort = unregistered;

export function registerOnboardingSettingsPort(
  next: OnboardingSettingsPort,
): void {
  port = next;
}

export function getOnboardingSettingsPort(): OnboardingSettingsPort {
  return port;
}
