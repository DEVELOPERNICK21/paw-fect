import React, { useMemo } from 'react';

import {
  CompanionBubble,
  companionLines,
  type CompanionOnboardingStep,
} from '../../../../../shared/components/Companion';
import type { MascotMood } from '../../../../../shared/components/Mascot';
import type { MascotSpecies } from '../../../../../shared/components/Mascot';

const MOOD_BY_STEP: Record<CompanionOnboardingStep, MascotMood> = {
  trustOpen: 'wave',
  problemNaming: 'curious',
  petBasics: 'happy',
  goal: 'happy',
  careFocus: 'curious',
  planReveal: 'celebrating',
  commitment: 'proud',
};

export interface OnboardingCompanionProps {
  step: CompanionOnboardingStep;
  petName?: string;
  species: MascotSpecies;
}

/** The app character guiding each onboarding step, in one fixed slot above the content. */
export const OnboardingCompanion: React.FC<OnboardingCompanionProps> = ({
  step,
  petName,
  species,
}) => {
  const lines = useMemo(
    () => companionLines({ scene: 'onboarding', step, petName }),
    [step, petName],
  );
  return (
    <CompanionBubble
      species={species}
      mood={MOOD_BY_STEP[step]}
      lines={lines}
      testID={`onboarding-companion-${step}`}
    />
  );
};
