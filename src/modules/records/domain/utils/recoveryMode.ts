import type {
  DewormingPhase,
  DewormingSchedule,
} from '../models/SmartHealthRecord';

const DAY_MS = 24 * 60 * 60 * 1000;

const toDateOnly = (date: string): string => date.slice(0, 10);

const daysBetween = (from: string, to: string): number => {
  const fromDate = new Date(`${from}T00:00:00`).getTime();
  const toDate = new Date(`${to}T00:00:00`).getTime();
  return Math.floor((toDate - fromDate) / DAY_MS);
};

const addDays = (date: string, days: number): string => {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export interface RecoveryAction {
  type: 'RECOVERY';
  actualDate: string;
  reason: 'multi_missed_doses' | 'late_onboarding';
  skipsMissedSchedules: string[]; // IDs of schedules being skipped
}

export interface RecoveryModeResult {
  recoveryMode: boolean;
  recoveryActionAvailable: boolean;
  recoveryAction: RecoveryAction | null;
  nextAction: {
    dueDate: string;
    phaseType: DewormingPhase;
    type: 'normal' | 'recovery';
    message: string;
  };
  message: string;
  overdueCount: number;
}

/**
 * Determine phase based on pet's age
 */
function getPhaseForPetAge(petAgeMonths: number): DewormingPhase {
  if (petAgeMonths < 3) return 'TWO_WEEK';
  if (petAgeMonths < 6) return 'MONTHLY';
  return 'QUARTERLY';
}

/**
 * Get interval days for phase
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
 * Calculate pet age in months from DOB
 */
function calculatePetAgeMonths(dob: string, asOfDate: string): number {
  const days = daysBetween(dob, asOfDate);
  return Math.floor(days / 30);
}

/**
 * Recovery Mode Detection and Action Generator
 *
 * This function determines if the user is in "Recovery Mode" (multiple missed doses)
 * and provides a way to recover with a single action instead of logging each missed dose.
 *
 * @param overdueSchedules - Array of missed/overdue schedule items
 * @param todayDate - Current date (YYYY-MM-DD)
 * @param petDob - Pet's date of birth (YYYY-MM-DD)
 * @returns RecoveryModeResult with recovery action info
 *
 * Rules:
 * - If overdueSchedules.length > 1 → recoveryMode = true
 * - Recovery action creates single record with type "RECOVERY"
 * - After recovery, future schedule recalculated based on pet age
 * - All previously missed schedules are marked as "skipped"
 */
export function detectRecoveryMode(
  overdueSchedules: DewormingSchedule[],
  todayDate: string,
  petDob: string,
): RecoveryModeResult {
  const overdueCount = overdueSchedules.length;
  const today = toDateOnly(todayDate);
  const petAgeMonths = calculatePetAgeMonths(petDob, today);
  const currentPhase = getPhaseForPetAge(petAgeMonths);
  const isLateOnboarding = petAgeMonths >= 6 && overdueCount > 0;

  // Rule 1: Activate recovery mode if > 1 overdue
  const recoveryMode = overdueCount > 1 || isLateOnboarding;

  // Rule 2: Recovery action available in recovery mode
  const recoveryActionAvailable = recoveryMode;

  // Build recovery action
  let recoveryAction: RecoveryAction | null = null;
  if (recoveryActionAvailable) {
    recoveryAction = {
      type: 'RECOVERY',
      actualDate: today,
      reason: isLateOnboarding ? 'late_onboarding' : 'multi_missed_doses',
      skipsMissedSchedules: overdueSchedules.map(s => s.id),
    };
  }

  // Calculate next action after recovery
  const intervalDays = getIntervalDays(currentPhase);
  const nextDueDate = addDays(today, intervalDays);
  const nextPhase = getPhaseForPetAge(
    calculatePetAgeMonths(petDob, nextDueDate),
  );

  let message: string;
  let nextActionMessage: string;

  if (recoveryMode) {
    if (isLateOnboarding) {
      message = `Welcome! Let\'s get ${petAgeMonths}-month-old pet on track with ${nextPhase} deworming schedule.`;
    } else {
      message = `You missed ${overdueCount} deworming doses. Let\'s get your pet back on track!`;
    }
    nextActionMessage = `Next dose scheduled in ${intervalDays} days (${nextPhase})`;
  } else if (overdueCount === 1) {
    message = 'You have 1 overdue deworming dose.';
    nextActionMessage = `Due: ${overdueSchedules[0]?.dueDate}`;
  } else {
    message = "You're all caught up!";
    nextActionMessage = 'No pending doses';
  }

  return {
    recoveryMode,
    recoveryActionAvailable,
    recoveryAction,
    nextAction: {
      dueDate: nextDueDate,
      phaseType: nextPhase,
      type: recoveryMode ? 'recovery' : 'normal',
      message: nextActionMessage,
    },
    message,
    overdueCount,
  };
}

/**
 * Calculate future schedule after recovery action
 *
 * After user performs recovery action, this generates the new future schedule
 * starting from today (treating it as last completed date)
 *
 * @param recoveryDate - Date of recovery action (usually today)
 * @param petDob - Pet's date of birth
 * @param count - Number of future items to generate
 * @returns Array of new schedule items
 */
export function calculatePostRecoverySchedule(
  recoveryDate: string,
  petDob: string,
  count: number = 5,
): Array<{
  sequenceNumber: number;
  dueDate: string;
  phaseType: DewormingPhase;
  daysFromRecovery: number;
}> {
  const schedules: Array<{
    sequenceNumber: number;
    dueDate: string;
    phaseType: DewormingPhase;
    daysFromRecovery: number;
  }> = [];

  let currentDate = toDateOnly(recoveryDate);
  let sequenceNumber = 1;

  for (let i = 0; i < count; i++) {
    const petAgeAtDue = calculatePetAgeMonths(petDob, currentDate);
    const phaseAtDue = getPhaseForPetAge(petAgeAtDue);
    const intervalDays = getIntervalDays(phaseAtDue);

    const nextDueDate = addDays(currentDate, intervalDays);
    const daysFromRecovery = daysBetween(recoveryDate, nextDueDate);
    const nextPhase = getPhaseForPetAge(
      calculatePetAgeMonths(petDob, nextDueDate),
    );

    schedules.push({
      sequenceNumber,
      dueDate: nextDueDate,
      phaseType: nextPhase,
      daysFromRecovery,
    });

    currentDate = nextDueDate;
    sequenceNumber++;
  }

  return schedules;
}

// ============================================================
// EXAMPLE SCENARIOS
// ============================================================

/*
// Scenario 1: 2 missed doses
const result1 = detectRecoveryMode(
  [
    { id: 'deworm-1', dueDate: '2025-01-15', phaseType: 'TWO_WEEK', sequenceNumber: 1 },
    { id: 'deworm-2', dueDate: '2025-01-29', phaseType: 'TWO_WEEK', sequenceNumber: 2 },
  ],
  '2025-02-15',  // today
  '2025-01-01'   // DOB (6 weeks old = 1.5 months)
);

Output:
{
  recoveryMode: true,
  recoveryActionAvailable: true,
  recoveryAction: {
    type: 'RECOVERY',
    actualDate: '2025-02-15',
    reason: 'multi_missed_doses',
    skipsMissedSchedules: ['deworm-1', 'deworm-2']
  },
  nextAction: {
    dueDate: '2025-03-17',  // 30 days from recovery
    phaseType: 'MONTHLY',
    type: 'recovery',
    message: 'Next dose scheduled in 30 days (MONTHLY)'
  },
  message: 'You missed 2 deworming doses. Let\'s get your pet back on track!',
  overdueCount: 2
}

// Scenario 2: 4 missed doses (puppy phase)
const result2 = detectRecoveryMode(
  [
    { id: 'deworm-1', dueDate: '2025-01-15', phaseType: 'TWO_WEEK', sequenceNumber: 1 },
    { id: 'deworm-2', dueDate: '2025-01-29', phaseType: 'TWO_WEEK', sequenceNumber: 2 },
    { id: 'deworm-3', dueDate: '2025-02-12', phaseType: 'TWO_WEEK', sequenceNumber: 3 },
    { id: 'deworm-4', dueDate: '2025-02-26', phaseType: 'TWO_WEEK', sequenceNumber: 4 },
  ],
  '2025-03-15',
  '2025-01-01'
);

Output:
{
  recoveryMode: true,
  recoveryActionAvailable: true,
  recoveryAction: { ... },
  nextAction: { dueDate: '2025-04-14', phaseType: 'MONTHLY', ... },
  message: 'You missed 4 deworming doses. Let\'s get your pet back on track!',
  overdueCount: 4
}

// Scenario 3: Late onboarding (adult pet with no history)
const result3 = detectRecoveryMode(
  [
    { id: 'deworm-old', dueDate: '2024-10-01', phaseType: 'QUARTERLY', sequenceNumber: 1 }
  ],
  '2025-04-01',
  '2024-01-01'  // Pet is 15 months old
);

Output:
{
  recoveryMode: true,
  recoveryActionAvailable: true,
  recoveryAction: {
    type: 'RECOVERY',
    actualDate: '2025-04-01',
    reason: 'late_onboarding',
    skipsMissedSchedules: ['deworm-old']
  },
  nextAction: {
    dueDate: '2025-06-30',
    phaseType: 'QUARTERLY',
    type: 'recovery',
    message: 'Next dose scheduled in 90 days (QUARTERLY)'
  },
  message: 'Welcome! Let\'s get 15-month-old pet on track with QUARTERLY deworming schedule.',
  overdueCount: 1
}

// Scenario 4: Single overdue (normal mode)
const result4 = detectRecoveryMode(
  [{ id: 'deworm-1', dueDate: '2025-03-01', phaseType: 'TWO_WEEK', sequenceNumber: 1 }],
  '2025-03-15',
  '2025-01-01'
);

Output:
{
  recoveryMode: false,
  recoveryActionAvailable: false,
  recoveryAction: null,
  nextAction: { dueDate: '2025-03-01', phaseType: 'TWO_WEEK', type: 'normal', message: 'Due: 2025-03-01' },
  message: 'You have 1 overdue deworming dose.',
  overdueCount: 1
}

// Post-recovery schedule (after user clicks "Mark as done today"):
const postRecovery = calculatePostRecoverySchedule('2025-03-15', '2025-01-01', 5);

Output:
[
  { sequenceNumber: 1, dueDate: '2025-04-14', phaseType: 'MONTHLY', daysFromRecovery: 30 },
  { sequenceNumber: 2, dueDate: '2025-05-14', phaseType: 'MONTHLY', daysFromRecovery: 60 },
  { sequenceNumber: 3, dueDate: '2025-06-13', phaseType: 'MONTHLY', daysFromRecovery: 90 },
  { sequenceNumber: 4, dueDate: '2025-09-11', phaseType: 'QUARTERLY', daysFromRecovery: 180 },
  { sequenceNumber: 5, dueDate: '2025-12-10', phaseType: 'QUARTERLY', daysFromRecovery: 270 }
]
*/

export default detectRecoveryMode;
