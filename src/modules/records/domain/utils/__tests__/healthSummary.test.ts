import type { SmartHealthRecord } from '../../models/SmartHealthRecord';
import { buildHealthSummary, describeDaysToNext } from '../healthSummary';

const rec = (
  id: string,
  status: SmartHealthRecord['status'],
  dueDate: string,
): SmartHealthRecord =>
  ({
    id,
    status,
    dueDate,
    name: id,
    type: 'vaccination',
    completedDate: status === 'completed' ? dueDate : null,
  }) as SmartHealthRecord;

describe('buildHealthSummary', () => {
  it('is empty when nothing counts', () => {
    const s = buildHealthSummary([rec('a', 'locked', '2030-01-01')], '2026-10-22');
    expect(s.tone).toBe('empty');
    expect(s.progress).toBe(0);
  });

  it('flags attention when something is overdue', () => {
    const s = buildHealthSummary(
      [rec('a', 'overdue', '2026-10-01'), rec('b', 'completed', '2026-09-01')],
      '2026-10-22',
    );
    expect(s.tone).toBe('attention');
    expect(s.overdue).toBe(1);
    expect(s.progress).toBe(0.5);
  });

  it('is "soon" when the next item is within 14 days', () => {
    const s = buildHealthSummary(
      [rec('a', 'upcoming', '2026-10-25'), rec('b', 'upcoming', '2027-01-01')],
      '2026-10-22',
    );
    expect(s.tone).toBe('soon');
    expect(s.next?.id).toBe('a');
    expect(s.daysToNext).toBe(3);
  });

  it('is on track when the next item is far away, ignoring skipped doses', () => {
    const s = buildHealthSummary(
      [rec('a', 'upcoming', '2027-03-01'), rec('b', 'skipped', '2026-09-01')],
      '2026-10-22',
    );
    expect(s.tone).toBe('ontrack');
    expect(s.total).toBe(1);
  });
});

describe('describeDaysToNext', () => {
  it('reads naturally', () => {
    expect(describeDaysToNext(0)).toBe('today');
    expect(describeDaysToNext(1)).toBe('tomorrow');
    expect(describeDaysToNext(9)).toBe('in 9 days');
    expect(describeDaysToNext(30)).toBe('in 4 weeks');
    expect(describeDaysToNext(120)).toBe('in 4 months');
  });
});
