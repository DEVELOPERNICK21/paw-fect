import { getTodayIsoDateLocal } from '../../../shared/utils/calendarDate';
import type { DailyCareBlock } from './models/DailyCareBlock';
import type {
  PetAgeStage,
  PetCoatType,
  PetEnergyLevel,
  PetProfile,
  PetSchedulePreferences,
  PetSize,
  PetSpecies,
} from './models/PetProfile';
import type { WeeklyGroomingBlock } from './models/WeeklyGroomingSchedule';
import {
  addMinutes,
  clampHhMm,
  compareHhMm,
  dayOfMonthFromIsoDate,
  earlierHhMm,
  laterHhMm,
  monthsBetweenIsoDates,
  subtractMinutes,
  weekdayFromIsoDate,
} from './utils/scheduleTime';

export const DEFAULT_PET_SCHEDULE_PREFERENCES: PetSchedulePreferences = {
  ownerWakeTime: '07:00',
  ownerSleepTime: '22:30',
  ownerWorkHours: null,
  hasDogWalker: false,
  feedingPortionGrams: null,
  feedingType: 'mixed',
};

export interface FeedingConfig {
  mealsPerDay: number;
  mealTimes: string[];
  portionDescription: string;
}

export interface WalkSlot {
  time: string;
  durationMinutes: number;
}

export interface WalkConfig {
  morningWalk: WalkSlot;
  middayWalk: WalkSlot | null;
  afternoonWalk: WalkSlot;
  eveningPotty: WalkSlot;
  nightPotty: WalkSlot;
}

export interface PlayBlock {
  time: string;
  durationMinutes: number;
  title: string;
  description: string;
}

export interface HealthCheckBlock {
  frequency: DailyCareBlock['frequency'];
  weekday?: number;
  dayOfMonth?: number;
  task: string;
  reminderTime: string;
}

interface BuildBlockInput {
  pet: PetProfile;
  date: string;
  category: DailyCareBlock['category'];
  title: string;
  description: string;
  scheduledTime: string;
  durationMinutes: number;
  frequency: DailyCareBlock['frequency'];
  frequencyDays?: number;
  weekday?: number;
  notificationTitle: string;
  notificationBody: string;
  isFreeFeature: boolean;
  order: number;
}

const DOG_WEEKLY_GROOMING_DEFAULTS = {
  earCheck: { weekday: 1, label: 'Monday' },
  teethBrush1: { weekday: 1, label: 'Monday' },
  teethBrush2: { weekday: 3, label: 'Wednesday' },
  teethBrush3: { weekday: 5, label: 'Friday' },
  coatBrushShort: { weekday: 0, label: 'Sunday' },
  coatBrushLong: { weekdays: [1, 3, 5], label: 'Mon/Wed/Fri' },
  nailCheck: { weekday: 0, label: 'Sunday' },
} as const;

const CAT_WEEKLY_GROOMING_DEFAULTS = {
  coatBrushShort: { weekday: 3, label: 'Wednesday' },
  teethBrush1: { weekday: 1, label: 'Monday' },
  teethBrush2: { weekday: 3, label: 'Wednesday' },
  teethBrush3: { weekday: 5, label: 'Friday' },
  hairballCheck: { weekday: 0, label: 'Sunday' },
} as const;

function normalizePreferences(
  prefs: PetSchedulePreferences | null | undefined,
): PetSchedulePreferences {
  if (!prefs) {
    return DEFAULT_PET_SCHEDULE_PREFERENCES;
  }
  return {
    ...DEFAULT_PET_SCHEDULE_PREFERENCES,
    ...prefs,
    ownerWorkHours: prefs.ownerWorkHours ?? null,
  };
}

function buildPortionDescription(prefs: PetSchedulePreferences): string {
  if (prefs.feedingPortionGrams != null) {
    if (prefs.feedingType === 'wet') {
      return `${prefs.feedingPortionGrams}g wet food + fresh water`;
    }
    if (prefs.feedingType === 'dry') {
      return `${prefs.feedingPortionGrams}g dry food + fresh water`;
    }
    return `${prefs.feedingPortionGrams}g measured food + fresh water`;
  }
  if (prefs.feedingType === 'wet') {
    return 'measured wet food + fresh water top-up';
  }
  if (prefs.feedingType === 'dry') {
    return 'measured dry food + fresh water top-up';
  }
  return 'measured wet + dry food + fresh water top-up';
}

export function buildCareBlockId(
  petId: string,
  date: string,
  category: DailyCareBlock['category'],
  order: number,
  scheduledTime: string,
): string {
  return `${petId}:${date}:${category}:${order}:${scheduledTime}`;
}

