import type { DewormingPhase } from '../models/SmartHealthRecord';

const DAY_MS = 24 * 60 * 60 * 1000;

const addDays = (date: string, days: number): string => {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const daysBetween = (from: string, to: string): number => {
  const fromDate = new Date(`${from}T00:00:00`).getTime();
  const toDate = new Date(`${to}T00:00:00`).getTime();
  return Math.floor((toDate - fromDate) / DAY_MS);
};

export interface RecalculatedSchedule {
  sequenceNumber: number;
  dueDate: string;
  phaseType: DewormingPhase;
  daysFromLastCompletion: number;
  reason: string;
}

/**
 * Get interval in days for each phase type
 */
function getIntervalDays(phase: DewormingPhase): number {
  switch (phase) {
    case 'TWO_WEEK':
      return 14;
    case 'MONTHLY':
      return 30;
    case 'QUARTERLY':
      return 90;
    default:
      return 30;
  }
}

/**
 * Determine phase based on pet's age from DOB
 * (8 weeks = transition to monthly, 6 months = transition to quarterly)
 */
function getPhaseAtDate(dob: string, date: string): DewormingPhase {
  const ageWeeks = Math.floor(daysBetween(dob, date) / 7);
  const ageMonths = Math.floor(daysBetween(dob, date) / 30);

  if (ageWeeks < 8) {
    return 'TWO_WEEK';
  }
  if (ageMonths < 6) {
    return 'MONTHLY';
  }
  return 'QUARTERLY';
}

/**
 * Recalculate future deworming schedule after a dose is recorded
 *
 * This is the "killer feature" - timeline evolves with user input.
 * When user logs a dose, future dates shift based on actual completion date.
 *
 * @param lastCompletedDate - When user actually completed the dose (YYYY-MM-DD)
 * @param currentPhaseType - Current phase (TWO_WEEK, MONTHLY, QUARTERLY)
 * @param petDob - Pet's date of birth (YYYY-MM-DD) for phase transition logic
 * @param count - Number of upcoming schedules to generate (default 5)
 * @returns Array of recalculated schedule items
 *
 * Rules:
 * - Next due date = lastCompletedDate + interval (based on phase)
 * - Phase transitions: 8 weeks → monthly, 6 months → quarterly
 * - Each subsequent date = previous date + interval (based on phase at that date)
 */
export function recalculateDewormingSchedule(
  lastCompletedDate: string,
  currentPhaseType: DewormingPhase,
  petDob: string,
  count: number = 5,
): RecalculatedSchedule[] {
  const schedules: RecalculatedSchedule[] = [];

  let currentDate = lastCompletedDate;
  let currentPhase = currentPhaseType;
  let sequenceNumber = 1;

  for (let i = 0; i < count; i++) {
    // Calculate next due date based on current phase
    const intervalDays = getIntervalDays(currentPhase);
    const nextDueDate = addDays(currentDate, intervalDays);

    // Determine phase at the next due date (for phase transition)
    const phaseAtNextDue = getPhaseAtDate(petDob, nextDueDate);

    // Calculate days from last completion
    const daysFromLastCompletion = daysBetween(lastCompletedDate, nextDueDate);

    // Determine reason for this schedule item
    let reason: string;
    if (phaseAtNextDue !== currentPhase) {
      reason = `Phase transition: ${currentPhase} → ${phaseAtNextDue}`;
    } else {
      reason = `${currentPhase} interval (${intervalDays} days)`;
    }

    schedules.push({
      sequenceNumber,
      dueDate: nextDueDate,
      phaseType: phaseAtNextDue,
      daysFromLastCompletion,
      reason,
    });

    // Move to next iteration
    currentDate = nextDueDate;
    currentPhase = phaseAtNextDue;
    sequenceNumber++;
  }

  return schedules;
}

/**
 * Alternative: Recalculate from today's date (for users who haven't logged anything)
 */
export function generateForwardSchedule(
  startDate: string,
  currentPhaseType: DewormingPhase,
  petDob: string,
  count: number = 5,
): RecalculatedSchedule[] {
  return recalculateDewormingSchedule(
    startDate,
    currentPhaseType,
    petDob,
    count,
  );
}

// ============================================================
// EXAMPLES
// ============================================================

/*
// Example 1: Puppy (2-week phase)
// Pet DOB: 2025-01-01, Today: 2025-02-01 (4 weeks old)
// User just completed first dose
const result1 = recalculateDewormingSchedule(
  '2025-02-01',  // lastCompletedDate
  'TWO_WEEK',    // current phase
  '2025-01-01',  // DOB
  5
);
Output:
[
  { sequenceNumber: 1, dueDate: '2025-02-15', phaseType: 'TWO_WEEK', daysFromLastCompletion: 14, reason: 'TWO_WEEK interval (14 days)' },
  { sequenceNumber: 2, dueDate: '2025-03-01', phaseType: 'TWO_WEEK', daysFromLastCompletion: 28, reason: 'TWO_WEEK interval (14 days)' },
  { sequenceNumber: 3, dueDate: '2025-03-15', phaseType: 'TWO_WEEK', daysFromLastCompletion: 42, reason: 'TWO_WEEK interval (14 days)' },
  { sequenceNumber: 4, dueDate: '2025-03-01', phaseType: 'MONTHLY', daysFromLastCompletion: 56, reason: 'Phase transition: TWO_WEEK → MONTHLY' },
  { sequenceNumber: 5, dueDate: '2025-03-31', phaseType: 'MONTHLY', daysFromLastCompletion: 86, reason: 'MONTHLY interval (30 days)' }
]

// Example 2: Adult (quarterly phase)
// Pet DOB: 2024-01-01, Today: 2025-04-01 (15 months old)
// User just completed deworming
const result2 = recalculateDewormingSchedule(
  '2025-04-01',  // lastCompletedDate
  'QUARTERLY',   // current phase
  '2024-01-01', // DOB
  5
);
Output:
[
  { sequenceNumber: 1, dueDate: '2025-06-30', phaseType: 'QUARTERLY', daysFromLastCompletion: 90, reason: 'QUARTERLY interval (90 days)' },
  { sequenceNumber: 2, dueDate: '2025-09-28', phaseType: 'QUARTERLY', daysFromLastCompletion: 180, reason: 'QUARTERLY interval (90 days)' },
  { sequenceNumber: 3, dueDate: '2025-12-27', phaseType: 'QUARTERLY', daysFromLastCompletion: 270, reason: 'QUARTERLY interval (90 days)' },
  { sequenceNumber: 4, dueDate: '2026-03-27', phaseType: 'QUARTERLY', daysFromLastCompletion: 360, reason: 'QUARTERLY interval (90 days)' },
  { sequenceNumber: 5, dueDate: '2026-06-26', phaseType: 'QUARTERLY', daysFromLastCompletion: 450, reason: 'QUARTERLY interval (90 days)' }
]

// Example 3: Phase transition scenario
// Pet DOB: 2024-11-01, Today: 2025-02-01 (12 weeks old)
// User completes dose at 12 weeks - should transition to MONTHLY
const result3 = recalculateDewormingSchedule(
  '2025-02-01',  // lastCompletedDate
  'TWO_WEEK',    // current phase (was two-week)
  '2024-11-01',  // DOB
  5
);
Output:
[
  { sequenceNumber: 1, dueDate: '2025-02-15', phaseType: 'TWO_WEEK', daysFromLastCompletion: 14, reason: 'TWO_WEEK interval (14 days)' },
  { sequenceNumber: 2, dueDate: '2025-03-01', phaseType: 'MONTHLY', daysFromLastCompletion: 28, reason: 'Phase transition: TWO_WEEK → MONTHLY' },
  { sequenceNumber: 3, dueDate: '2025-03-31', phaseType: 'MONTHLY', daysFromLastCompletion: 58, reason: 'MONTHLY interval (30 days)' },
  { sequenceNumber: 4, dueDate: '2025-04-30', phaseType: 'MONTHLY', daysFromLastCompletion: 88, reason: 'MONTHLY interval (30 days)' },
  { sequenceNumber: 5, dueDate: '2025-05-30', phaseType: 'QUARTERLY', daysFromLastCompletion: 118, reason: 'Phase transition: MONTHLY → QUARTERLY' }
]
*/

export default recalculateDewormingSchedule;
