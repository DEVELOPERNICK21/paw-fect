import type { HealthRecord } from '../../modules/records/domain/models/HealthRecord';

/**
 * Derives the "latest weight line" for a pet from health records.
 * Pure helper so both Home dashboard and Pet profile can share the same logic.
 */
export function getLatestWeightDisplayForPet(
  records: HealthRecord[],
  petId: string,
): string {
  const candidates = records.filter(
    r =>
      r.petId === petId &&
      (/\bweight\b/i.test(r.category) ||
        /\bweight\b/i.test(r.title) ||
        /\blbs?\b/i.test(r.notes) ||
        /\bkg\b/i.test(r.notes)),
  );

  if (candidates.length === 0) {
    return '—';
  }

  const sorted = [...candidates].sort((a, b) => b.date.localeCompare(a.date));
  const top = sorted[0];

  const note = top?.notes?.trim();
  if (note && note.length > 0) {
    return note;
  }

  const title = top?.title?.trim();
  if (title && title.length > 0) {
    return title;
  }

  return '—';
}