function buildCareBlock(input: BuildBlockInput): DailyCareBlock {
  return {
    id: buildCareBlockId(
      input.pet.id,
      input.date,
      input.category,
      input.order,
      input.scheduledTime,
    ),
    petId: input.pet.id,
    category: input.category,
    title: input.title,
    description: input.description,
    scheduledTime: input.scheduledTime,
    durationMinutes: input.durationMinutes,
    frequency: input.frequency,
    frequencyDays: input.frequencyDays,
    weekday: input.weekday,
    reminderEnabled: true,
    reminderMinutesBefore: 0,
    notificationTitle: input.notificationTitle,
    notificationBody: input.notificationBody,
    isCompleted: false,
    completedAt: null,
    isFreeFeature: input.isFreeFeature,
    order: input.order,
  };
}

function feedGapAfterWalkMinutes(size: PetSize | undefined): number {
  if (size === 'large' || size === 'giant') {
    return 60;
  }
  return 30;
}

function latestDinnerTime(sleepTime: string): string {
  return subtractMinutes(sleepTime, 120);
}

function spreadMealTimes(
  firstMeal: string,
  mealsPerDay: number,
  sleepTime: string,
): string[] {
  if (mealsPerDay <= 1) {
    return [firstMeal];
  }
  if (mealsPerDay === 2) {
    const dinnerTarget = addMinutes(firstMeal, 11 * 60);
    const dinner = clampHhMm(
      dinnerTarget,
      addMinutes(firstMeal, 10 * 60),
      latestDinnerTime(sleepTime),
    );
    return [firstMeal, dinner];
  }

  const latestMeal = latestDinnerTime(sleepTime);
  const intervalMinutes =
    mealsPerDay === 4 ? 4 * 60 : Math.floor((11 * 60) / (mealsPerDay - 1));
  const times = [firstMeal];
  for (let index = 1; index < mealsPerDay; index += 1) {
    const next = addMinutes(times[index - 1], intervalMinutes);
    if (compareHhMm(next, latestMeal) > 0) {
      break;
    }
    times.push(next);
  }
  return times;
}

/**
 * Determines the pet's life stage from DOB.
 * Used to adjust feeding frequency, walk duration, play intensity.
 */
export function resolvePetAgeStage(
  dob: string,
  species: PetSpecies,
  today: string = getTodayIsoDateLocal(),
): PetAgeStage {
  const ageMonths = monthsBetweenIsoDates(dob, today);

  if (species === 'dog') {
    if (ageMonths < 12) {
      return 'puppy';
    }
    if (ageMonths < 24) {
      return 'junior';
    }
    if (ageMonths < 84) {
      return 'adult';
    }
    return 'senior';
  }

  if (ageMonths < 12) {
    return 'puppy';
  }
  if (ageMonths < 24) {
    return 'junior';
  }
  if (ageMonths < 120) {
    return 'adult';
  }
  return 'senior';
}

/**
 * Returns vet-recommended feeding config for the pet's age stage.
 */
export function resolveFeedingConfig(
  stage: PetAgeStage,
  species: PetSpecies,
  prefs: PetSchedulePreferences,
  size?: PetSize,
): FeedingConfig {
  const portionDescription = buildPortionDescription(prefs);
  const breakfastOffset =
    species === 'cat' ? 15 : feedGapAfterWalkMinutes(size);
  const firstMeal = addMinutes(prefs.ownerWakeTime, breakfastOffset);

  if (species === 'dog') {
    const mealsPerDay =
      stage === 'puppy' ? 4 : stage === 'senior' ? 2 : 2;
    return {
      mealsPerDay,
      mealTimes: spreadMealTimes(firstMeal, mealsPerDay, prefs.ownerSleepTime),
      portionDescription,
    };
  }

  const mealsPerDay =
    stage === 'puppy' ? 4 : stage === 'senior' ? 3 : 2;
  if (stage === 'adult' || stage === 'junior') {
    return {
      mealsPerDay,
      mealTimes: [firstMeal, '17:00'],
      portionDescription,
    };
  }
  if (stage === 'senior') {
    return {
      mealsPerDay,
      mealTimes: [firstMeal, '12:30', '17:00'],
      portionDescription,
    };
  }
  return {
    mealsPerDay,
    mealTimes: spreadMealTimes(firstMeal, mealsPerDay, prefs.ownerSleepTime),
    portionDescription,
  };
}

/**
 * Walk duration by age stage + energy level (dogs only).
 */
