import type { HomeDashboardViewModel } from '../../../modules/app/domain/models/HomeDashboardViewModel';
import type { Pet } from '../../../modules/pets/domain/models/Pet';
import type { DailySchedule } from '../../../modules/schedule/domain/models/DailySchedule';
import { buildWidgetSnapshot } from '../widgetSnapshot';

const pet: Pet = {
  id: 'pet-1',
  userId: 'user-1',
  name: 'Tiger',
  type: 'dog',
  breed: 'Labrador',
  dob: '2020-01-01',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const baseVm: HomeDashboardViewModel = {
  now: '2026-05-16T12:00:00.000Z',
  petsLoading: false,
  remindersLoading: false,
  hasAnyPet: true,
  activePet: pet,
  healthStatusLine: '',
  nextCareMilestoneLine: '',
  nextMilestone: {
    title: 'Rabies Vaccination',
    dueDateYmd: '2026-05-28',
    dueDateLabel: '28 May 2026',
    countdownLabel: 'in 12 days',
    kind: 'vaccination',
  },
  lastActivityLine: '',
  lastLoggedDateLine: '',
  weightLine: '',
  activityLine: '',
  heartLine: '',
  attentionBanner: { show: false, headline: '', subline: '' },
  todayCare: [
    {
      reminder: {
        id: 'r1',
        petId: 'pet-1',
        title: 'Evening walk',
        type: 'other',
        date: '2026-05-16',
        time: '18:00',
        repeat: 'none',
        notes: '',
        notificationId: null,
      },
      showCompletedCheck: false,
    },
  ],
  weekCarePreview: [],
  actionHealthItems: [],
  lastError: null,
  isRefreshing: false,
};

describe('buildWidgetSnapshot', () => {
  it('includes milestone and next up from dashboard', () => {
    const snapshot = buildWidgetSnapshot({ pet, viewModel: baseVm });
    expect(snapshot.petName).toBe('Tiger');
    expect(snapshot.milestone?.title).toBe('Rabies Vaccination');
    expect(snapshot.nextUp?.title).toBe('Evening walk');
    expect(snapshot.tasks).toHaveLength(1);
  });

  it('prefers schedule blocks for next up and care progress', () => {
    const schedule: DailySchedule = {
      petId: 'pet-1',
      date: '2026-05-16',
      completionPercent: 50,
      streakDays: 3,
      wellnessScore: 80,
      blocks: [
        {
          id: 'b1',
          petId: 'pet-1',
          category: 'feeding',
          title: 'Breakfast',
          description: '',
          scheduledTime: '08:00',
          durationMinutes: 15,
          frequency: 'daily',
          reminderEnabled: true,
          reminderMinutesBefore: 0,
          notificationTitle: 'Feed',
          notificationBody: 'Breakfast',
          isCompleted: true,
          completedAt: '2026-05-16T08:05:00.000Z',
          isFreeFeature: true,
          order: 0,
        },
        {
          id: 'b2',
          petId: 'pet-1',
          category: 'walk',
          title: 'Morning walk',
          description: '',
          scheduledTime: '09:30',
          durationMinutes: 30,
          frequency: 'daily',
          reminderEnabled: true,
          reminderMinutesBefore: 0,
          notificationTitle: 'Walk',
          notificationBody: 'Walk',
          isCompleted: false,
          completedAt: null,
          isFreeFeature: true,
          order: 1,
        },
      ],
    };

    const snapshot = buildWidgetSnapshot({ pet, viewModel: baseVm, schedule });
    expect(snapshot.nextUp?.title).toBe('Morning walk');
    expect(snapshot.careProgress).toEqual({
      completed: 1,
      total: 2,
      percent: 50,
    });
  });
});
