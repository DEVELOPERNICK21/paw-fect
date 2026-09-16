import type { SmartHealthRecord } from '../models/SmartHealthRecord';
import { plainVaccineDisplayName } from './vaccinePlainLanguage';

export type CareOwnerCopy = {
  what: string;
  why: string;
  whatToDo: string;
};

/**
 * Short owner-facing title for a SmartHealth record (no protocol codes).
 */
export function careWhatLabel(record: SmartHealthRecord): string {
  if (record.type === 'deworming') {
    return 'Worm medicine';
  }
  const family = (record.family ?? record.name).toLowerCase();
  if (family.includes('rabies')) {
    return 'Rabies vaccine';
  }
  if (
    family.includes('dhpp') ||
    family.includes('fvrcp') ||
    record.category === 'core'
  ) {
    const plain = plainVaccineDisplayName(record.name);
    if (/\(shot \d\)/i.test(plain) || /booster/i.test(plain)) {
      return plain
        .replace(/^Main body vaccine for (dogs|cats)/i, 'Core vaccine')
        .replace(/\s*—\s*booster/i, ' — booster');
    }
    return 'Core vaccine';
  }
  return plainVaccineDisplayName(record.name)
    .replace(/^Main body vaccine for (dogs|cats)/i, 'Core vaccine')
    .replace(/\s*—\s*very important\. Ask your vet\./i, '');
}

export function careWhyLine(record: SmartHealthRecord): string {
  if (record.type === 'deworming') {
    return 'Protects against intestinal worms.';
  }
  const family = (record.family ?? record.name).toLowerCase();
  if (family.includes('rabies')) {
    return 'Protects against a serious disease.';
  }
  if (family.includes('dhpp') || family.includes('fvrcp')) {
    return 'Protects from common serious diseases.';
  }
  if (family.includes('lepto')) {
    return 'Helps near dirty water or urine.';
  }
  if (family.includes('bordetella') || family.includes('kennel')) {
    return 'Helps stop a spreading cough.';
  }
  if (family.includes('lyme')) {
    return 'Helps with tick bites when needed.';
  }
  if (family.includes('felv') || family.includes('leukemia')) {
    return 'Helps outdoor cats stay safer.';
  }
  return 'Keeps care on time — ask your vet.';
}

export function careWhatToDoLine(
  record: SmartHealthRecord,
  petName: string,
): string {
  if (record.type === 'deworming') {
    return `Give the medicine your vet recommends for ${petName}.`;
  }
  return `Take ${petName} to your vet for this vaccine.`;
}

export function buildCareOwnerCopy(
  record: SmartHealthRecord,
  petName: string,
): CareOwnerCopy {
  return {
    what: careWhatLabel(record),
    why: careWhyLine(record),
    whatToDo: careWhatToDoLine(record, petName),
  };
}

export function healthStatusHeadline(params: {
  overdueCount: number;
  needsNextCount: number;
}): string {
  if (params.overdueCount > 0) {
    return 'Something needs attention';
  }
  if (params.needsNextCount === 0) {
    return "You're on track";
  }
  return 'Coming up soon';
}

export function whySeeingThisBody(params: {
  petName: string;
  ageLabel: string;
}): string {
  return (
    `Because ${params.petName} is ${params.ageLabel}. ` +
    `At this age, pets usually have important vaccines and regular worm-treatment needs. ` +
    `PawSoul uses ${params.petName}'s age, pet type, and your previous records to create reminders. ` +
    `Your vet decides the actual treatment and timing.`
  );
}
