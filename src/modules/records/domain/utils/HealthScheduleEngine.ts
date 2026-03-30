import type {
  HealthSchedule,
  HealthScheduleCompletion,
  TaskUrgency,
} from '../models/HealthSchedule';
import {
  getDewormingFrequency,
  getVaccinationFrequency,
  getTemplatesForPetType,
} from '../models/HealthScheduleTemplates';
import type { PetType } from '../../../pets/domain/models/Pet';

/**
 * Scheduling Engine - Core logic for health schedule management
 */
export class HealthScheduleEngine {
  /**
   * Calculate pet age in weeks from birth date
   */
  static calculateAgeInWeeks(birthDate?: string): number | undefined {
    if (!birthDate) return undefined;

    const birth = new Date(birthDate);
    const now = new Date();
    const diffMs = now.getTime() - birth.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return Math.floor(diffDays / 7);
  }

  /**
   * Check if pet is considered young (< 12 weeks)
   */
  static isYoungPet(ageInWeeks?: number): boolean {
    return (ageInWeeks ?? 0) < 12;
  }

  /**
   * Add days to a date string
   */
  static addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get today's date string
   */
  static getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Calculate days until due
   */
  static getDaysUntilDue(dueDate: string): number {
    const today = this.getTodayString();
    const due = new Date(dueDate);
    const todayDate = new Date(today);
    const diffMs = due.getTime() - todayDate.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Determine urgency level based on due date
   */
  static getUrgency(dueDate: string, status: string): TaskUrgency {
    if (status === 'completed') return 'completed';
    if (status === 'skipped') return 'upcoming';

    const daysUntil = this.getDaysUntilDue(dueDate);

    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 7) return 'due_soon';
    return 'upcoming';
  }

  /**
   * Generate initial health schedules for a new pet
   */
  static generateInitialSchedules(
    petId: string,
    petType: PetType,
    birthDate?: string,
  ): HealthSchedule[] {
    const ageInWeeks = this.calculateAgeInWeeks(birthDate);
    const today = this.getTodayString();
    const schedules: HealthSchedule[] = [];

    // 1. Create Deworming Schedule
    const dewormingFrequency = getDewormingFrequency(ageInWeeks);
    const dewormingDueDate = this.addDays(today, dewormingFrequency);

    schedules.push({
      id: `deworming-${petId}-${Date.now()}`,
      petId,
      taskType: 'deworming',
      taskName: 'Deworming',
      frequencyDays: dewormingFrequency,
      nextDueDate: dewormingDueDate,
      status: 'pending',
      isEnabled: true,
      isPartOfSeries: false,
      seriesCompletedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending',
      localUpdatedAt: new Date().toISOString(),
    });

    // 2. Create Vaccination Schedules based on pet type
    const templates = getTemplatesForPetType(petType);

    for (const template of templates) {
      const frequency = getVaccinationFrequency(template, ageInWeeks);
      const dueDate = this.addDays(today, frequency);
      const isYoung = this.isYoungPet(ageInWeeks);

      // If pet is young (< 6 months) and it's a series vaccine, generate upcoming doses
      const shouldGenerateSeries =
        isYoung && template.isSeries && template.totalDoses;

      schedules.push({
        id: `${template.id}-${petId}-${Date.now()}`,
        petId,
        taskType: 'vaccination',
        taskName: template.taskName,
        vaccineType: template.vaccineType,
        frequencyDays: frequency,
        nextDueDate: dueDate,
        status: 'pending',
        isEnabled: true,
        isPartOfSeries: template.isSeries,
        seriesOrder: shouldGenerateSeries ? 1 : undefined,
        totalSeriesDoses: template.totalDoses,
        seriesCompletedCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending',
        localUpdatedAt: new Date().toISOString(),
      });
    }

    return schedules;
  }

