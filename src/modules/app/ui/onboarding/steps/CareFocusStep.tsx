import React from 'react';

import type { CareInterest } from '../../../../settings/domain/models/Settings';
import { OnboardingCareInterestsStep } from '../../components/OnboardingCareInterestsStep';

type Props = {
  selected: CareInterest[];
  onToggle: (interest: CareInterest) => void;
};

/** Reuses the existing care-interest chip UI as the funnel's care-focus step. */
export const CareFocusStep: React.FC<Props> = ({ selected, onToggle }) => (
  <OnboardingCareInterestsStep selected={selected} onToggle={onToggle} />
);
