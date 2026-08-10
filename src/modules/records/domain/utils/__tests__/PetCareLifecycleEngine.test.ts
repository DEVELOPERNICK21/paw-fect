import type { SmartHealthRecord } from '../../models/SmartHealthRecord';
import { PetCareLifecycleEngine } from '../PetCareLifecycleEngine';

describe('PetCareLifecycleEngine', () => {
  const engine = new PetCareLifecycleEngine();

  it('prioritizes overdue over upcoming in action required', () => {
    const records = engine.generateInitialPlan({
      userId: 'u1',
      petId: 'p1',
      context: {
        petType: 'dog',
        dateOfBirth: '2026-01-01',
        nowDate: '2026-04-20',
        region: 'IN',
        lifestyleType: 'outdoor',
        lifestyleRiskLevel: 'high',
      },
    });
    const action = engine.getActionRequired(records);
    expect(action).toBeTruthy();
    expect(action?.status).toBe('overdue');
  });

  it('applies lifestyle filtering to non-core vaccines', () => {
    const indoor = engine.generateInitialPlan({
      userId: 'u1',
      petId: 'p1',
      context: {
        petType: 'cat',
        dateOfBirth: '2026-01-01',
        nowDate: '2026-02-10',
        region: 'US',
        lifestyleType: 'indoor',
        lifestyleRiskLevel: 'low',
      },
    });
    expect(indoor.some(r => r.family === 'FeLV')).toBe(false);

    const outdoor = engine.generateInitialPlan({
      userId: 'u1',
      petId: 'p2',
      context: {
        petType: 'cat',
        dateOfBirth: '2026-01-01',
        nowDate: '2026-02-10',
        region: 'US',
        lifestyleType: 'outdoor',
        lifestyleRiskLevel: 'high',
      },
    });
    expect(outdoor.some(r => r.family === 'FeLV')).toBe(true);
  });

  it('excludes Lyme vaccines for India outdoor dogs', () => {
    const india = engine.generateInitialPlan({
      userId: 'u1',
      petId: 'p-in',
      context: {
        petType: 'dog',
        dateOfBirth: '2026-01-01',
        nowDate: '2026-04-01',
        region: 'IN',
        lifestyleType: 'outdoor',
        lifestyleRiskLevel: 'high',
      },
    });
    expect(india.some(r => r.family === 'Lyme')).toBe(false);

    const us = engine.generateInitialPlan({
      userId: 'u1',
      petId: 'p-us',
      context: {
        petType: 'dog',
        dateOfBirth: '2026-01-01',
        nowDate: '2026-04-01',
        region: 'US',
        lifestyleType: 'outdoor',
        lifestyleRiskLevel: 'high',
      },
    });
    expect(us.some(r => r.family === 'Lyme')).toBe(true);
  });

  it('dedupes upcoming by family by default and can disable it', () => {
    const records = engine.generateInitialPlan({
      userId: 'u1',
      petId: 'p3',
      context: {
        petType: 'dog',
        dateOfBirth: '2026-01-01',
        nowDate: '2026-01-20',
        region: 'IN',
        lifestyleType: 'outdoor',
        lifestyleRiskLevel: 'high',
      },
    });
    const deduped = engine.getUpcoming(records, 10, true);
    const all = engine.getUpcoming(records, 10, false);
    expect(all.length).toBeGreaterThanOrEqual(deduped.length);
    const dedupedFamilies = new Set(deduped.map(r => r.family ?? r.name));
    expect(dedupedFamilies.size).toBe(deduped.length);
  });

  it('creates 6-month core booster and region-based rabies booster interval', () => {
    const records = engine.generateInitialPlan({
      userId: 'u2',
      petId: 'p4',
      context: {
        petType: 'dog',
        dateOfBirth: '2026-01-01',
        nowDate: '2026-02-01',
        region: 'IN',
        lifestyleType: 'indoor',
        lifestyleRiskLevel: 'low',
      },
      lastVaccinationDate: '2026-03-01',
    });
    expect(records.some(r => r.name.includes('Booster (6-month)'))).toBe(true);
    const rabies = records.find(r => r.name === 'Rabies Booster');
    expect(rabies?.dueDate).toBe('2027-03-01');
  });

  it('uses booster-only core path for adults with vaccination history', () => {
    const records = engine.generateInitialPlan({
      userId: 'u2',
      petId: 'adult-dog',
      context: {
        petType: 'dog',
        dateOfBirth: '2024-01-01',
        nowDate: '2026-03-01',
        region: 'IN',
        lifestyleType: 'indoor',
        lifestyleRiskLevel: 'low',
      },
      lastVaccinationDate: '2026-01-15',
    });

    const dhppRows = records.filter(r => r.family === 'DHPP');
    expect(dhppRows.some(r => r.name === 'DHPP Booster')).toBe(true);
    expect(dhppRows.some(r => r.name.includes('(1st)'))).toBe(false);
    expect(dhppRows.some(r => r.name.includes('(2nd)'))).toBe(false);

    const rabiesFirstDose = records.find(r => r.key === 'RABIES_1');
    expect(rabiesFirstDose).toBeUndefined();
    const rabiesBooster = records.find(r => r.name === 'Rabies Booster');
    expect(rabiesBooster?.dueDate).toBe('2027-01-15');
  });

  it('updates recurring deworming after late completion', () => {
    const records = engine.generateInitialPlan({
      userId: 'u3',
      petId: 'p5',
      context: {
        petType: 'cat',
        dateOfBirth: '2026-01-01',
        nowDate: '2026-07-01',
        region: 'US',
        lifestyleType: 'mixed',
        lifestyleRiskLevel: 'medium',
      },
    });
    const recurring = records.find(
      r => r.type === 'deworming' && r.recurrenceType === 'quarterly',
    );
    expect(recurring).toBeDefined();
    const updated = engine.recalculatePlanOnEvent({
      records,
      event: {
        type: 'completion',
        recordId: recurring!.id,
        completedDate: '2026-07-10',
      },
      contextNowDate: '2026-07-11',
    });
    const target = updated.find(r => r.id === recurring!.id);
    expect(target?.status).toBe('completed');
  });

  it('uses adult catch-up protocol for 55-week dog without history', () => {
    const records = engine.generateInitialPlan({
      userId: 'u4',
      petId: 'p6',
      context: {
        petType: 'dog',
        dateOfBirth: '2025-03-15',
        nowDate: '2026-04-01',
        region: 'IN',
        lifestyleType: 'indoor',
        lifestyleRiskLevel: 'low',
      },
    });
    const dhpp = records.filter(r => r.family === 'DHPP');
    expect(dhpp.some(r => r.name === 'DHPP (Start)')).toBe(true);
    expect(dhpp.some(r => r.name === 'DHPP (Follow-up)')).toBe(true);
    expect(dhpp.some(r => r.name.includes('(1st)'))).toBe(false);
    const rabiesNow = records.find(r => r.key === 'RABIES_1');
    expect(rabiesNow?.dueDate).toBe('2026-04-01');
  });

  it('keeps schedules distinct across pets with same timeline', () => {
    const firstPet = engine.generateInitialPlan({
      userId: 'u7',
      petId: 'pet-a',
      context: {
        petType: 'cat',
        dateOfBirth: '2026-01-01',
        nowDate: '2026-05-01',
        region: 'US',
        lifestyleType: 'indoor',
        lifestyleRiskLevel: 'low',
      },
    });
    const secondPet = engine.generateInitialPlan({
      userId: 'u7',
      petId: 'pet-b',
      context: {
        petType: 'cat',
        dateOfBirth: '2026-01-01',
        nowDate: '2026-05-01',
        region: 'US',
        lifestyleType: 'indoor',
        lifestyleRiskLevel: 'low',
      },
    });

    const firstIds = new Set(firstPet.map(r => r.id));
    const overlap = secondPet.some(r => firstIds.has(r.id));
    expect(overlap).toBe(false);
  });

  it('generates expected puppy deworming milestones for DOB 2026-03-26', () => {
    const records = engine.generateInitialPlan({
      userId: 'u5',
      petId: 'p7',
      context: {
        petType: 'dog',
        dateOfBirth: '2026-03-26',
        nowDate: '2026-04-09',
        region: 'OTHER',
        lifestyleType: 'indoor',
        lifestyleRiskLevel: 'low',
      },
    });

    const deworming = records
      .filter(r => r.type === 'deworming' && r.status !== 'completed')
      .map(r => r.dueDate);

    expect(deworming).toContain('2026-04-09');
    expect(deworming).toContain('2026-04-23');
    expect(deworming).toContain('2026-05-07');
    expect(deworming).toContain('2026-05-21');
  });

  it('realigns future deworming dates from backdated completion anchor', () => {
    const records = engine.generateInitialPlan({
      userId: 'u6',
      petId: 'p8',
      context: {
        petType: 'dog',
        dateOfBirth: '2026-03-26',
        nowDate: '2026-04-09',
        region: 'OTHER',
        lifestyleType: 'indoor',
        lifestyleRiskLevel: 'low',
      },
    });

    const next = records.find(
      r => r.type === 'deworming' && r.dueDate === '2026-04-09',
    );
    expect(next).toBeDefined();

    const updated = engine.recalculatePlanOnEvent({
      records,
      event: {
        type: 'completion',
        recordId: next!.id,
        completedDate: '2026-04-07',
      },
      contextNowDate: '2026-04-09',
    });

    const future = updated
      .filter(
        r =>
          r.type === 'deworming' &&
          r.status !== 'completed' &&
          r.dueDate >= '2026-04-08',
      )
      .map(r => r.dueDate);

    expect(future).toContain('2026-04-21');
    expect(future).toContain('2026-05-05');
  });

  it('supersedes older open deworming rows when completing a later dose', () => {
    const records: SmartHealthRecord[] = [
        {
          id: 'p1-deworming-DEWORM_2026-06-01-2026-06-01',
          userId: 'u1',
          petId: 'p1',
          type: 'deworming',
          key: 'DEWORM_2026-06-01',
          family: 'Deworming',
          category: 'core',
          name: 'Deworming',
          dueDate: '2026-06-01',
          completedDate: null,
          status: 'overdue',
          recurrenceType: 'none',
          cadence: 'monthly',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'p1-deworming-DEWORM_2026-07-01-2026-07-01',
          userId: 'u1',
          petId: 'p1',
          type: 'deworming',
          key: 'DEWORM_2026-07-01',
          family: 'Deworming',
          category: 'core',
          name: 'Deworming',
          dueDate: '2026-07-01',
          completedDate: null,
          status: 'overdue',
          recurrenceType: 'none',
          cadence: 'monthly',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ];

    const updated = engine.recalculatePlanOnEvent({
      records,
      event: {
        type: 'completion',
        recordId: records[1]!.id,
        completedDate: '2026-07-10',
      },
      contextNowDate: '2026-07-11',
    });

    const june = updated.find(r => r.id === records[0]!.id);
    expect(june?.status).toBe('skipped');
    expect(june?.skipReason).toBe('superseded_by_completion');
  });

  it('skip_dose realigns future deworming from last completion and DOB', () => {
    const records: SmartHealthRecord[] = [
        {
          id: 'p1-deworming-DEWORM_2026-05-01-2026-05-01',
          userId: 'u1',
          petId: 'p1',
          type: 'deworming',
          key: 'DEWORM_2026-05-01',
          family: 'Deworming',
          category: 'core',
          name: 'Deworming',
          dueDate: '2026-05-01',
          completedDate: '2026-05-01',
          status: 'completed',
          recurrenceType: 'none',
          cadence: 'monthly',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'p1-deworming-DEWORM_2026-06-01-2026-06-01',
          userId: 'u1',
          petId: 'p1',
          type: 'deworming',
          key: 'DEWORM_2026-06-01',
          family: 'Deworming',
          category: 'core',
          name: 'Deworming',
          dueDate: '2026-06-01',
          completedDate: null,
          status: 'overdue',
          recurrenceType: 'none',
          cadence: 'monthly',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'p1-deworming-DEWORM_2026-07-01-2026-07-01',
          userId: 'u1',
          petId: 'p1',
          type: 'deworming',
          key: 'DEWORM_2026-07-01',
          family: 'Deworming',
          category: 'core',
          name: 'Deworming',
          dueDate: '2026-07-01',
          completedDate: null,
          status: 'upcoming',
          recurrenceType: 'none',
          cadence: 'monthly',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ];

    const updated = engine.recalculatePlanOnEvent({
      records,
      event: {
        type: 'skip_dose',
        recordId: records[1]!.id,
        reason: 'Vet rescheduled',
      },
      contextNowDate: '2026-07-15',
      petDateOfBirth: '2026-01-01',
    });

    const skipped = updated.find(r => r.id === records[1]!.id);
    expect(skipped?.status).toBe('skipped');
    const july = updated.find(r => r.id === records[2]!.id);
    expect(july?.dueDate).toBe('2026-08-01');
  });
});
