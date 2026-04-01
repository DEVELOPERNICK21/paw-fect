import {
  buildCompletionUpdate,
  generateBootstrapSchedule,
  resolveSmartStatus,
} from '../SmartHealthScheduleUtils';
import type { SmartHealthRecord } from '../../models/SmartHealthRecord';

describe('SmartHealthScheduleUtils', () => {
  it('resolves completed/overdue/upcoming/locked statuses', () => {
    expect(resolveSmartStatus('2026-01-01', '2026-01-01', '2026-01-02')).toBe(
      'completed',
    );
    expect(resolveSmartStatus('2026-01-01', null, '2026-01-02')).toBe('overdue');
    expect(resolveSmartStatus('2026-01-10', null, '2026-01-02')).toBe('upcoming');
    expect(resolveSmartStatus('2026-03-10', null, '2026-01-02')).toBe('locked');
  });

  it('generates dog bootstrap schedule with optional booster and phased deworming', () => {
    const { records } = generateBootstrapSchedule({
      userId: 'user-1',
      petId: 'pet-1',
      petType: 'dog',
      dateOfBirth: '2026-01-01',
    });

    const vaccinations = records.filter(r => r.type === 'vaccination');
    const deworming = records.filter(r => r.type === 'deworming');

    expect(vaccinations.some(r => r.name === 'DHPP (Optional booster)')).toBe(
      true,
    );
    expect(
      vaccinations.some(r => r.name === 'DHPP (Optional booster)' && r.isOptional),
    ).toBe(true);
    expect(deworming.length).toBeGreaterThan(3);
    expect(deworming.some(r => r.recurrenceType === 'quarterly')).toBe(true);
  });

  it('generates adult onboarding schedule from last dates', () => {
    const { records } = generateBootstrapSchedule({
      userId: 'user-1',
      petId: 'pet-1',
      petType: 'cat',
      dateOfBirth: '2020-01-01',
      lastVaccinationDate: '2026-01-10',
      lastDewormingDate: '2026-01-12',
    });

    expect(records).toHaveLength(2);
    expect(records.find(r => r.type === 'vaccination')?.dueDate).toBe('2027-01-10');
    expect(records.find(r => r.type === 'deworming')?.dueDate).toBe('2026-04-12');
  });

  it('creates next recurring task from completion date', () => {
    const source: SmartHealthRecord = {
      id: 'r1',
      userId: 'u1',
      petId: 'p1',
      type: 'deworming',
      name: 'Deworming',
      dueDate: '2026-02-01',
      completedDate: null,
      status: 'upcoming',
      recurrenceType: 'quarterly',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const { updated, next } = buildCompletionUpdate(source, '2026-02-03');

    expect(updated.status).toBe('completed');
    expect(updated.completedDate).toBe('2026-02-03');
    expect(next?.dueDate).toBe('2026-05-03');
  });
});
