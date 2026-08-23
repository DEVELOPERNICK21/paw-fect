import type { OnboardingProfile } from '../domain/onboarding/OnboardingProfile';
import type {
  PetDraft,
  ReminderDraft,
} from '../domain/onboarding/OnboardingDraft';
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

export type ActivationPortResult =
  | { ok: true; petId: string }
  | { ok: false; errorMessage: string };

export type ReminderPortResult =
  | { ok: true }
  | { ok: false; errorMessage: string };

export interface OnboardingActivationPort {
  createPetFromDraft(input: {
    userId: string;
    pet: PetDraft;
  }): Promise<ActivationPortResult>;
  createReminderFromDraft(input: {
    petId: string;
    reminder: ReminderDraft;
  }): Promise<ReminderPortResult>;
}

const unregisteredSettings: OnboardingSettingsPort = {
  persistOnboardingCompletion: async () => false,
};

const unregisteredActivation: OnboardingActivationPort = {
  createPetFromDraft: async () => ({
    ok: false,
    errorMessage: 'Onboarding activation is not configured.',
  }),
  createReminderFromDraft: async () => ({
    ok: false,
    errorMessage: 'Onboarding activation is not configured.',
  }),
};

let settingsPort: OnboardingSettingsPort = unregisteredSettings;
let activationPort: OnboardingActivationPort = unregisteredActivation;

export function registerOnboardingSettingsPort(
  next: OnboardingSettingsPort,
): void {
  settingsPort = next;
}

export function getOnboardingSettingsPort(): OnboardingSettingsPort {
  return settingsPort;
}

export function registerOnboardingActivationPort(
  next: OnboardingActivationPort,
): void {
  activationPort = next;
}

export function getOnboardingActivationPort(): OnboardingActivationPort {
  return activationPort;
}
