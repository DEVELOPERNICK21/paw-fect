/**
 * Plain-language labels for vaccine / health plan names shown to pet owners.
 * Storage keys and template `family` values stay technical; UI maps at render time.
 */

const FAMILY_PLAIN: Record<string, string> = {
  DHPP: 'Core dog vaccine (distemper, hepatitis, parvovirus, parainfluenza)',
  FVRCP: 'Core cat vaccine (viral rhinotracheitis, calicivirus, panleukopenia)',
  Rabies: 'Rabies vaccine — required; protects against a fatal disease',
  Leptospirosis: 'Leptospirosis vaccine — protects against a bacterial infection from water/urine',
  Bordetella: 'Kennel cough vaccine — helps prevent highly contagious cough',
  Lyme: 'Lyme disease vaccine — for tick-borne infection (not used in most of India)',
  FeLV: 'Feline leukemia vaccine — protects outdoor cats from FeLV',
};

const NAME_HINTS: Array<{ match: RegExp; plain: string }> = [
  {
    match: /^dhpp/i,
    plain: 'Core dog vaccine (DHPP) — distemper, hepatitis, parvovirus, parainfluenza',
  },
  {
    match: /^fvrcp/i,
    plain: 'Core cat vaccine (FVRCP) — flu-like viruses and panleukopenia',
  },
  {
    match: /^rabies/i,
    plain: 'Rabies vaccine — required; protects against a fatal disease',
  },
  {
    match: /^lepto/i,
    plain: 'Leptospirosis vaccine — bacterial infection from dirty water or urine',
  },
  {
    match: /^bordetella|kennel cough/i,
    plain: 'Kennel cough vaccine — helps prevent a contagious cough',
  },
  {
    match: /^lyme/i,
    plain: 'Lyme vaccine — tick-borne disease (rarely needed in India)',
  },
  {
    match: /^felv|feline leukemia/i,
    plain: 'Feline leukemia (FeLV) vaccine — for outdoor or high-risk cats',
  },
  {
    match: /deworm/i,
    plain: 'Deworming — clears intestinal worms that can make pets sick',
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
      return `${plain} ${suffixMatch[1].trim()}`;
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
    return 'Protects against distemper, hepatitis, parvovirus, and parainfluenza';
  }
  if (/fvrcp/i.test(key)) {
    return 'Protects against common cat viruses and panleukopenia';
  }
  if (/rabies/i.test(key)) {
    return 'Protects against rabies — a fatal disease; required in India';
  }
  if (/lepto/i.test(key)) {
    return 'Protects against leptospirosis from contaminated water or urine';
  }
  if (/bordetella|kennel cough/i.test(key)) {
    return 'Helps prevent kennel cough (highly contagious)';
  }
  if (/lyme/i.test(key)) {
    return 'For tick-borne Lyme disease — uncommon in most of India';
  }
  if (/felv|leukemia/i.test(key)) {
    return 'Protects against feline leukemia virus';
  }
  if (/deworm/i.test(key)) {
    return 'Clears worms that can cause weight loss, diarrhoea, or worse';
  }
  return undefined;
}
