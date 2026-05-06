const ISO_DATE_LENGTH = 10;

export function toIsoDateOnly(value: string): string {
  if (!value) return value;
  return value.length >= ISO_DATE_LENGTH
    ? value.slice(0, ISO_DATE_LENGTH)
    : value;
}

/**
 * Ensures a scheduled or logged health date is not before the pet existed.
 * Skip validation when DOB is missing (caller should collect DOB elsewhere).
 */
export function assertDateNotBeforePetDob(
  eventDate: string,
  petDateOfBirth: string | undefined | null,
  fieldLabel: string,
): void {
  if (!petDateOfBirth || petDateOfBirth.length < ISO_DATE_LENGTH) {
    return;
  }
  const d = toIsoDateOnly(eventDate);
  const dob = toIsoDateOnly(petDateOfBirth);
  if (d < dob) {
    throw new Error(
      `${fieldLabel} cannot be before the pet's date of birth (${dob}).`,
    );
  }
}
