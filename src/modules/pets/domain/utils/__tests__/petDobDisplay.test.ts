import { formatPetAgeLabel } from '../petDobDisplay';

describe('formatPetAgeLabel', () => {
  it('shows months instead of 0 years for pets under one year', () => {
    const now = new Date('2026-06-15T12:00:00');
    const dob = '2025-12-15';
    expect(formatPetAgeLabel(dob, now)).toBe('6 Months Old');
  });

  it('shows years when at least 12 calendar months', () => {
    const now = new Date('2026-12-16T12:00:00');
    const dob = '2025-12-15';
    expect(formatPetAgeLabel(dob, now)).toBe('1 Year Old');
  });

  it('shows weeks when under one month', () => {
    const now = new Date('2026-06-15T12:00:00');
    const dob = '2026-06-01';
    expect(formatPetAgeLabel(dob, now)).toBe('2 Weeks Old');
  });

  it('shows less than a week when applicable', () => {
    const now = new Date('2026-06-15T12:00:00');
    const dob = '2026-06-12';
    expect(formatPetAgeLabel(dob, now)).toBe('Less than a week old');
  });
});
