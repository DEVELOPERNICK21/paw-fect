import {
  canApplyDewormingUserTransition,
} from '../DewormingScheduleStateMachine';

describe('DewormingScheduleStateMachine', () => {
  it.each([
    ['upcoming', 'complete', true],
    ['overdue', 'complete', true],
    ['locked', 'complete', true],
    ['missed', 'complete', true],
    ['upcoming', 'skip', true],
    ['overdue', 'skip', true],
    ['completed', 'complete', false],
    ['completed', 'skip', false],
    ['skipped', 'complete', false],
    ['skipped', 'skip', false],
  ] as const)(
    'from %s via %s => %s',
    (from, transition, expected) => {
      expect(canApplyDewormingUserTransition(from, transition)).toBe(expected);
    },
  );
});
