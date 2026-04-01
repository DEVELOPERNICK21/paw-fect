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
        type: 'late_completion',
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
    expect(dhpp.some(r => r.name === 'DHPP (Start Vaccination)')).toBe(true);
    expect(dhpp.some(r => r.name === 'DHPP (Follow-up Dose)')).toBe(true);
    expect(dhpp.some(r => r.name.includes('(1st)'))).toBe(false);
    const rabiesNow = records.find(r => r.key === 'RABIES_1');
    expect(rabiesNow?.dueDate).toBe('2026-04-01');
  });
});
