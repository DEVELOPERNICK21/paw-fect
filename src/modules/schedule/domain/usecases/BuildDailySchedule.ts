import type { DailySchedule } from '../models/DailySchedule';
import type { DailyCareBlock } from '../models/DailyCareBlock';
import type { PetSchedulePreferences } from '../models/PetProfile';
import type { PetRepository } from '../../../pets/domain/repositories/PetRepository';
import { generateDailySchedule } from '../DailyScheduleEngine';
import type { ScheduleRepository } from '../repositories/ScheduleRepository';
import { getDayCompletion } from '../utils/wellnessCompletion';
import { mapPetToScheduleProfile } from '../utils/mapPetToScheduleProfile';
import { getTodayIsoDateLocal } from '../../../../shared/utils/calendarDate';

export interface BuildDailyScheduleInput {
  userId: string;
  petId: string;
  date?: string;
  /** When false, Pro-only blocks are excluded from completion % (matches Wellness hub). */
  isPro?: boolean;
}

export class BuildDailySchedule {
  constructor(
    private readonly petRepository: PetRepository,
    private readonly scheduleRepository: ScheduleRepository,
  ) {}

  async execute(input: BuildDailyScheduleInput): Promise<DailySchedule | null> {
    const pet = await this.petRepository.getPetById(input.userId, input.petId);
    if (!pet) {
      return null;
    }

    const date = input.date ?? getTodayIsoDateLocal();
    const isPro = input.isPro ?? false;
    const preferences =
      (await this.scheduleRepository.getPreferences(input.userId, input.petId)) ??
      undefined;
    const profile = mapPetToScheduleProfile(pet);
    const generated = generateDailySchedule(profile, preferences ?? null, date);
    const states = await this.scheduleRepository.getBlockStates(
      input.userId,
      input.petId,
      date,
    );

    const blocks: DailyCareBlock[] = generated.map(block => {
      const state = states[block.id];
      return {
        ...block,
        isCompleted: state?.completedAt != null,
        completedAt: state?.completedAt ?? null,
        scheduledTime:
          state?.snoozedUntil != null &&
          state.snoozedUntil.slice(0, 10) === date
            ? state.snoozedUntil.slice(11, 16)
            : block.scheduledTime,
      };
    });

    const completionPercent = getDayCompletion(blocks, isPro).percentage;
    await this.scheduleRepository.saveDailyCompletionPercent(
      input.userId,
      input.petId,
      date,
      completionPercent,
    );

    return {
      petId: input.petId,
      date,
      blocks,
      completionPercent,
      streakDays: this.scheduleRepository.getCareStreakDays(input.petId),
      wellnessScore: await this.computeWellnessScore(
        input.userId,
        input.petId,
        date,
      ),
    };
  }

  private async computeWellnessScore(
    userId: string,
    petId: string,
    date: string,
  ): Promise<number> {
    const dates: string[] = [];
    for (let offset = 0; offset < 7; offset += 1) {
      dates.push(this.shiftDate(date, -offset));
    }
    const byDate = await this.scheduleRepository.getDailyCompletionPercents(
      userId,
      petId,
      dates,
    );
    const scores = dates
      .map(day => byDate[day])
      .filter((value): value is number => value != null);
    if (scores.length === 0) {
      return 0;
    }
    return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
  }

  private shiftDate(date: string, deltaDays: number): string {
    const [year, month, day] = date.split('-').map(Number);
    const next = new Date(year, (month ?? 1) - 1, day ?? 1);
    next.setDate(next.getDate() + deltaDays);
    const pad = (value: number): string => String(value).padStart(2, '0');
    return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
  }
}