export function resolveWalkConfig(
  stage: PetAgeStage,
  size: PetSize | undefined,
  energyLevel: PetEnergyLevel,
  prefs: PetSchedulePreferences,
  dob: string,
  date: string,
): WalkConfig {
  const ageMonths = monthsBetweenIsoDates(dob, date);
  const puppyWalkMinutes = Math.max(5, Math.min(30, ageMonths * 5));
  const morningTime = prefs.ownerWakeTime;
  const nightPottyTime = subtractMinutes(prefs.ownerSleepTime, 30);

  if (stage === 'puppy') {
    return {
      morningWalk: { time: morningTime, durationMinutes: puppyWalkMinutes },
      middayWalk: { time: '12:00', durationMinutes: 10 },
      afternoonWalk: { time: '16:30', durationMinutes: puppyWalkMinutes },
      eveningPotty: { time: '19:15', durationMinutes: 10 },
      nightPotty: { time: nightPottyTime, durationMinutes: 10 },
    };
  }

  if (stage === 'senior') {
    return {
      morningWalk: { time: morningTime, durationMinutes: 15 },
      middayWalk: prefs.ownerWorkHours
        ? { time: '12:00', durationMinutes: 10 }
        : { time: '12:00', durationMinutes: 15 },
      afternoonWalk: { time: '16:30', durationMinutes: 20 },
      eveningPotty: { time: '19:15', durationMinutes: 10 },
      nightPotty: { time: nightPottyTime, durationMinutes: 10 },
    };
  }

  const morningDuration =
    energyLevel === 'high' ? 30 : stage === 'junior' ? 20 : 20;
  const afternoonDuration =
    energyLevel === 'high' ? 60 : stage === 'junior' ? 35 : 40;
  const workEnd = prefs.ownerWorkHours?.end;
  const afternoonTime = workEnd
    ? earlierHhMm(addMinutes(workEnd, 30), '16:30')
    : '16:30';
  const middayTime =
    prefs.ownerWorkHours != null
      ? laterHhMm(addMinutes(prefs.ownerWorkHours.start, 150), '12:00')
      : '12:00';

  return {
    morningWalk: { time: morningTime, durationMinutes: morningDuration },
    middayWalk: {
      time: middayTime,
      durationMinutes: energyLevel === 'high' ? 20 : 15,
    },
    afternoonWalk: { time: afternoonTime, durationMinutes: afternoonDuration },
    eveningPotty: {
      time: addMinutes(afternoonTime, afternoonDuration + 45),
      durationMinutes: 10,
    },
    nightPotty: { time: nightPottyTime, durationMinutes: 10 },
  };
}

/**
 * Play / enrichment config for cats and dogs.
 */
export function resolvePlayConfig(
  stage: PetAgeStage,
  species: PetSpecies,
  energyLevel: PetEnergyLevel,
  prefs: PetSchedulePreferences,
): PlayBlock[] {
  if (species === 'cat') {
    const morningDuration = stage === 'puppy' ? 10 : 8;
    const afternoonDuration = stage === 'puppy' ? 12 : 15;
    return [
      {
        time: prefs.ownerWakeTime,
        durationMinutes: morningDuration,
        title: 'Play session (hunt simulation)',
        description:
          '5–10 min wand or feather play before breakfast. Mimic hunt → eat → groom → sleep.',
      },
      {
        time: '16:30',
        durationMinutes: afternoonDuration,
        title: 'Play session 2 (hunt simulation)',
        description:
          '10–15 min interactive play before dinner. End with a physical toy, not laser only.',
      },
    ];
  }

  const middayTime =
    prefs.ownerWorkHours != null
      ? laterHhMm(addMinutes(prefs.ownerWorkHours.start, 150), '12:00')
      : '12:00';
  const blocks: PlayBlock[] = [
    {
      time: middayTime,
      durationMinutes: energyLevel === 'high' ? 15 : 10,
      title: 'Midday play + enrichment',
      description:
        '10–15 min fetch, tug, or puzzle feeder. Reserve part of meal kibble for training treats.',
    },
  ];

  if (stage === 'puppy') {
    blocks.unshift({
      time: addMinutes(prefs.ownerWakeTime, 10),
      durationMinutes: 8,
      title: 'Morning play burst',
      description:
        'Short 5–10 min play after potty. Puppies tire quickly — keep sessions brief.',
    });
  }

  return blocks;
}

/**
 * Weekly grooming reminders by species and coat type.
 */
