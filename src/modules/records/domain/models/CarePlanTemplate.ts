export type PetRegion = 'IN' | 'US' | 'EU' | 'OTHER';
export type LifestyleType = 'indoor' | 'outdoor' | 'mixed';
export type LifestyleRiskLevel = 'low' | 'medium' | 'high';

export interface CarePlanContext {
  petType: 'dog' | 'cat';
  dateOfBirth: string;
  nowDate: string;
  region: PetRegion;
  lifestyleType: LifestyleType;
  lifestyleRiskLevel: LifestyleRiskLevel;
}

export interface VaccineRule {
  key: string;
  family: string;
  label: string;
  category: 'core' | 'non-core';
  doseNumber: number;
  totalDoses: number;
  ageWeeksMin: number;
  ageWeeksMax: number;
  intervalWeeksFromPreviousDose?: number;
  boosterIntervalMonths?: number;
  isOptional?: boolean;
  lifestyleTriggers?: LifestyleType[];
  riskLevel?: LifestyleRiskLevel;
  /** Skip this vaccine when the pet's care region is in this list. */
  excludedRegions?: PetRegion[];
}

export interface RabiesRule {
  key: string;
  family: 'Rabies';
  label: string;
  category: 'core';
  firstDoseAgeWeeksMin: number;
  firstDoseAgeWeeksMax: number;
  boosterAfterMonths: number;
  repeatIntervalMonthsAfterBooster: number;
  regionOverrides?: Partial<Record<PetRegion, number>>;
}

export interface DewormingRule {
  startWeeks: number[];
  untilMonths: number;
  indoorIntervalDays: number;
  mixedIntervalDays: number;
  outdoorIntervalDays: number;
  adultIntervalMonths: number;
}

export interface SpeciesCarePlanTemplate {
  petType: 'dog' | 'cat';
  coreSeries: VaccineRule[];
  rabies: RabiesRule;
  nonCoreSeries: VaccineRule[];
  deworming: DewormingRule;
  version: number;
}
