import type { DewormingPhase } from '../models/SmartHealthRecord';

const DAY_MS = 24 * 60 * 60 * 1000;

const toDateOnly = (date: string): string => date.slice(0, 10);

const daysBetween = (from: string, to: string): number => {
  const fromDate = new Date(`${from}T00:00:00`).getTime();
  const toDate = new Date(`${to}T00:00:00`).getTime();
  return Math.floor((toDate - fromDate) / DAY_MS);
};

export interface DateValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}

/**
 * Get maximum allowed past days for each phase type
 */
function getMaxPastDaysForPhase(phaseType: DewormingPhase): number {
  switch (phaseType) {
    case 'TWO_WEEK':
      return 7;
    case 'MONTHLY':
      return 15;
    case 'QUARTERLY':
      return 30;
    default:
      return 30;
  }
}

/**
 * Validate deworming date input
 *
 * Rules:
 * - Future dates are invalid
 * - Past dates allowed based on phase type:
 *   - TWO_WEEK: max 7 days past
 *   - MONTHLY: max 15 days past
 *   - QUARTERLY: max 30 days past
 *
 * @param selectedDate - Date to validate (YYYY-MM-DD)
 * @param phaseType - Current deworming phase
 * @param todayDate - Today's date (YYYY-MM-DD)
 * @returns Validation result with isValid and errorMessage
 */
export function validateDewormingDate(
  selectedDate: string,
  phaseType: DewormingPhase,
  todayDate: string,
): DateValidationResult {
  const date = toDateOnly(selectedDate);
  const today = toDateOnly(todayDate);
  const maxPastDays = getMaxPastDaysForPhase(phaseType);

  // Rule 1: Future dates are invalid
  if (date > today) {
    return {
      isValid: false,
      errorMessage: 'Cannot select a future date',
    };
  }

  // Rule 2: Past range based on phase
  const daysPast = daysBetween(date, today);

  if (daysPast > maxPastDays) {
    const phaseLabel =
      phaseType === 'TWO_WEEK'
        ? '2-week'
        : phaseType === 'MONTHLY'
        ? 'monthly'
        : 'quarterly';

    return {
      isValid: false,
      errorMessage: `Date cannot be more than ${maxPastDays} days past for ${phaseLabel} phase`,
    };
  }

  return {
    isValid: true,
    errorMessage: null,
  };
}

/**
 * Get minimum allowed date for a given phase (for UI display)
 */
export function getMinAllowedDate(
  phaseType: DewormingPhase,
  todayDate: string,
): string {
  const today = toDateOnly(todayDate);
  const maxPastDays = getMaxPastDaysForPhase(phaseType);

  const d = new Date(`${today}T00:00:00`);
  d.setDate(d.getDate() - maxPastDays);
  return d.toISOString().slice(0, 10);
}

// ============================================================
// TEST CASES
// ============================================================

