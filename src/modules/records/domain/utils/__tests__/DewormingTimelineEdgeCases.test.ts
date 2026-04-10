import type { SmartHealthRecord } from '../../models/SmartHealthRecord';
import { PetCareLifecycleEngine } from '../PetCareLifecycleEngine';
import {
  generateBootstrapSchedule,
  normalizeSmartRecordStatus,
} from '../SmartHealthScheduleUtils';

/**
 * Scenario matrix (manual trace): engine + normalization are SSOT after load.
 * See PetCareLifecycleEngine tests for detailed date assertions.
 */
describe('DewormingTimelineEdgeCases (matrix)', () => {
  const engine = new PetCareLifecycleEngine();

  const scenarios: Array<{
    name: string;
    run: () => void;
  }> = [
    {
      name: 'Puppy DOB — bootstrap yields deworming rows from engine',
      run: () => {
        const { records } = generateBootstrapSchedule({
          userId: 'u',
          petId: 'p',
          petType: 'dog',
          dateOfBirth: '2026-03-26',
          region: 'OTHER',
          lifestyleType: 'indoor',
          lifestyleRiskLevel: 'low',
        });
        const d = records.filter(r => r.type === 'deworming');
        expect(d.length).toBeGreaterThan(0);
      },
    },
    {
      name: 'Pet ~2 months old — milestones include bi-weekly cadence window',
      run: () => {
        const { records } = generateBootstrapSchedule({
          userId: 'u',
          petId: 'p',
          petType: 'dog',
          dateOfBirth: '2026-02-10',
          region: 'OTHER',
          lifestyleType: 'indoor',
          lifestyleRiskLevel: 'low',
        });
        const d = records.filter(r => r.type === 'deworming' && r.cadence);
        expect(d.length).toBeGreaterThan(1);
      },
    },
    {
      name: 'Adult 1y no vax history — catch-up plus deworming rows',
      run: () => {
        const { records } = generateBootstrapSchedule({
          userId: 'u',
          petId: 'p',
          petType: 'dog',
          dateOfBirth: '2025-01-01',
          region: 'IN',
          lifestyleType: 'indoor',
          lifestyleRiskLevel: 'low',
        });
        expect(records.some(r => r.name.includes('Start'))).toBe(true);
        expect(records.some(r => r.type === 'deworming')).toBe(true);
      },
    },
    {
      name: 'Missed 3 doses — open rows normalize to overdue on load',
      run: () => {
        const past: SmartHealthRecord[] = [
          {
            id: 'd1',
            userId: 'u',
            petId: 'p',
            type: 'deworming',
            name: 'Deworming',
            dueDate: '2026-01-01',
            completedDate: null,
            status: 'upcoming',
            recurrenceType: 'none',
            cadence: 'monthly',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'd2',
            userId: 'u',
            petId: 'p',
            type: 'deworming',
            name: 'Deworming',
            dueDate: '2026-02-01',
            completedDate: null,
            status: 'upcoming',
            recurrenceType: 'none',
            cadence: 'monthly',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'd3',
            userId: 'u',
            petId: 'p',
            type: 'deworming',
            name: 'Deworming',
            dueDate: '2026-03-01',
            completedDate: null,
            status: 'upcoming',
            recurrenceType: 'none',
            cadence: 'monthly',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ];
        const today = '2026-04-10';
        const n = past.map(r => normalizeSmartRecordStatus(r, today));
        expect(n.every(r => r.status === 'overdue')).toBe(true);
      },
    },
    {
      name: 'Late completion — future deworming shifts from completedDate',
      run: () => {
        const records = engine.generateInitialPlan({
          userId: 'u',
          petId: 'p',
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
        const u = engine.recalculatePlanOnEvent({
          records,
          event: {
            type: 'completion',
            recordId: next!.id,
            completedDate: '2026-04-20',
          },
          contextNowDate: '2026-04-21',
        });
        const future = u
          .filter(
            r =>
              r.type === 'deworming' &&
              r.status !== 'completed' &&
              r.dueDate > '2026-04-20',
          )
          .map(r => r.dueDate);
        expect(future.length).toBeGreaterThan(0);
      },
    },
    {
      name: 'Early completion — chain steps from actual completion date',
      run: () => {
        const records = engine.generateInitialPlan({
          userId: 'u',
          petId: 'p',
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
        const u = engine.recalculatePlanOnEvent({
          records,
          event: {
            type: 'completion',
            recordId: next!.id,
            completedDate: '2026-04-07',
          },
          contextNowDate: '2026-04-09',
        });
        const after = u.find(
          r =>
            r.type === 'deworming' &&
            r.status !== 'completed' &&
            r.dueDate > '2026-04-07',
        );
        expect(after?.dueDate).toBeTruthy();
      },
    },
    {
      name: 'Manual skip — target becomes skipped terminal',
      run: () => {
        const row: SmartHealthRecord = {
          id: 's1',
          userId: 'u',
          petId: 'p',
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
        };
        const u = engine.recalculatePlanOnEvent({
          records: [row],
          event: {
            type: 'skip_dose',
            recordId: row.id,
            reason: 'No product at home',
            petDateOfBirth: '2026-01-01',
          },
          contextNowDate: '2026-07-01',
          petDateOfBirth: '2026-01-01',
        });
        expect(u.find(r => r.id === row.id)?.status).toBe('skipped');
      },
    },
    {
      name: 'App inactive 30d — overdue derived on normalize, skipped frozen',
      run: () => {
        const skipped: SmartHealthRecord = {
          id: 'sk',
          userId: 'u',
          petId: 'p',
          type: 'deworming',
          name: 'Deworming',
          dueDate: '2026-01-01',
          completedDate: null,
          status: 'skipped',
          skipReason: 'user',
          recurrenceType: 'none',
          cadence: 'monthly',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        };
        expect(normalizeSmartRecordStatus(skipped, '2026-12-01').status).toBe(
          'skipped',
        );
      },
    },
    {
      name: 'Multi-pet isolation — events only touch matching petId in slice',
      run: () => {
        const a: SmartHealthRecord = {
          id: 'pa-d',
          userId: 'u',
          petId: 'pa',
          type: 'deworming',
          name: 'Deworming',
          dueDate: '2026-06-01',
          completedDate: null,
          status: 'upcoming',
          recurrenceType: 'none',
          cadence: 'monthly',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        };
        const b: SmartHealthRecord = {
          ...a,
          id: 'pb-d',
          petId: 'pb',
        };
        const u = engine.recalculatePlanOnEvent({
          records: [a, b],
          event: {
            type: 'completion',
            recordId: a.id,
            completedDate: '2026-06-01',
          },
          contextNowDate: '2026-06-02',
        });
        expect(u.find(r => r.id === b.id)?.status).toBe('upcoming');
      },
    },
  ];

  it.each(scenarios)('$name', ({ run }) => {
    run();
  });
});