export function resolveGroomingSchedule(
  species: PetSpecies,
  coatType: PetCoatType,
  stage: PetAgeStage,
  prefs: PetSchedulePreferences,
  petId: string,
): WeeklyGroomingBlock[] {
  const reminderTime = subtractMinutes(prefs.ownerSleepTime, 150);
  const blocks: WeeklyGroomingBlock[] = [];

  if (species === 'dog') {
    blocks.push({
      petId,
      weekday: DOG_WEEKLY_GROOMING_DEFAULTS.earCheck.weekday,
      task: 'Ear check',
      species,
      reminderTime,
    });
    blocks.push(
      {
        petId,
        weekday: DOG_WEEKLY_GROOMING_DEFAULTS.teethBrush1.weekday,
        task: 'Teeth brush',
        species,
        reminderTime,
      },
      {
        petId,
        weekday: DOG_WEEKLY_GROOMING_DEFAULTS.teethBrush2.weekday,
        task: 'Teeth brush',
        species,
        reminderTime,
      },
      {
        petId,
        weekday: DOG_WEEKLY_GROOMING_DEFAULTS.teethBrush3.weekday,
        task: 'Teeth brush',
        species,
        reminderTime,
      },
    );

    if (coatType === 'short') {
      blocks.push({
        petId,
        weekday: DOG_WEEKLY_GROOMING_DEFAULTS.coatBrushShort.weekday,
        task: 'Coat brush',
        species,
        reminderTime,
      });
    } else if (coatType === 'double') {
      for (let weekday = 0; weekday < 7; weekday += 1) {
        blocks.push({
          petId,
          weekday,
          task: 'Coat brush',
          species,
          reminderTime,
        });
      }
    } else {
      for (const weekday of DOG_WEEKLY_GROOMING_DEFAULTS.coatBrushLong.weekdays) {
        blocks.push({
          petId,
          weekday,
          task: 'Coat brush',
          species,
          reminderTime,
        });
      }
    }

    if (stage === 'senior') {
      blocks.push({
        petId,
        weekday: 1,
        task: 'Joint mobility check',
        species,
        reminderTime,
      });
    }

    return blocks;
  }

  blocks.push(
    {
      petId,
      weekday: CAT_WEEKLY_GROOMING_DEFAULTS.teethBrush1.weekday,
      task: 'Teeth brush',
      species,
      reminderTime,
    },
    {
      petId,
      weekday: CAT_WEEKLY_GROOMING_DEFAULTS.teethBrush2.weekday,
      task: 'Teeth brush',
      species,
      reminderTime,
    },
    {
      petId,
      weekday: CAT_WEEKLY_GROOMING_DEFAULTS.teethBrush3.weekday,
      task: 'Teeth brush',
      species,
      reminderTime,
    },
    {
      petId,
      weekday: CAT_WEEKLY_GROOMING_DEFAULTS.hairballCheck.weekday,
      task: 'Hairball check',
      species,
      reminderTime,
    },
  );

  if (coatType === 'long' || coatType === 'double') {
    for (let weekday = 0; weekday < 7; weekday += 1) {
      blocks.push({
        petId,
        weekday,
        task: 'Coat brush',
        species,
        reminderTime,
      });
    }
  } else {
    blocks.push({
      petId,
      weekday: CAT_WEEKLY_GROOMING_DEFAULTS.coatBrushShort.weekday,
      task: 'Coat brush',
      species,
      reminderTime,
    });
  }

  blocks.push({
    petId,
    weekday: 1,
    task: 'Ear check',
    species,
    reminderTime,
  });

  return blocks;
}

/**
 * Daily, weekly, and monthly health-check prompts.
 */
export function resolveHealthCheckSchedule(
  species: PetSpecies,
  stage: PetAgeStage,
): HealthCheckBlock[] {
  const blocks: HealthCheckBlock[] = [
    {
      frequency: 'daily',
      task: 'Daily quick health check',
      reminderTime: '20:00',
    },
    {
      frequency: 'weekly',
      weekday: 1,
      task: 'Weekly body and coat check',
      reminderTime: '20:00',
    },
    {
      frequency: 'monthly',
      dayOfMonth: 1,
      task: 'Monthly teeth and parasite check',
      reminderTime: '20:00',
    },
  ];

  if (species === 'cat') {
    blocks.push({
      frequency: 'monthly',
      dayOfMonth: 1,
      task: 'Monthly ear check',
      reminderTime: '20:00',
    });
  }

  if (species === 'dog' && stage === 'senior') {
    blocks.push({
      frequency: 'weekly',
      weekday: 1,
      task: 'Joint mobility check',
      reminderTime: '20:00',
    });
  }

  return blocks;
}

function groomingToBlock(
  grooming: WeeklyGroomingBlock,
  pet: PetProfile,
  date: string,
  order: number,
): DailyCareBlock {
  return buildCareBlock({
    pet,
    date,
    category: 'grooming',
    title: grooming.task,
    description: `Evening grooming reminder for ${pet.name}.`,
    scheduledTime: grooming.reminderTime,
    durationMinutes: 15,
    frequency: grooming.task === 'Ear check' && pet.species === 'cat' ? 'monthly' : 'weekly',
    weekday: grooming.weekday,
    notificationTitle: `${pet.name}'s Grooming Time 🧴`,
    notificationBody: `${grooming.task} for ${pet.name}`,
    isFreeFeature: false,
    order,
  });
}

