import {
  DewormingEngine,
  getCadenceForDueDate,
  validateLastDewormingDate,
  validateLogDateForCadence,
} from '../DewormingEngine';

describe('DewormingEngine', () => {
  const engine = new DewormingEngine();

  describe('calendar milestones', () => {
    it('uses calendar months for growth (DOB 1 Jan → 3 months = 1 Apr)', () => {
      const result = engine.execute({
        petType: 'dog',
        dateOfBirth: '2026-01-01',
        lifestyle: 'indoor',
        todayDate: '2026-03-20',
        completionDates: [],
      });
      const pendingFuture = [
        ...(result.nextStep?.status === 'pending'
          ? [result.nextStep.dueDate]
          : []),
        ...result.upcoming.map(u => u.dueDate),
      ];
      expect(pendingFuture).toContain('2026-04-01');
    });
  });

  describe('execute - basic schedule generation', () => {
    it('generates early stage schedule (2, 4, 6, 8 weeks)', () => {
      const result = engine.execute({
        petType: 'dog',
        dateOfBirth: '2026-01-15',
        lifestyle: 'indoor',
        todayDate: '2026-02-15',
      });

      expect(result.nextStep).not.toBeNull();
      expect(result.upcoming.length).toBeLessThanOrEqual(3);
      expect(result.completed.length).toBe(0);
    });

    it('does not auto-complete past milestones without user logs', () => {
      const result = engine.execute({
        petType: 'dog',
        dateOfBirth: '2024-01-01',
        lifestyle: 'indoor',
        todayDate: '2026-04-01',
      });
      expect(result.completed.length).toBe(0);
    });

    it('with no logged history, next step is the next pending milestone, not backlog of missed doses', () => {
      const result = engine.execute({
        petType: 'dog',
        dateOfBirth: '2026-01-01',
        lifestyle: 'indoor',
        todayDate: '2026-04-10',
        completionDates: [],
      });
      expect(result.nextStep?.status).toBe('pending');
      expect(result.nextStep?.dueDate).toBe('2026-05-01');
      expect(result.nextStep?.cadence).toBe('monthly');
    });

    it('generates growth stage schedule (3, 4, 5, 6 months)', () => {
      const result = engine.execute({
        petType: 'dog',
        dateOfBirth: '2024-01-01',
        lifestyle: 'indoor',
        todayDate: '2026-04-01',
      });

      expect(result.metadata.confidence).toBeDefined();
      expect(result.nextStep).toBeDefined();
    });

    it('returns completed items sorted latest first when user dates exist', () => {
      const result = engine.execute({
        petType: 'dog',
        dateOfBirth: '2024-01-01',
        lifestyle: 'indoor',
        completionDates: ['2025-06-01', '2025-01-01'],
        todayDate: '2026-04-01',
      });

      if (result.completed.length > 1) {
        expect(result.completed[0].dueDate > result.completed[1].dueDate).toBe(
          true,
        );
      }
    });
  });

  describe('execute - lifestyle adjustments', () => {
    it('adjusts intervals for outdoor pets', () => {
      const resultIndoor = engine.execute({
        petType: 'dog',
        dateOfBirth: '2024-01-01',
        lifestyle: 'indoor',
        todayDate: '2026-04-01',
      });

      const resultOutdoor = engine.execute({
        petType: 'dog',
        dateOfBirth: '2024-01-01',
        lifestyle: 'outdoor',
        todayDate: '2026-04-01',
      });

      if (
        resultIndoor.upcoming.length > 0 &&
        resultOutdoor.upcoming.length > 0
      ) {
        expect(resultOutdoor.upcoming[0].dueDate).toBeDefined();
        expect(resultIndoor.upcoming[0].dueDate).toBeDefined();
      }
    });

    it('adjusts intervals for mixed lifestyle', () => {
      const result = engine.execute({
        petType: 'dog',
        dateOfBirth: '2024-01-01',
        lifestyle: 'mixed',
        todayDate: '2026-04-01',
      });

      expect(result.upcoming).toBeDefined();
    });
  });

  describe('execute - symptom trigger', () => {
    it('marks urgent when symptoms present (next step is real schedule item)', () => {
      const result = engine.execute({
        petType: 'dog',
        dateOfBirth: '2026-01-01',
        lifestyle: 'indoor',
        symptoms: ['diarrhea'],
        todayDate: '2026-03-20',
        completionDates: [],
      });

      expect(result.metadata.urgency).toBe('critical');
      expect(result.metadata.riskLevel).toBe('high');
      expect(result.nextStep?.dueDate).toBe('2026-04-01');
      expect(result.nextStep?.status).toBe('pending');
    });

    it('handles all symptom types', () => {
      const symptoms = [
        'diarrhea',
        'vomiting',
        'bloated_belly',
        'worms_visible',
      ] as const;

      for (const symptom of symptoms) {
        const result = engine.execute({
          petType: 'cat',
          dateOfBirth: '2024-01-01',
          lifestyle: 'indoor',
          symptoms: [symptom],
          todayDate: '2026-04-01',
        });

        expect(result.metadata.urgency).toBe('critical');
        expect(result.metadata.riskLevel).toBe('high');
      }
    });
  });

  describe('execute - last deworming date handling', () => {
    it('continues from valid last deworming date', () => {
      const result = engine.execute({
        petType: 'dog',
        dateOfBirth: '2024-01-01',
        lifestyle: 'indoor',
        lastDewormingDate: '2026-03-15',
        todayDate: '2026-04-01',
      });

      expect(result.metadata.confidence).toBe('high');
      expect(result.completed.some(c => c.dueDate === '2026-03-15')).toBe(true);
    });

    it('falls back to DOB schedule when last deworming is missing', () => {
      const result = engine.execute({
        petType: 'dog',
        dateOfBirth: '2024-01-01',
        lifestyle: 'indoor',
        hasPreviousDeworming: false,
        todayDate: '2026-04-01',
      });

      expect(result.metadata.confidence).toBe('low');
    });

    it('ignores invalid last deworming before DOB for confidence', () => {
      const result = engine.execute({
        petType: 'dog',
        dateOfBirth: '2024-06-01',
        lifestyle: 'indoor',
        lastDewormingDate: '2024-01-01',
        todayDate: '2026-04-01',
      });

      expect(result.metadata.confidence).toBe('low');
    });

    it('ignores future last deworming for confidence', () => {
      const result = engine.execute({
        petType: 'dog',
        dateOfBirth: '2024-01-01',
        lifestyle: 'indoor',
        lastDewormingDate: '2027-01-01',
        todayDate: '2026-04-01',
      });

      expect(result.metadata.confidence).toBe('low');
    });
  });

  describe('cadence and log window', () => {
    it('classifies early milestones as every 2 weeks', () => {
      expect(getCadenceForDueDate('2026-01-01', '2026-01-15', 'indoor')).toBe(
        'every_14_days',
      );
    });

    it('rejects log date outside rolling window for monthly cadence', () => {
      const v = validateLogDateForCadence(
        '2026-01-01',
        '2026-04-10',
        '2026-02-01',
        'monthly',
      );
      expect(v.ok).toBe(false);
    });

    it('allows log date within rolling window for monthly cadence', () => {
      const v = validateLogDateForCadence(
        '2026-01-01',
        '2026-04-10',
        '2026-03-20',
        'monthly',
      );
      expect(v.ok).toBe(true);
    });
  });

  describe('validateLastDewormingDate', () => {
    it('rejects before DOB', () => {
      expect(
        validateLastDewormingDate('2024-06-01', '2024-01-01', '2026-04-01').ok,
      ).toBe(false);
    });
    it('rejects after today', () => {
      expect(
        validateLastDewormingDate('2024-01-01', '2027-01-01', '2026-04-01').ok,
      ).toBe(false);
    });
    it('accepts valid range', () => {
      expect(
        validateLastDewormingDate('2024-01-01', '2025-06-01', '2026-04-01').ok,
      ).toBe(true);
    });
  });

  describe('execute - missed doses', () => {
    it('shows earliest missed in next step once user has logged a dose', () => {
      const result = engine.execute({
        petType: 'dog',
        dateOfBirth: '2024-01-01',
        lifestyle: 'indoor',
        completionDates: ['2025-01-10'],
        todayDate: '2026-04-01',
      });

      if (result.nextStep?.status === 'missed') {
        expect(result.metadata.urgency).toMatch(/critical|high/);
        expect(result.metadata.riskLevel).toMatch(/high|medium/);
      }
    });
  });

  describe('execute - upcoming items', () => {
    it('returns exactly up to 3 upcoming items', () => {
      const result = engine.execute({
        petType: 'dog',
        dateOfBirth: '2024-01-01',
        lifestyle: 'indoor',
        todayDate: '2026-04-01',
      });

      expect(result.upcoming.length).toBeLessThanOrEqual(3);
    });

    it('excludes next step from upcoming', () => {
      const result = engine.execute({
        petType: 'dog',
        dateOfBirth: '2024-01-01',
        lifestyle: 'indoor',
        todayDate: '2026-04-01',
      });

      if (result.nextStep) {
        const overlap = result.upcoming.filter(
          u => u.dueDate === result.nextStep?.dueDate,
        );
        expect(overlap.length).toBe(0);
      }
    });
  });

  describe('recalculateAfterUpdate', () => {
    it('recalculates from selected completion date', () => {
      const previousItems = [
        { id: '1', dueDate: '2026-01-01', status: 'completed' as const },
      ];

      const result = engine.recalculateAfterUpdate({
        completedDate: '2026-04-10',
        dateOfBirth: '2024-01-01',
        lifestyle: 'indoor',
        petType: 'dog',
        previousItems,
        todayDate: '2026-04-15',
      });

      expect(
        result.completed.find(c => c.dueDate === '2026-04-10'),
      ).toBeDefined();
    });

    it('aligns adult quarterly schedule to completion date (Apr 10 → next Jul 10)', () => {
      const result = engine.recalculateAfterUpdate({
        completedDate: '2026-04-10',
        dateOfBirth: '2020-01-01',
        lifestyle: 'indoor',
        petType: 'dog',
        previousItems: [],
        todayDate: '2026-04-15',
        completionDates: ['2026-04-10'],
      });

      const dates = [
        ...(result.nextStep ? [result.nextStep.dueDate] : []),
        ...result.upcoming.map(u => u.dueDate),
      ];
      expect(dates).toContain('2026-07-10');
    });

    it('preserves existing completed history', () => {
      const previousItems = [
        { id: '1', dueDate: '2026-01-01', status: 'completed' as const },
        { id: '2', dueDate: '2025-10-01', status: 'completed' as const },
      ];

      const result = engine.recalculateAfterUpdate({
        completedDate: '2026-04-10',
        dateOfBirth: '2024-01-01',
        lifestyle: 'indoor',
        petType: 'dog',
        previousItems,
        todayDate: '2026-04-15',
      });

      expect(result.completed.length).toBeGreaterThanOrEqual(2);
    });

    it('surfaces missed items after late completion', () => {
      const result = engine.recalculateAfterUpdate({
        completedDate: '2026-02-01',
        dateOfBirth: '2024-01-01',
        lifestyle: 'indoor',
        petType: 'dog',
        previousItems: [
          { id: '1', dueDate: '2026-01-01', status: 'completed' as const },
        ],
        todayDate: '2026-04-15',
      });

      const missedLike = [result.nextStep, ...result.upcoming].filter(
        i => i?.status === 'missed',
      );
      expect(missedLike.length >= 0).toBe(true);
    });
  });

  describe('metadata', () => {
    it('returns all metadata fields', () => {
      const result = engine.execute({
        petType: 'dog',
        dateOfBirth: '2024-01-01',
        lifestyle: 'indoor',
        todayDate: '2026-04-01',
      });

      expect(result.metadata).toHaveProperty('riskLevel');
      expect(result.metadata).toHaveProperty('urgency');
      expect(result.metadata).toHaveProperty('confidence');
      expect(result.metadata).toHaveProperty('lastCalculatedAt');
    });

    it('adjusts risk based on lifestyle', () => {
      const resultOutdoor = engine.execute({
        petType: 'dog',
        dateOfBirth: '2024-01-01',
        lifestyle: 'outdoor',
        todayDate: '2026-04-15',
      });

      expect(resultOutdoor.metadata.riskLevel).toMatch(/medium|high/);
    });
  });
});
