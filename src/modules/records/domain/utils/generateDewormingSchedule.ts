import type {
  DewormingSchedule,
  DewormingPhase,
} from '../models/SmartHealthRecord';

const MAX_MONTHS = 24;

const addDays = (date: string, days: number): string => {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const addWeeks = (date: string, weeks: number): string =>
  addDays(date, weeks * 7);

const addMonths = (date: string, months: number): string => {
  const d = new Date(`${date}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

/**
 * Pure function to generate deworming schedule from DOB
 *
 * Rules:
 * - 2-week phase: at 2, 4, 6, 8 weeks
 * - Monthly phase: 3, 4, 5, 6 months
 * - Quarterly phase: every 3 months after 6 months (till 2 years limit)
 *
 * @param petId - The pet's ID
 * @param dateOfBirth - Pet's date of birth (YYYY-MM-DD)
 * @returns Array of DewormingSchedule objects sorted by sequence
 */
export function generateDewormingSchedule(
  petId: string,
  dateOfBirth: string,
): DewormingSchedule[] {
  const schedules: DewormingSchedule[] = [];
  const generatedAt = new Date().toISOString();
  let sequenceNumber = 1;

  // ===== PHASE 1: TWO_WEEK (2, 4, 6, 8 weeks) =====
  const twoWeekWeeks = [2, 4, 6, 8];
  for (const weeks of twoWeekWeeks) {
    schedules.push({
      id: `${petId}-deworm-${sequenceNumber}`,
      petId,
      dueDate: addWeeks(dateOfBirth, weeks),
      phaseType: 'TWO_WEEK' as DewormingPhase,
      sequenceNumber,
      generatedAt,
      sourcePetDob: dateOfBirth,
    });
    sequenceNumber++;
  }

  // ===== PHASE 2: MONTHLY (3, 4, 5, 6 months) =====
  const monthlyMonths = [3, 4, 5, 6];
  for (const months of monthlyMonths) {
    schedules.push({
      id: `${petId}-deworm-${sequenceNumber}`,
      petId,
      dueDate: addMonths(dateOfBirth, months),
      phaseType: 'MONTHLY' as DewormingPhase,
      sequenceNumber,
      generatedAt,
      sourcePetDob: dateOfBirth,
    });
    sequenceNumber++;
  }

  // ===== PHASE 3: QUARTERLY (every 3 months from 9 months till 24 months) =====
  let currentMonth = 9;
  while (currentMonth <= MAX_MONTHS) {
    schedules.push({
      id: `${petId}-deworm-${sequenceNumber}`,
      petId,
      dueDate: addMonths(dateOfBirth, currentMonth),
      phaseType: 'QUARTERLY' as DewormingPhase,
      sequenceNumber,
      generatedAt,
      sourcePetDob: dateOfBirth,
    });
    sequenceNumber++;
    currentMonth += 3;
  }

  return schedules.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
}

export default generateDewormingSchedule;
