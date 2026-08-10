import type { PetDraft } from './OnboardingDraft';
import { buildOnboardingSocialProofLine } from './onboardingPaywallCopy';

const speciesLabel = (species: PetDraft['species'] | null | undefined): string => {
  if (species === 'cat') {
    return 'cat';
  }
  if (species === 'both') {
    return 'pets';
  }
  return 'dog';
};

export function buildProcessingLines(
  nickname: string,
  species?: PetDraft['species'] | null,
): string[] {
  const trimmed = nickname.trim();
  const subject =
    trimmed.length > 0
      ? `${trimmed}'s`
      : `your ${speciesLabel(species)}'s`;

  return [
    `Analyzing ${subject} care needs…`,
    buildOnboardingSocialProofLine().replace(/^Join /, 'Matched with '),
    'Building your personalized plan…',
  ];
}