function healthCheckToBlock(
  health: HealthCheckBlock,
  pet: PetProfile,
  date: string,
  order: number,
): DailyCareBlock {
  return buildCareBlock({
    pet,
    date,
    category: 'health_check',
    title: health.task,
    description: `Quick awareness check for ${pet.name}: appetite, energy, coat, eyes, and ears.`,
    scheduledTime: health.reminderTime,
    durationMinutes: 5,
    frequency: health.frequency,
    weekday: health.weekday,
    notificationTitle: `${pet.name}'s Health Check 🩺`,
    notificationBody: health.task,
    isFreeFeature: false,
    order,
  });
}

/** India-oriented walk copy for heat (Apr–Jun) and monsoon (Jul–Sep). */
export function resolveIndiaWalkSeasonNote(date: string): string | null {
  const month = Number(date.slice(5, 7));
  if (month >= 4 && month <= 6) {
    return 'Hot season: avoid midday pavement — walk early morning or after sunset; test the road with your hand.';
  }
  if (month >= 7 && month <= 9) {
    return 'Monsoon: prefer early morning or evening walks; skip flooded roads and keep sessions shorter if humid.';
  }
  return null;
}

function withSeasonWalkNote(base: string, date: string): string {
  const note = resolveIndiaWalkSeasonNote(date);
  return note ? `${base} ${note}` : base;
}

