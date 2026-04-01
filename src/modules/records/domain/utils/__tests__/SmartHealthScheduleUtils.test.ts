import {
  buildCompletionUpdate,
  generateBootstrapSchedule,
  resolveSmartStatus,
} from '../SmartHealthScheduleUtils';
import type { SmartHealthRecord } from '../../models/SmartHealthRecord';
import { PetCareLifecycleEngine } from '../PetCareLifecycleEngine';

describe('SmartHealthScheduleUtils', () => {
  it('resolves completed/overdue/upcoming/locked statuses', () => {
    expect(resolveSmartStatus('2026-01-01', '2026-01-01', '2026-01-02')).toBe(
      'completed',
    );
    expect(resolveSmartStatus('2026-01-01', null, '2026-01-02')).toBe('overdue');
    expect(resolveSmartStatus('2026-01-10', null, '2026-01-02')).toBe('upcoming');
    expect(resolveSmartStatus('2026-03-10', null, '2026-01-02')).toBe('locked');
  });

  it('generates dog bootstrap schedule with core/non-core and deterministic keys', () => {
    const { records } = generateBootstrapSchedule({
      userId: 'user-1',
      petId: 'pet-1',
      petType: 'dog',
      dateOfBirth: '2026-01-01',
      region: 'IN',
      lifestyleType: 'outdoor',
      lifestyleRiskLevel: 'high',
    });

    const vaccinations = records.filter(r => r.type === 'vaccination');
    const deworming = records.filter(r => r.type === 'deworming');

    expect(vaccinations.some(r => r.name === 'DHPP (4th/optional puppy dose)')).toBe(
      true,
    );
    expect(vaccinations.some(r => r.family === 'Leptospirosis')).toBe(true);
    expect(vaccinations.some(r => r.key === 'RABIES_1')).toBe(true);
    expect(deworming.length).toBeGreaterThan(3);
    expect(deworming.some(r => r.recurrenceType === 'quarterly')).toBe(true);
    expect(records.every(r => typeof r.key === 'string')).toBe(true);
  });

  it('generates adult onboarding schedule from last dates and region override', () => {
    const { records } = generateBootstrapSchedule({
      userId: 'user-1',
      petId: 'pet-1',
      petType: 'cat',
      dateOfBirth: '2020-01-01',
      lastVaccinationDate: '2026-01-10',
      lastDewormingDate: '2026-01-12',
      region: 'US',
      lifestyleType: 'indoor',
      lifestyleRiskLevel: 'low',
    });

    expect(records.length).toBeGreaterThan(2);
    expect(records.find(r => r.key === 'RABIES_1_BOoster')).toBeUndefined();
    expect(records.find(r => r.name === 'Rabies Booster')?.dueDate).toBe('2029-01-10');
    expect(records.find(r => r.type === 'deworming' && r.recurrenceType === 'quarterly')?.dueDate).toBe('2026-02-11');
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
    expect(updated.recovery?.recoveryReason).toBe('late');
  });

  it('recalculates records for missed and backdated events', () => {
    const engine = new PetCareLifecycleEngine();
    const records = generateBootstrapSchedule({
      userId: 'user-1',
      petId: 'pet-1',
      petType: 'dog',
      dateOfBirth: '2026-01-01',
      region: 'IN',
      lifestyleType: 'outdoor',
      lifestyleRiskLevel: 'high',
    }).records;
    const first = records[0] as SmartHealthRecord;
    const missed = engine.recalculatePlanOnEvent({
      records,
      event: { type: 'missed', recordId: first.id },
      contextNowDate: '2026-02-20',
    });
    expect(missed.find(r => r.id === first.id)?.status).toBe('missed');

    const recurring = records.find(
      r => r.type === 'deworming' && r.recurrenceType === 'quarterly',
    );
    expect(recurring).toBeDefined();
    const backdated = engine.recalculatePlanOnEvent({
      records,
      event: {
        type: 'backdated_entry',
        recordId: recurring!.id,
        completedDate: '2026-03-01',
      },
      contextNowDate: '2026-03-02',
    });
    const done = backdated.find(r => r.id === recurring!.id);
    expect(done?.status).toBe('completed');
    expect(done?.completedDate).toBe('2026-03-01');
  });
});