export function runValidationTests(): void {
  const today = '2025-04-01';

  console.log('=== Deworming Date Validation Tests ===\n');

  // Test 1: Future date (invalid)
  console.log('Test 1: Future date');
  const result1 = validateDewormingDate('2025-04-15', 'MONTHLY', today);
  console.log('  Input: 2025-04-15, MONTHLY, today=2025-04-01');
  console.log('  Expected: invalid (future date)');
  console.log('  Result:', result1);
  console.log('  Pass:', !result1.isValid ? '✅' : '❌');
  console.log('');

  // Test 2: TWO_WEEK phase, 5 days past (valid)
  console.log('Test 2: TWO_WEEK phase, 5 days past');
  const result2 = validateDewormingDate('2025-03-27', 'TWO_WEEK', today);
  console.log('  Input: 2025-03-27, TWO_WEEK, today=2025-04-01');
  console.log('  Expected: valid');
  console.log('  Result:', result2);
  console.log('  Pass:', result2.isValid ? '✅' : '❌');
  console.log('');

  // Test 3: TWO_WEEK phase, 10 days past (invalid)
  console.log('Test 3: TWO_WEEK phase, 10 days past');
  const result3 = validateDewormingDate('2025-03-22', 'TWO_WEEK', today);
  console.log('  Input: 2025-03-22, TWO_WEEK, today=2025-04-01');
  console.log('  Expected: invalid (exceeds 7 days)');
  console.log('  Result:', result3);
  console.log('  Pass:', !result3.isValid ? '✅' : '❌');
  console.log('');

  // Test 4: MONTHLY phase, 10 days past (valid)
  console.log('Test 4: MONTHLY phase, 10 days past');
  const result4 = validateDewormingDate('2025-03-22', 'MONTHLY', today);
  console.log('  Input: 2025-03-22, MONTHLY, today=2025-04-01');
  console.log('  Expected: valid');
  console.log('  Result:', result4);
  console.log('  Pass:', result4.isValid ? '✅' : '❌');
  console.log('');

  // Test 5: MONTHLY phase, 20 days past (invalid)
  console.log('Test 5: MONTHLY phase, 20 days past');
  const result5 = validateDewormingDate('2025-03-12', 'MONTHLY', today);
  console.log('  Input: 2025-03-12, MONTHLY, today=2025-04-01');
  console.log('  Expected: invalid (exceeds 15 days)');
  console.log('  Result:', result5);
  console.log('  Pass:', !result5.isValid ? '✅' : '❌');
  console.log('');

  // Test 6: QUARTERLY phase, 20 days past (valid)
  console.log('Test 6: QUARTERLY phase, 20 days past');
  const result6 = validateDewormingDate('2025-03-12', 'QUARTERLY', today);
  console.log('  Input: 2025-03-12, QUARTERLY, today=2025-04-01');
  console.log('  Expected: valid');
  console.log('  Result:', result6);
  console.log('  Pass:', result6.isValid ? '✅' : '❌');
  console.log('');

  // Test 7: QUARTERLY phase, 45 days past (invalid)
  console.log('Test 7: QUARTERLY phase, 45 days past');
  const result7 = validateDewormingDate('2025-02-15', 'QUARTERLY', today);
  console.log('  Input: 2025-02-15, QUARTERLY, today=2025-04-01');
  console.log('  Expected: invalid (exceeds 30 days)');
  console.log('  Result:', result7);
  console.log('  Pass:', !result7.isValid ? '✅' : '❌');
  console.log('');

  // Test 8: Today (valid)
  console.log('Test 8: Today');
  const result8 = validateDewormingDate('2025-04-01', 'MONTHLY', today);
  console.log('  Input: 2025-04-01, MONTHLY, today=2025-04-01');
  console.log('  Expected: valid');
  console.log('  Result:', result8);
  console.log('  Pass:', result8.isValid ? '✅' : '❌');
  console.log('');

  // Test 9: Edge case - exactly max days (valid)
  console.log('Test 9: MONTHLY phase, exactly 15 days past');
  const result9 = validateDewormingDate('2025-03-17', 'MONTHLY', today);
  console.log('  Input: 2025-03-17, MONTHLY, today=2025-04-01');
  console.log('  Expected: valid (exactly at limit)');
  console.log('  Result:', result9);
  console.log('  Pass:', result9.isValid ? '✅' : '❌');
  console.log('');

  // Test 10: Edge case - one day over limit (invalid)
  console.log('Test 10: MONTHLY phase, 16 days past');
  const result10 = validateDewormingDate('2025-03-16', 'MONTHLY', today);
  console.log('  Input: 2025-03-16, MONTHLY, today=2025-04-01');
  console.log('  Expected: invalid (one day over)');
  console.log('  Result:', result10);
  console.log('  Pass:', !result10.isValid ? '✅' : '❌');
  console.log('');

  console.log('=== All tests complete ===');
}

export default validateDewormingDate;