function buildDogBlocks(
  pet: PetProfile,
  prefs: PetSchedulePreferences,
  stage: PetAgeStage,
  feeding: FeedingConfig,
  walks: WalkConfig,
  playBlocks: PlayBlock[],
  date: string,
): DailyCareBlock[] {
  const blocks: DailyCareBlock[] = [];
  const breakfastTime = addMinutes(
    walks.morningWalk.time,
    feedGapAfterWalkMinutes(pet.size),
  );
  const mealTimes = spreadMealTimes(
    breakfastTime,
    feeding.mealsPerDay,
    prefs.ownerSleepTime,
  );
  const dinnerTime = mealTimes[mealTimes.length - 1] ?? addMinutes(breakfastTime, 11 * 60);
  const trainingTime = addMinutes(
    walks.afternoonWalk.time,
    walks.afternoonWalk.durationMinutes + 30,
  );
  const groomingTime = addMinutes(dinnerTime, 60);
  const eveningPottyTime = addMinutes(dinnerTime, 45);
  const bedtimeTime = prefs.ownerSleepTime;

  const morningWalkBase =
    stage === 'senior'
      ? 'Gentle pace — let them sniff at their own speed.'
      : 'First potty break after waking. 15–20 min minimum with sniff time.';
  const mainWalkBase =
    stage === 'senior'
      ? 'Gentle pace — let them lead. No jogging or jumping.'
      : 'Longest walk of the day. Avoid hot pavement in summer.';

  blocks.push(
    buildCareBlock({
      pet,
      date,
      category: 'walk',
      title: 'Morning walk + potty break',
      description: withSeasonWalkNote(morningWalkBase, date),
      scheduledTime: walks.morningWalk.time,
      durationMinutes: walks.morningWalk.durationMinutes,
      frequency: 'daily',
      notificationTitle: `${pet.name}'s Walk Time 🐾`,
      notificationBody: `Morning walk for ${pet.name}`,
      isFreeFeature: true,
      order: 10,
    }),
  );

  for (const play of playBlocks.filter(
    item => compareHhMm(item.time, breakfastTime) < 0,
  )) {
    blocks.push(
      buildCareBlock({
        pet,
        date,
        category: 'play',
        title: play.title,
        description: play.description,
        scheduledTime: play.time,
        durationMinutes: play.durationMinutes,
        frequency: 'daily',
        notificationTitle: `Playtime for ${pet.name} 🎾`,
        notificationBody: play.description,
        isFreeFeature: stage !== 'puppy',
        order: 15,
      }),
    );
  }

  feeding.mealTimes.forEach((_, index) => {
    const mealTime = mealTimes[index] ?? breakfastTime;
    const mealLabel =
      feeding.mealsPerDay > 2
        ? `Meal ${index + 1} of ${feeding.mealsPerDay}`
        : index === 0
          ? 'Breakfast'
          : 'Dinner';
    blocks.push(
      buildCareBlock({
        pet,
        date,
        category: 'feeding',
        title: `${mealLabel}`,
        description:
          index === 0
            ? `Wait ${feedGapAfterWalkMinutes(pet.size)} min after walk before feeding. ${feeding.portionDescription}`
            : feeding.portionDescription,
        scheduledTime: mealTime,
        durationMinutes: 15,
        frequency: 'daily',
        notificationTitle: `${pet.name}'s Meal Time 🍽️`,
        notificationBody: `${mealLabel} for ${pet.name} — ${feeding.portionDescription}`,
        isFreeFeature: true,
        order: 20 + index,
      }),
    );

    if (stage === 'puppy') {
      blocks.push(
        buildCareBlock({
          pet,
          date,
          category: 'potty',
          title: 'Post-meal potty break',
          description: 'Potty break within 15 minutes after each meal.',
          scheduledTime: addMinutes(mealTime, 15),
          durationMinutes: 5,
          frequency: 'daily',
          notificationTitle: `${pet.name}'s Potty Break`,
          notificationBody: `Quick potty break for ${pet.name}`,
          isFreeFeature: true,
          order: 25 + index,
        }),
      );
    }
  });

  if (walks.middayWalk) {
    const middayDescription = prefs.hasDogWalker
      ? 'Midday potty + play. Dog walker scheduled for this window.'
      : 'Midday potty + play. Dogs should not hold longer than 4–6 hours.';
    blocks.push(
      buildCareBlock({
        pet,
        date,
        category: prefs.hasDogWalker ? 'potty' : 'play',
        title: 'Midday potty + play',
        description: middayDescription,
        scheduledTime: walks.middayWalk.time,
        durationMinutes: walks.middayWalk.durationMinutes,
        frequency: 'daily',
        notificationTitle: `${pet.name}'s Potty Break`,
        notificationBody: `Midday potty break for ${pet.name}`,
        isFreeFeature: true,
        order: 40,
      }),
    );
  }

  blocks.push(
    buildCareBlock({
      pet,
      date,
      category: 'walk',
      title: 'Main exercise walk',
      description: withSeasonWalkNote(mainWalkBase, date),
      scheduledTime: walks.afternoonWalk.time,
      durationMinutes: walks.afternoonWalk.durationMinutes,
      frequency: 'daily',
      notificationTitle: `${pet.name}'s Walk Time 🐾`,
      notificationBody: `Afternoon walk for ${pet.name}`,
      isFreeFeature: true,
      order: 50,
    }),
    buildCareBlock({
      pet,
      date,
      category: 'training',
      title: 'Training + puzzle feeder',
      description:
        '5–10 min commands using reserved kibble after the afternoon walk settles.',
      scheduledTime: trainingTime,
      durationMinutes: 10,
      frequency: 'daily',
      notificationTitle: `Training Time for ${pet.name} 🎓`,
      notificationBody: `5 min commands + reserved kibble treats for ${pet.name}`,
      isFreeFeature: false,
      order: 55,
    }),
    buildCareBlock({
      pet,
      date,
      category: 'potty',
      title: 'Evening potty walk',
      description: 'Short calm walk after dinner for digestion — not vigorous exercise.',
      scheduledTime: eveningPottyTime,
      durationMinutes: walks.eveningPotty.durationMinutes,
      frequency: 'daily',
      notificationTitle: `${pet.name}'s Potty Break`,
      notificationBody: `Evening potty break for ${pet.name}`,
      isFreeFeature: true,
      order: 70,
    }),
    buildCareBlock({
      pet,
      date,
      category: 'grooming',
      title: 'Bonding + grooming + health check',
      description:
        'Brushing, teeth, ear checks, and calm bonding during evening wind-down.',
      scheduledTime: groomingTime,
      durationMinutes: 30,
      frequency: 'daily',
      notificationTitle: `${pet.name}'s Grooming Time 🧴`,
      notificationBody: `Brushing + quick health check for ${pet.name}`,
      isFreeFeature: false,
      order: 80,
    }),
    buildCareBlock({
      pet,
      date,
      category: 'potty',
      title: 'Final night potty break',
      description: 'Last potty break before bed.',
      scheduledTime: walks.nightPotty.time,
      durationMinutes: walks.nightPotty.durationMinutes,
      frequency: 'daily',
      notificationTitle: `${pet.name}'s Potty Break`,
      notificationBody: `Last potty break for ${pet.name} before bed 🌙`,
      isFreeFeature: true,
      order: 90,
    }),
    buildCareBlock({
      pet,
      date,
      category: 'bedtime',
      title: 'Bedtime',
      description: 'Quiet, cozy bedtime routine.',
      scheduledTime: bedtimeTime,
      durationMinutes: 15,
      frequency: 'daily',
      notificationTitle: `Bedtime for ${pet.name} 🌙`,
      notificationBody: `Lights out for ${pet.name}`,
      isFreeFeature: true,
      order: 100,
    }),
  );

  return blocks;
}

