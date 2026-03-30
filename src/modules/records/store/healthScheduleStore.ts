import { create } from 'zustand';
import type {
  HealthSchedule,
  HealthScheduleCompletion,
} from '../domain/models/HealthSchedule';
import { HealthScheduleEngine } from '../domain/utils/HealthScheduleEngine';
import type { PetType } from '../../pets/domain/models/Pet';

export interface HealthScheduleState {
  schedules: HealthSchedule[];
  completions: HealthScheduleCompletion[];
  loading: boolean;
  error: string | null;

  // Actions
  loadSchedules: () => Promise<void>;
  loadSchedulesForPet: (petId: string) => HealthSchedule[];
  initializeSchedulesForPet: (
    petId: string,
    petType: PetType,
    birthDate?: string,
  ) => Promise<void>;
  completeSchedule: (
    scheduleId: string,
    completedDate?: string,
  ) => Promise<void>;
  skipSchedule: (scheduleId: string) => Promise<void>;
  updateFrequency: (scheduleId: string, frequencyDays: number) => Promise<void>;
  reschedule: (scheduleId: string, newDueDate: string) => Promise<void>;
  toggleScheduleEnabled: (scheduleId: string) => Promise<void>;
  deleteSchedulesForPet: (petId: string) => Promise<void>;

  // Queries
  getOverdueTasks: () => HealthSchedule[];
  getTodayTasks: () => HealthSchedule[];
  getUpcomingTasks: () => HealthSchedule[];
  getTasksByPet: (petId: string) => HealthSchedule[];
}

// In-memory storage for React Native (offline-first)
// TODO: Replace with MMKV or AsyncStorage for persistence
const memoryStorage: {
  schedules: HealthSchedule[];
  completions: HealthScheduleCompletion[];
} = {
  schedules: [],
  completions: [],
};

