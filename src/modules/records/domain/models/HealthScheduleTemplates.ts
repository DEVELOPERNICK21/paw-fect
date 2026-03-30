import type { HealthScheduleTemplate, VaccinationType } from './HealthSchedule';
import type { PetType } from '../../../pets/domain/models/Pet';

/**
 * Vaccination Templates for Dogs
 */
export const DOG_VACCINATION_TEMPLATES: HealthScheduleTemplate[] = [
  {
    id: 'dog-rabies',
    taskType: 'vaccination',
    taskName: 'Rabies',
    vaccineType: 'rabies',
    defaultFrequencyDays: 365, // Yearly
    applicablePetTypes: ['dog'],
    minAgeWeeks: 12, // First dose at 12 weeks
    isSeries: false,
    adultFrequencyDays: 365,
  },
  {
    id: 'dog-dhpp-1',
    taskType: 'vaccination',
    taskName: 'DHPP (1st dose)',
    vaccineType: 'dhpp',
    defaultFrequencyDays: 21, // 3 weeks
    applicablePetTypes: ['dog'],
    minAgeWeeks: 6,
    maxAgeWeeks: 16,
    intervalWeeks: 3,
    isSeries: true,
    totalDoses: 4, // Typically 4 doses: 6-8, 10-12, 14-16 weeks + 1 year
    adultFrequencyDays: 365,
  },
  {
    id: 'dog-dhpp-2',
    taskType: 'vaccination',
    taskName: 'DHPP (2nd dose)',
    vaccineType: 'dhpp',
    defaultFrequencyDays: 21,
    applicablePetTypes: ['dog'],
    minAgeWeeks: 9,
    maxAgeWeeks: 19,
    intervalWeeks: 3,
    isSeries: true,
    totalDoses: 4,
    adultFrequencyDays: 365,
  },
  {
    id: 'dog-dhpp-3',
    taskType: 'vaccination',
    taskName: 'DHPP (3rd dose)',
    vaccineType: 'dhpp',
    defaultFrequencyDays: 21,
    applicablePetTypes: ['dog'],
    minAgeWeeks: 12,
    maxAgeWeeks: 22,
    intervalWeeks: 3,
    isSeries: true,
    totalDoses: 4,
    adultFrequencyDays: 365,
  },
  {
    id: 'dog-dhpp-4',
    taskType: 'vaccination',
    taskName: 'DHPP Booster',
    vaccineType: 'dhpp',
    defaultFrequencyDays: 365,
    applicablePetTypes: ['dog'],
    minAgeWeeks: 16,
    isSeries: false,
    adultFrequencyDays: 365,
  },
];

/**
 * Vaccination Templates for Cats
 */
export const CAT_VACCINATION_TEMPLATES: HealthScheduleTemplate[] = [
  {
    id: 'cat-rabies',
    taskType: 'vaccination',
    taskName: 'Rabies',
    vaccineType: 'rabies',
    defaultFrequencyDays: 365,
    applicablePetTypes: ['cat'],
    minAgeWeeks: 12,
    isSeries: false,
    adultFrequencyDays: 365,
  },
  {
    id: 'cat-fvrcp-1',
    taskType: 'vaccination',
    taskName: 'FVRCP (1st dose)',
    vaccineType: 'fvrcp',
    defaultFrequencyDays: 21, // 3 weeks
    applicablePetTypes: ['cat'],
    minAgeWeeks: 6,
    maxAgeWeeks: 16,
    intervalWeeks: 3,
    isSeries: true,
    totalDoses: 3, // Typically 3 doses: 6-8, 10-12, 14-16 weeks
    adultFrequencyDays: 365,
  },
  {
    id: 'cat-fvrcp-2',
    taskType: 'vaccination',
    taskName: 'FVRCP (2nd dose)',
    vaccineType: 'fvrcp',
    defaultFrequencyDays: 21,
    applicablePetTypes: ['cat'],
    minAgeWeeks: 9,
    maxAgeWeeks: 19,
    intervalWeeks: 3,
    isSeries: true,
    totalDoses: 3,
    adultFrequencyDays: 365,
  },
  {
    id: 'cat-fvrcp-3',
    taskType: 'vaccination',
    taskName: 'FVRCP (3rd dose)',
    vaccineType: 'fvrcp',
    defaultFrequencyDays: 365,
    applicablePetTypes: ['cat'],
    minAgeWeeks: 12,
    isSeries: false,
    adultFrequencyDays: 365,
  },
];

/**
 * Deworming Templates
 */
export const DEWORMING_TEMPLATE: HealthScheduleTemplate = {
  id: 'deworming-default',
  taskType: 'deworming',
  taskName: 'Deworming',
  defaultFrequencyDays: 90, // Adult: every 90 days
  applicablePetTypes: ['dog', 'cat'],
  youngPetFrequencyDays: 14, // Young pets: every 14 days
  switchToAdultAtWeeks: 12, // Switch at 3 months (12 weeks)
  isSeries: false,
};

/**
 * All vaccination templates combined
 */
export const VACCINATION_TEMPLATES: HealthScheduleTemplate[] = [
  ...DOG_VACCINATION_TEMPLATES,
  ...CAT_VACCINATION_TEMPLATES,
];

/**
 * Get templates for a specific pet type
 */
export const getTemplatesForPetType = (
  petType: PetType,
): HealthScheduleTemplate[] => {
  return VACCINATION_TEMPLATES.filter(t =>
    t.applicablePetTypes.includes(petType),
  );
};

/**
 * Get vaccination templates by type
 */
export const getTemplatesByVaccineType = (
  vaccineType: VaccinationType,
): HealthScheduleTemplate[] => {
  return VACCINATION_TEMPLATES.filter(t => t.vaccineType === vaccineType);
};

/**
 * Get initial frequency based on pet age
 */
export const getDewormingFrequency = (ageInWeeks?: number): number => {
  if (!ageInWeeks) {
    return DEWORMING_TEMPLATE.defaultFrequencyDays;
  }

  if (ageInWeeks < (DEWORMING_TEMPLATE.switchToAdultAtWeeks ?? 12)) {
    return DEWORMING_TEMPLATE.youngPetFrequencyDays ?? 14;
  }

  return DEWORMING_TEMPLATE.defaultFrequencyDays;
};

/**
 * Get vaccination frequency based on pet age
 */
export const getVaccinationFrequency = (
  template: HealthScheduleTemplate,
  ageInWeeks?: number,
): number => {
  if (!ageInWeeks) {
    return template.adultFrequencyDays ?? template.defaultFrequencyDays;
  }

  // If pet is young and it's a series vaccine
  if (template.isSeries && template.minAgeWeeks && ageInWeeks < 16) {
    return (template.intervalWeeks ?? 3) * 7;
  }

  return template.adultFrequencyDays ?? template.defaultFrequencyDays;
};
