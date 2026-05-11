import { formatPetAgeLabel, formatPetAgeShareLabel } from '../petDobDisplay';

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

describe('formatPetAgeShareLabel', () => {
  const refNow = new Date('2026-05-11T12:00:00.000Z');

  it('returns null for blank / missing dob', () => {
    expect(formatPetAgeShareLabel(undefined, refNow)).toBeNull();
    expect(formatPetAgeShareLabel('', refNow)).toBeNull();
    expect(formatPetAgeShareLabel('   ', refNow)).toBeNull();
  });

  it('returns null for future dob', () => {
    expect(formatPetAgeShareLabel('2030-01-01', refNow)).toBeNull();
  });

  it('returns null for invalid date string', () => {
    expect(formatPetAgeShareLabel('not-a-date', refNow)).toBeNull();
  });

  it('formats weeks when months would round to 0', () => {
    expect(formatPetAgeShareLabel('2026-05-01', refNow)).toBe('1 wk');
    expect(formatPetAgeShareLabel('2026-04-21', refNow)).toBe('2 wks');
  });

  it('formats months for under one year old', () => {
    expect(formatPetAgeShareLabel('2026-04-11', refNow)).toBe('1 mo');
    expect(formatPetAgeShareLabel('2025-11-11', refNow)).toBe('6 mo');
  });

  it('formats just years when month component is zero', () => {
    expect(formatPetAgeShareLabel('2024-05-11', refNow)).toBe('2 yrs');
    expect(formatPetAgeShareLabel('2025-05-11', refNow)).toBe('1 yr');
  });

  it('formats years + months when both present', () => {
    expect(formatPetAgeShareLabel('2024-01-11', refNow)).toBe('2 yrs 4 mo');
    expect(formatPetAgeShareLabel('2023-09-11', refNow)).toBe('2 yrs 8 mo');
  });
});
