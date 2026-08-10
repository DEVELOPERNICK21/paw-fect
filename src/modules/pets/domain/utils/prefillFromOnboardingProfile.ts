import type { OnboardingProfile } from '../../../app/domain/onboarding/OnboardingProfile';
import type { PetType } from '../../domain/models/Pet';

export type AddPetOnboardingPrefill = {
  name: string;
  petType: PetType;
  fieldsPrefilled: string[];
};

/** Maps durable onboarding pet draft into editable AddPet defaults. */
export function prefillFromOnboardingProfile(
  profile: OnboardingProfile | undefined,
): AddPetOnboardingPrefill | null {
  if (!profile?.pet) {
    return null;
  }

  const fieldsPrefilled: string[] = [];
  const nickname = profile.pet.nickname.trim();
  const name = nickname;
  if (nickname) {
    fieldsPrefilled.push('name');
  }

  let petType: PetType = 'dog';
  if (profile.pet.species === 'cat') {
    petType = 'cat';
    fieldsPrefilled.push('petType');
  } else if (profile.pet.species === 'dog') {
    petType = 'dog';
    fieldsPrefilled.push('petType');
  } else if (profile.pet.species === 'both') {
    // Default dog; still counts as a species hint from onboarding.
    petType = 'dog';
    fieldsPrefilled.push('petType');
  }

  if (fieldsPrefilled.length === 0) {
    return null;
  }

  return { name, petType, fieldsPrefilled };
}
