import type { PetRegion } from '../../modules/pets/domain/models/Pet';

/**
 * Infers a sensible default care-plan region from device locale/timezone.
 * India-first: defaults to IN when locale or timezone indicates India.
 */
export function inferDefaultPetRegion(): PetRegion {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? '';
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';

    if (
      locale.endsWith('-IN') ||
      locale === 'en-IN' ||
      locale === 'hi-IN' ||
      timeZone === 'Asia/Kolkata' ||
      timeZone === 'Asia/Calcutta'
    ) {
      return 'IN';
    }

    if (locale.endsWith('-US') || timeZone.startsWith('America/')) {
      return 'US';
    }

    if (
      locale.endsWith('-GB') ||
      locale.endsWith('-DE') ||
      locale.endsWith('-FR') ||
      timeZone.startsWith('Europe/')
    ) {
      return 'EU';
    }
  } catch {
    // Fall through to OTHER.
  }

  return 'OTHER';
}

/**
 * Maps unspecified regions to India medical defaults (rabies interval, etc.).
 */
export function resolveCarePlanRegion(region: PetRegion | undefined): PetRegion {
  if (region == null || region === 'OTHER') {
    return 'IN';
  }
  return region;
}