function buildCatBlocks(
  pet: PetProfile,
  prefs: PetSchedulePreferences,
  stage: PetAgeStage,
  feeding: FeedingConfig,
  playBlocks: PlayBlock[],
  date: string,
): DailyCareBlock[] {
  const blocks: DailyCareBlock[] = [];
  const breakfastTime = feeding.mealTimes[0] ?? addMinutes(prefs.ownerWakeTime, 15);
  const dinnerTime =
    feeding.mealTimes[feeding.mealTimes.length - 1] ?? '17:00';
  const windDownTime = subtractMinutes(prefs.ownerSleepTime, 90);
  const finalLitterTime = subtractMinutes(prefs.ownerSleepTime, 30);
  const bedtimeTime = prefs.ownerSleepTime;

  const morningPlay = playBlocks[0];
  const afternoonPlay = playBlocks[1];

  blocks.push(
    buildCareBlock({
      pet,
      date,
      category: 'play',
      title: morningPlay.title,
      description: morningPlay.description,
      scheduledTime: morningPlay.time,
      durationMinutes: morningPlay.durationMinutes,
      frequency: 'daily',
      notificationTitle: `Playtime for ${pet.name} 🎾`,
      notificationBody: `Morning play time for ${pet.name} — then breakfast!`,
      isFreeFeature: true,
      order: 10,
    }),
    buildCareBlock({
      pet,
      date,
      category: 'feeding',
      title: 'Breakfast',
      description: `${feeding.portionDescription}. Play always comes before food.`,
      scheduledTime: breakfastTime,
      durationMinutes: 15,
      frequency: 'daily',
      notificationTitle: `${pet.name}'s Meal Time 🍽️`,
      notificationBody: `${pet.name}'s breakfast — ${feeding.portionDescription}`,
      isFreeFeature: true,
      order: 20,
    }),
    buildCareBlock({
      pet,
      date,
      category: 'rest',
      title: 'Rest + self-grooming',
      description:
        'Leave undisturbed while they nap and groom. Cats sleep 12–16 hours per day.',
      scheduledTime: addMinutes(breakfastTime, 30),
      durationMinutes: 180,
      frequency: 'daily',
      notificationTitle: `Rest Time for ${pet.name} 😴`,
      notificationBody: `Leave ${pet.name} undisturbed — rest is essential`,
      isFreeFeature: true,
      order: 30,
    }),
    buildCareBlock({
      pet,
      date,
      category: 'litter',
      title: 'Midday litter scoop',
      description: 'Scoop litter midday. Cats refuse dirty litter boxes.',
      scheduledTime: '12:00',
      durationMinutes: 5,
      frequency: 'daily',
      notificationTitle: `${pet.name}'s Litter Box 🧹`,
      notificationBody: `Midday litter scoop for ${pet.name}`,
      isFreeFeature: true,
      order: 40,
    }),
    buildCareBlock({
      pet,
      date,
      category: 'play',
      title: afternoonPlay.title,
      description: afternoonPlay.description,
      scheduledTime: afternoonPlay.time,
      durationMinutes: afternoonPlay.durationMinutes,
      frequency: 'daily',
      notificationTitle: `Playtime for ${pet.name} 🎾`,
      notificationBody: `Afternoon play time for ${pet.name} before dinner 🐾`,
      isFreeFeature: true,
      order: 50,
    }),
    buildCareBlock({
      pet,
      date,
      category: 'feeding',
      title: 'Dinner',
      description: `${feeding.portionDescription}. Keep dinner before bedtime wind-down.`,
      scheduledTime: dinnerTime,
      durationMinutes: 15,
      frequency: 'daily',
      notificationTitle: `${pet.name}'s Meal Time 🍽️`,
      notificationBody: `${pet.name}'s dinner time 🐱`,
      isFreeFeature: true,
      order: 60,
    }),
    buildCareBlock({
      pet,
      date,
      category: 'litter',
      title: 'Evening litter scoop',
      description: 'Scoop litter after dinner.',
      scheduledTime: '19:00',
      durationMinutes: 5,
      frequency: 'daily',
      notificationTitle: `${pet.name}'s Litter Box 🧹`,
      notificationBody: `Evening litter scoop for ${pet.name}`,
      isFreeFeature: true,
      order: 70,
    }),
    buildCareBlock({
      pet,
      date,
      category: 'grooming',
      title: 'Grooming + bonding + health check',
      description:
        'Brush after meal when calm. Check coat, eyes, ears, and hairballs.',
      scheduledTime: '20:00',
      durationMinutes: 20,
      frequency: 'daily',
      notificationTitle: `${pet.name}'s Grooming Time 🧴`,
      notificationBody: `Brushing + quick health check for ${pet.name}`,
      isFreeFeature: false,
      order: 80,
    }),
    buildCareBlock({
      pet,
      date,
      category: 'rest',
      title: 'Bedtime wind-down',
      description:
        'No stimulating play near bedtime. Quiet companionship only.',
      scheduledTime: windDownTime,
      durationMinutes: 30,
      frequency: 'daily',
      notificationTitle: `Rest Time for ${pet.name} 😴`,
      notificationBody: `Wind-down time for ${pet.name}`,
      isFreeFeature: true,
      order: 90,
    }),
    buildCareBlock({
      pet,
      date,
      category: 'litter',
      title: 'Final litter scoop',
      description: 'Final litter scoop before lights out.',
      scheduledTime: finalLitterTime,
      durationMinutes: 5,
      frequency: 'daily',
      notificationTitle: `${pet.name}'s Litter Box 🧹`,
      notificationBody: `Final litter scoop + lights out for ${pet.name} 🌙`,
      isFreeFeature: true,
      order: 95,
    }),
    buildCareBlock({
      pet,
      date,
      category: 'bedtime',
      title: 'Bedtime',
      description: 'Quiet, cozy bedtime routine.',
      scheduledTime: bedtimeTime,
      durationMinutes: 15,
      frequency: 'daily',
      notificationTitle: `Bedtime for ${pet.name} 🌙`,
      notificationBody: `Lights out for ${pet.name}`,
      isFreeFeature: true,
      order: 100,
    }),
  );

  if (stage === 'puppy') {
    blocks.splice(3, 0, buildCareBlock({
      pet,
      date,
      category: 'litter',
      title: 'Extra litter scoop',
      description: 'Kittens need litter scooped 2–3 times daily.',
      scheduledTime: addMinutes(breakfastTime, 120),
      durationMinutes: 5,
      frequency: 'daily',
      notificationTitle: `${pet.name}'s Litter Box 🧹`,
      notificationBody: `Extra litter scoop for ${pet.name}`,
      isFreeFeature: true,
      order: 35,
    }));
  }

  return blocks;
}