  /**
   * Mark a schedule as completed and calculate next due date
   */
  static completeTask(
    schedule: HealthSchedule,
    completedDate?: string,
  ): { updatedSchedule: HealthSchedule; completion: HealthScheduleCompletion } {
    const today = completedDate ?? this.getTodayString();
    const nextDueDate = this.addDays(today, schedule.frequencyDays);

    const updatedSchedule: HealthSchedule = {
      ...schedule,
      lastCompletedDate: today,
      nextDueDate,
      status: 'pending',
      seriesCompletedCount: schedule.seriesCompletedCount + 1,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending',
      localUpdatedAt: new Date().toISOString(),
    };

    const completion: HealthScheduleCompletion = {
      id: `completion-${Date.now()}`,
      scheduleId: schedule.id,
      petId: schedule.petId,
      completedDate: today,
      nextDueDate,
      createdAt: new Date().toISOString(),
      syncStatus: 'pending',
    };

    return { updatedSchedule, completion };
  }

  /**
   * Skip a task (e.g., user marks as not needed)
   */
  static skipTask(schedule: HealthSchedule): HealthSchedule {
    return {
      ...schedule,
      status: 'skipped',
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending',
      localUpdatedAt: new Date().toISOString(),
    };
  }

  /**
   * Update schedule status based on current date
   */
  static updateScheduleStatus(schedule: HealthSchedule): HealthSchedule {
    if (schedule.status === 'completed' || schedule.status === 'skipped') {
      return schedule;
    }

    const daysUntil = this.getDaysUntilDue(schedule.nextDueDate);
    let newStatus = schedule.status;

    if (daysUntil < 0) {
      newStatus = 'overdue';
    } else if (schedule.status === 'overdue' && daysUntil >= 0) {
      newStatus = 'pending';
    }

    if (newStatus !== schedule.status) {
      return {
        ...schedule,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending',
        localUpdatedAt: new Date().toISOString(),
      };
    }

    return schedule;
  }

  /**
   * Update schedule frequency
   */
  static updateFrequency(
    schedule: HealthSchedule,
    newFrequencyDays: number,
  ): HealthSchedule {
    const newDueDate = this.addDays(
      schedule.lastCompletedDate ?? this.getTodayString(),
      newFrequencyDays,
    );

    return {
      ...schedule,
      frequencyDays: newFrequencyDays,
      nextDueDate: newDueDate,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending',
      localUpdatedAt: new Date().toISOString(),
    };
  }

  /**
   * Reschedule to a specific date
   */
  static reschedule(
    schedule: HealthSchedule,
    newDueDate: string,
  ): HealthSchedule {
    return {
      ...schedule,
      nextDueDate: newDueDate,
      status: 'pending',
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending',
      localUpdatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get tasks due today
   */
  static getTasksDueToday(schedules: HealthSchedule[]): HealthSchedule[] {
    const today = this.getTodayString();
    return schedules.filter(
      s => s.isEnabled && s.status !== 'completed' && s.nextDueDate === today,
    );
  }

  /**
   * Get overdue tasks
   */
  static getOverdueTasks(schedules: HealthSchedule[]): HealthSchedule[] {
    const today = this.getTodayString();
    return schedules.filter(
      s => s.isEnabled && s.status !== 'completed' && s.nextDueDate < today,
    );
  }

  /**
   * Get upcoming tasks (next 30 days)
   */
  static getUpcomingTasks(schedules: HealthSchedule[]): HealthSchedule[] {
    const today = this.getTodayString();
    const thirtyDaysLater = this.addDays(today, 30);

    return schedules.filter(
      s =>
        s.isEnabled &&
        s.status !== 'completed' &&
        s.nextDueDate > today &&
        s.nextDueDate <= thirtyDaysLater,
    );
  }

  /**
   * Format urgency for display
   */
  static formatUrgencyDisplay(
    urgency: TaskUrgency,
    daysUntil?: number,
  ): string {
    switch (urgency) {
      case 'overdue':
        return `Overdue by ${Math.abs(daysUntil ?? 0)} days`;
      case 'due_soon':
        return `Due in ${daysUntil ?? 0} days`;
      case 'upcoming':
        return `Next in ${daysUntil ?? 0} days`;
      case 'completed':
        return 'Completed';
      default:
        return '';
    }
  }

  /**
   * Get color for urgency level
   */
  static getUrgencyColor(urgency: TaskUrgency): string {
    switch (urgency) {
      case 'overdue':
        return '#DC2626'; // Red
      case 'due_soon':
        return '#F59E0B'; // Yellow/Amber
      case 'upcoming':
        return '#10B981'; // Green
      case 'completed':
        return '#6B7280'; // Gray
      default:
        return '#6B7280';
    }
  }
}