export const useHealthScheduleStore = create<HealthScheduleState>(set => ({
  schedules: memoryStorage.schedules,
  completions: memoryStorage.completions,
  loading: false,
  error: null,

  loadSchedules: async () => {
    set({ loading: true, error: null });
    try {
      // Update status based on current date
      const updatedSchedules = memoryStorage.schedules.map(s =>
        HealthScheduleEngine.updateScheduleStatus(s),
      );
      memoryStorage.schedules = updatedSchedules;
      set({ schedules: [...memoryStorage.schedules], loading: false });
    } catch (error) {
      set({ error: 'Failed to load schedules', loading: false });
    }
  },

  loadSchedulesForPet: (petId: string) => {
    return memoryStorage.schedules.filter(s => s.petId === petId);
  },

  initializeSchedulesForPet: async (petId, petType, birthDate) => {
    set({ loading: true, error: null });
    try {
      // Check if pet already has schedules
      const existingPetSchedules = memoryStorage.schedules.filter(
        s => s.petId === petId,
      );
      if (existingPetSchedules.length > 0) {
        set({ loading: false });
        return;
      }

      // Generate initial schedules
      const newSchedules = HealthScheduleEngine.generateInitialSchedules(
        petId,
        petType,
        birthDate,
      );

      memoryStorage.schedules = [...memoryStorage.schedules, ...newSchedules];
      set({ schedules: [...memoryStorage.schedules], loading: false });
    } catch (error) {
      set({ error: 'Failed to initialize schedules', loading: false });
    }
  },

  completeSchedule: async (scheduleId, completedDate) => {
    set({ loading: true, error: null });
    try {
      const scheduleIndex = memoryStorage.schedules.findIndex(
        s => s.id === scheduleId,
      );
      if (scheduleIndex === -1) {
        set({ error: 'Schedule not found', loading: false });
        return;
      }

      const schedule = memoryStorage.schedules[scheduleIndex];
      const { updatedSchedule, completion } = HealthScheduleEngine.completeTask(
        schedule,
        completedDate,
      );

      memoryStorage.schedules[scheduleIndex] = updatedSchedule;
      memoryStorage.completions = [...memoryStorage.completions, completion];

      set({
        schedules: [...memoryStorage.schedules],
        completions: [...memoryStorage.completions],
        loading: false,
      });
    } catch (error) {
      set({ error: 'Failed to complete schedule', loading: false });
    }
  },

  skipSchedule: async scheduleId => {
    set({ loading: true, error: null });
    try {
      const scheduleIndex = memoryStorage.schedules.findIndex(
        s => s.id === scheduleId,
      );
      if (scheduleIndex === -1) {
        set({ error: 'Schedule not found', loading: false });
        return;
      }

      const updatedSchedule = HealthScheduleEngine.skipTask(
        memoryStorage.schedules[scheduleIndex],
      );
      memoryStorage.schedules[scheduleIndex] = updatedSchedule;

      set({ schedules: [...memoryStorage.schedules], loading: false });
    } catch (error) {
      set({ error: 'Failed to skip schedule', loading: false });
    }
  },

  updateFrequency: async (scheduleId, frequencyDays) => {
    set({ loading: true, error: null });
    try {
      const scheduleIndex = memoryStorage.schedules.findIndex(
        s => s.id === scheduleId,
      );
      if (scheduleIndex === -1) {
        set({ error: 'Schedule not found', loading: false });
        return;
      }

      if (frequencyDays <= 0) {
        set({ error: 'Frequency must be greater than 0', loading: false });
        return;
      }

      const updatedSchedule = HealthScheduleEngine.updateFrequency(
        memoryStorage.schedules[scheduleIndex],
        frequencyDays,
      );

      memoryStorage.schedules[scheduleIndex] = updatedSchedule;
      set({ schedules: [...memoryStorage.schedules], loading: false });
    } catch (error) {
      set({ error: 'Failed to update frequency', loading: false });
    }
  },

  reschedule: async (scheduleId, newDueDate) => {
    set({ loading: true, error: null });
    try {
      const scheduleIndex = memoryStorage.schedules.findIndex(
        s => s.id === scheduleId,
      );
      if (scheduleIndex === -1) {
        set({ error: 'Schedule not found', loading: false });
        return;
      }

      const updatedSchedule = HealthScheduleEngine.reschedule(
        memoryStorage.schedules[scheduleIndex],
        newDueDate,
      );

      memoryStorage.schedules[scheduleIndex] = updatedSchedule;
      set({ schedules: [...memoryStorage.schedules], loading: false });
    } catch (error) {
      set({ error: 'Failed to reschedule', loading: false });
    }
  },

  toggleScheduleEnabled: async scheduleId => {
    set({ loading: true, error: null });
    try {
      const scheduleIndex = memoryStorage.schedules.findIndex(
        s => s.id === scheduleId,
      );
      if (scheduleIndex === -1) {
        set({ error: 'Schedule not found', loading: false });
        return;
      }

      const schedule = memoryStorage.schedules[scheduleIndex];
      const updatedSchedule: HealthSchedule = {
        ...schedule,
        isEnabled: !schedule.isEnabled,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending',
        localUpdatedAt: new Date().toISOString(),
      };

      memoryStorage.schedules[scheduleIndex] = updatedSchedule;
      set({ schedules: [...memoryStorage.schedules], loading: false });
    } catch (error) {
      set({ error: 'Failed to toggle schedule', loading: false });
    }
  },

  deleteSchedulesForPet: async petId => {
    set({ loading: true, error: null });
    try {
      memoryStorage.schedules = memoryStorage.schedules.filter(
        s => s.petId !== petId,
      );
      memoryStorage.completions = memoryStorage.completions.filter(
        c => c.petId !== petId,
      );

      set({
        schedules: [...memoryStorage.schedules],
        completions: [...memoryStorage.completions],
        loading: false,
      });
    } catch (error) {
      set({ error: 'Failed to delete schedules', loading: false });
    }
  },

  // Queries
  getOverdueTasks: () => {
    return HealthScheduleEngine.getOverdueTasks(memoryStorage.schedules);
  },

  getTodayTasks: () => {
    return HealthScheduleEngine.getTasksDueToday(memoryStorage.schedules);
  },

  getUpcomingTasks: () => {
    return HealthScheduleEngine.getUpcomingTasks(memoryStorage.schedules);
  },

  getTasksByPet: petId => {
    return memoryStorage.schedules.filter(s => s.petId === petId);
  },
}));
