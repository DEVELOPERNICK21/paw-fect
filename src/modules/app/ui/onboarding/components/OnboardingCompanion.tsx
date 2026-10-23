import React, { useEffect, useMemo, useRef } from 'react';

import {
  CompanionBubble,
  companionLines,
  type CompanionOnboardingStep,
} from '../../../../../shared/components/Companion';
import {
  gazeForTyping,
  type MascotHandle,
  type MascotMood,
  type MascotSpecies,
} from '../../../../../shared/components/Mascot';

/** The characters a pet name sweeps the eyes across; typical names are well under this. */
const NAME_GAZE_CHARS = 12;
/** The eyes stay on the field this long after the last keystroke, then return to the middle. */
const NAME_GAZE_HOLD_MS = 1800;

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

  // Naming the pet is the most personal moment of the flow: the character looks down at the field
  // and reads along, its eyes sweeping across as the name grows.
  const mascotRef = useRef<MascotHandle>(null);
  const typedLength = petName?.length ?? 0;
  useEffect(() => {
    if (step !== 'petBasics') {
      return;
    }
    const gaze = gazeForTyping(typedLength, NAME_GAZE_CHARS);
    mascotRef.current?.look(gaze.x, gaze.y, NAME_GAZE_HOLD_MS);
  }, [step, typedLength]);

  return (
    <CompanionBubble
      species={species}
      mascotRef={mascotRef}
      mood={MOOD_BY_STEP[step]}
      lines={lines}
      testID={`onboarding-companion-${step}`}
    />
  );
};
