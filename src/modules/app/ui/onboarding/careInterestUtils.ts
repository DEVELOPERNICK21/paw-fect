import type { CareInterest } from '../../../settings/domain/models/Settings';

export type CareInterestOption = {
  id: CareInterest;
  label: string;
};

export const CARE_INTEREST_OPTIONS: CareInterestOption[] = [
  { id: 'vaccines', label: 'Vaccines' },
  { id: 'walks', label: 'Walks' },
  { id: 'meds', label: 'Meds' },
  { id: 'grooming', label: 'Grooming' },
];

export const toggleCareInterest = (
  current: CareInterest[],
  interest: CareInterest,
): CareInterest[] => {
  if (current.includes(interest)) {
    return current.filter(item => item !== interest);
  }
  return [...current, interest];
};
