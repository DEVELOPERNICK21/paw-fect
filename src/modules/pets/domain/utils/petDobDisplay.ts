function parseDob(dob: string | undefined): Date | null {
  if (!dob?.trim()) {
    return null;
  }
  const d = new Date(dob);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatPetAgeLabel(dob: string | undefined, now = new Date()): string {
  const birthDate = parseDob(dob);
  if (!birthDate) {
    return 'Not set';
  }

  // Approximate age in full years for UI display.
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  const ageYears = Math.max(0, Math.floor((now.getTime() - birthDate.getTime()) / msPerYear));

  const unit = ageYears === 1 ? 'Year' : 'Years';
  return `${ageYears} ${unit} Old`;
}

export function formatPetBirthdayLabel(dob: string | undefined): string {
  const birthDate = parseDob(dob);
  if (!birthDate) {
    return '—';
  }

  return birthDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