/**
 * Main function — call this to generate the full daily schedule.
 */
export function generateDailySchedule(
  pet: PetProfile,
  prefs: PetSchedulePreferences | null | undefined,
  date: string,
): DailyCareBlock[] {
  const resolvedPrefs = normalizePreferences(prefs);
  const stage = resolvePetAgeStage(pet.dob, pet.species, date);
  const feeding = resolveFeedingConfig(
    stage,
    pet.species,
    resolvedPrefs,
    pet.size,
  );
  const play = resolvePlayConfig(stage, pet.species, pet.energyLevel, resolvedPrefs);
  const grooming = resolveGroomingSchedule(
    pet.species,
    pet.coatType ?? 'short',
    stage,
    resolvedPrefs,
    pet.id,
  );
  const health = resolveHealthCheckSchedule(pet.species, stage);
  const walks =
    pet.species === 'dog'
      ? resolveWalkConfig(
          stage,
          pet.size,
          pet.energyLevel,
          resolvedPrefs,
          pet.dob,
          date,
        )
      : null;

  const blocks: DailyCareBlock[] =
    pet.species === 'dog' && walks
      ? buildDogBlocks(pet, resolvedPrefs, stage, feeding, walks, play, date)
      : buildCatBlocks(pet, resolvedPrefs, stage, feeding, play, date);

  const weekday = weekdayFromIsoDate(date);
  const dayOfMonth = dayOfMonthFromIsoDate(date);

  grooming
    .filter(item => item.weekday === weekday)
    .filter(item => item.task !== 'Ear check' || pet.species === 'dog' || dayOfMonth === 1)
    .forEach((item, index) => {
      blocks.push(groomingToBlock(item, pet, date, 200 + index));
    });

  health
    .filter(item => {
      if (item.frequency === 'daily') {
        return true;
      }
      if (item.frequency === 'weekly') {
        return item.weekday === weekday;
      }
      if (item.frequency === 'monthly') {
        return item.dayOfMonth === dayOfMonth;
      }
      return false;
    })
    .forEach((item, index) => {
      blocks.push(healthCheckToBlock(item, pet, date, 300 + index));
    });

  return blocks.sort((left, right) => {
    const byTime = left.scheduledTime.localeCompare(right.scheduledTime);
    if (byTime !== 0) {
      return byTime;
    }
    return left.order - right.order;
  });
}
