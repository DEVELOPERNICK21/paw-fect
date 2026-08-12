/**
 * Plain-language labels for vaccine / health plan names shown to pet owners.
 * Storage keys and template `family` values stay technical; UI maps at render time.
 * Aim: an 8–10 year old pet parent can understand the next action.
 */

const FAMILY_PLAIN: Record<string, string> = {
  DHPP: 'Main body vaccine for dogs',
  FVRCP: 'Main body vaccine for cats',
  Rabies: 'Rabies shot — very important. Ask your vet.',
  Leptospirosis: 'Lepto shot — helps if your dog goes near dirty water',
  Bordetella: 'Kennel cough shot — helps stop a bad cough',
  Lyme: 'Lyme shot — for tick bites (rarely needed in India)',
  FeLV: 'Cat leukemia shot — for outdoor or at-risk cats',
};

const NAME_HINTS: Array<{ match: RegExp; plain: string }> = [
  {
    match: /^dhpp/i,
    plain: 'Main body vaccine for dogs',
  },
  {
    match: /^fvrcp/i,
    plain: 'Main body vaccine for cats',
  },
  {
    match: /^rabies/i,
    plain: 'Rabies shot — very important. Ask your vet.',
  },
  {
    match: /^lepto/i,
    plain: 'Lepto shot — helps if your dog goes near dirty water',
  },
  {
    match: /^bordetella|kennel cough/i,
    plain: 'Kennel cough shot — helps stop a bad cough',
  },
  {
    match: /^lyme/i,
    plain: 'Lyme shot — for tick bites (rarely needed in India)',
  },
  {
    match: /^felv|feline leukemia/i,
    plain: 'Cat leukemia shot — for outdoor or at-risk cats',
  },
  {
    match: /deworm/i,
    plain: 'Worm medicine',
  },
];

/**
 * Returns a short plain-English explanation for a vaccine family key.
 */
export function plainVaccineFamilyLabel(family: string): string {
  return FAMILY_PLAIN[family] ?? family;
}

/**
 * Returns an owner-friendly display name for a stored vaccine/record name.
 * Keeps dose markers like "(1st)" / "Booster" when present.
 */
export function plainVaccineDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return name;
  }

  for (const { match, plain } of NAME_HINTS) {
    if (!match.test(trimmed)) {
      continue;
    }
    const suffixMatch = trimmed.match(
      /\s*(\((?:1st|2nd|3rd|4th|Start|Booster)\)|\bBooster\b.*)$/i,
    );
    if (suffixMatch) {
      const suffix = suffixMatch[1].trim();
      const ordinal = suffix.match(/(1st|2nd|3rd|4th)/i)?.[1]?.toLowerCase();
      if (ordinal) {
        const n =
          ordinal === '1st'
            ? '1'
            : ordinal === '2nd'
            ? '2'
            : ordinal === '3rd'
            ? '3'
            : '4';
        return `${plain} (shot ${n})`;
      }
      if (/booster/i.test(suffix)) {
        return `${plain} — booster`;
      }
      return `${plain} ${suffix}`;
    }
    return plain;
  }

  return trimmed;
}

/**
 * One-line subtitle for list rows (what this protects against).
 */
export function vaccineProtectionHint(nameOrFamily: string): string | undefined {
  const key = nameOrFamily.trim();
  if (/dhpp/i.test(key)) {
    return 'Helps protect against common dog illnesses';
  }
  if (/fvrcp/i.test(key)) {
    return 'Helps protect against common cat illnesses';
  }
  if (/rabies/i.test(key)) {
    return 'Ask your vet — this shot is very important';
  }
  if (/lepto/i.test(key)) {
    return 'Helps if your pet is near dirty water or urine';
  }
  if (/bordetella|kennel cough/i.test(key)) {
    return 'Helps stop a cough that spreads easily';
  }
  if (/lyme/i.test(key)) {
    return 'For tick bites — rarely needed in most of India';
  }
  if (/felv|leukemia/i.test(key)) {
    return 'Helps outdoor cats stay safer from leukemia virus';
  }
  if (/deworm/i.test(key)) {
    return 'Clears worms that can make your pet sick';
  }
  return undefined;
}
