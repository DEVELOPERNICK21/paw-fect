import {
  DEFAULT_PET_SCHEDULE_PREFERENCES,
  generateDailySchedule,
  resolveFeedingConfig,
  resolveIndiaWalkSeasonNote,
  resolvePetAgeStage,
} from '../DailyScheduleEngine';
import type { PetProfile, PetSchedulePreferences } from '../models/PetProfile';

const adultDog: PetProfile = {
  id: 'pet-dog-1',
  name: 'Buddy',
  dob: '2020-01-01',
  species: 'dog',
  breed: 'Labrador Retriever',
  size: 'large',
  lifestyle: 'mixed',
  energyLevel: 'medium',
  coatType: 'short',
};

const adultCat: PetProfile = {
  id: 'pet-cat-1',
  name: 'Luna',
  dob: '2020-01-01',
  species: 'cat',
  breed: 'British Shorthair',
  lifestyle: 'indoor',
  energyLevel: 'medium',
  coatType: 'short',
};

function findByTitle(blocks: ReturnType<typeof generateDailySchedule>, title: string) {
  return blocks.find(block => block.title === title);
}

function findByCategory(
  blocks: ReturnType<typeof generateDailySchedule>,
  category: string,
) {
  return blocks.filter(block => block.category === category);
}

function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

describe('DailyScheduleEngine', () => {
  it('[SCH-01] schedules an adult working-owner dog day in order', () => {
    const prefs: PetSchedulePreferences = {
      ...DEFAULT_PET_SCHEDULE_PREFERENCES,
      ownerWakeTime: '06:30',
      ownerSleepTime: '22:30',
      ownerWorkHours: { start: '09:00', end: '18:00' },
    };
    const blocks = generateDailySchedule(
      { ...adultDog, size: 'medium' },
      prefs,
      '2026-05-12',
    );

    expect(findByTitle(blocks, 'Morning walk + potty break')?.scheduledTime).toBe('06:30');
    expect(findByTitle(blocks, 'Breakfast')?.scheduledTime).toBe('07:00');
    expect(findByTitle(blocks, 'Midday potty + play')?.scheduledTime).toBe('12:00');
    expect(findByTitle(blocks, 'Main exercise walk')?.scheduledTime).toBe('16:30');
    const dinner = findByTitle(blocks, 'Dinner');
    expect(dinner).toBeDefined();
    expect(dinner?.scheduledTime >= '17:30' && dinner?.scheduledTime <= '18:30').toBe(true);
    expect(findByTitle(blocks, 'Final night potty break')?.scheduledTime).toBe('22:00');
    expect(blocks[blocks.length - 1].category).toBe('bedtime');
    expect(blocks[blocks.length - 2].title).toBe('Final night potty break');
  });

  it('[SCH-02] enforces a 60-minute gap between walk and meal for large dogs', () => {
    const blocks = generateDailySchedule(
      { ...adultDog, size: 'large' },
      { ...DEFAULT_PET_SCHEDULE_PREFERENCES, ownerWakeTime: '06:30' },
      '2026-05-12',
    );
    const walk = findByTitle(blocks, 'Morning walk + potty break');
    const breakfast = findByTitle(blocks, 'Breakfast');
    expect(walk).toBeDefined();
    expect(breakfast).toBeDefined();
    expect(minutesBetween(walk!.scheduledTime, breakfast!.scheduledTime)).toBe(60);
  });

  it('[SCH-03] schedules puppy meals, short walks, and post-meal potty breaks', () => {
    const puppy: PetProfile = {
      ...adultDog,
      dob: '2026-02-12',
    };
    const blocks = generateDailySchedule(
      puppy,
      { ...DEFAULT_PET_SCHEDULE_PREFERENCES, ownerWakeTime: '07:00' },
      '2026-05-12',
    );
    const meals = findByCategory(blocks, 'feeding');
    expect(meals.length).toBeGreaterThanOrEqual(3);
    expect(findByTitle(blocks, 'Morning walk + potty break')?.durationMinutes).toBe(15);
    expect(findByCategory(blocks, 'potty').some(block => block.title === 'Post-meal potty break')).toBe(
      true,
    );
  });

  it('[SCH-04] shortens senior dog walks and adds joint care on Mondays', () => {
    const senior: PetProfile = {
      ...adultDog,
      dob: '2016-01-01',
    };
    const blocks = generateDailySchedule(
      senior,
      DEFAULT_PET_SCHEDULE_PREFERENCES,
      '2026-05-11',
    );
    expect(findByTitle(blocks, 'Morning walk + potty break')?.durationMinutes).toBe(15);
    expect(findByTitle(blocks, 'Main exercise walk')?.durationMinutes).toBe(20);
    expect(findByTitle(blocks, 'Main exercise walk')?.description).toContain('Gentle pace');
    expect(blocks.some(block => block.title === 'Joint mobility check')).toBe(true);
  });

  it('[SCH-05] keeps cat play before meals and away from bedtime', () => {
    const blocks = generateDailySchedule(
      adultCat,
      { ...DEFAULT_PET_SCHEDULE_PREFERENCES, ownerWakeTime: '07:00', ownerSleepTime: '22:30' },
      '2026-05-12',
    );
    const morningPlay = findByTitle(blocks, 'Play session (hunt simulation)');
    const breakfast = findByTitle(blocks, 'Breakfast');
    const afternoonPlay = findByTitle(blocks, 'Play session 2 (hunt simulation)');
    const dinner = findByTitle(blocks, 'Dinner');
    expect(morningPlay?.scheduledTime).toBe('07:00');
    expect(breakfast?.scheduledTime).toBe('07:15');
    expect(afternoonPlay?.scheduledTime).toBe('16:30');
    expect(dinner?.scheduledTime).toBe('17:00');
    expect(findByTitle(blocks, 'Bedtime wind-down')?.scheduledTime).toBe('21:00');
  });

  it('[SCH-06] keeps every cat play block before the next meal', () => {
    const blocks = generateDailySchedule(adultCat, DEFAULT_PET_SCHEDULE_PREFERENCES, '2026-05-12');
    const playBlocks = findByCategory(blocks, 'play');
    const mealBlocks = findByCategory(blocks, 'feeding');
    for (const play of playBlocks) {
      const nextMeal = mealBlocks.find(meal => meal.scheduledTime > play.scheduledTime);
      expect(nextMeal).toBeDefined();
    }
  });

  it('[SCH-07] keeps a midday dog walk when the owner is home all day', () => {
    const blocks = generateDailySchedule(
      adultDog,
      { ...DEFAULT_PET_SCHEDULE_PREFERENCES, ownerWorkHours: null },
      '2026-05-12',
    );
    expect(findByTitle(blocks, 'Midday potty + play')).toBeDefined();
  });

  it('[SCH-08] keeps midday coverage when a dog walker is booked', () => {
    const blocks = generateDailySchedule(
      adultDog,
      { ...DEFAULT_PET_SCHEDULE_PREFERENCES, hasDogWalker: true },
      '2026-05-12',
    );
    const midday = findByTitle(blocks, 'Midday potty + play');
    expect(midday).toBeDefined();
    expect(midday?.description).toContain('Dog walker');
  });

  it('[SCH-09] only surfaces grooming tasks on their assigned weekday', () => {
    const monday = generateDailySchedule(adultDog, DEFAULT_PET_SCHEDULE_PREFERENCES, '2026-05-11');
    const tuesday = generateDailySchedule(adultDog, DEFAULT_PET_SCHEDULE_PREFERENCES, '2026-05-12');
    expect(monday.some(block => block.title === 'Ear check')).toBe(true);
    expect(tuesday.some(block => block.title === 'Ear check')).toBe(false);
  });

  it('[SCH-10] personalizes notification titles with the pet name', () => {
    const blocks = generateDailySchedule(adultCat, DEFAULT_PET_SCHEDULE_PREFERENCES, '2026-05-12');
    const meal = findByCategory(blocks, 'feeding')[0];
    expect(meal.notificationTitle).toBe("Luna's Meal Time 🍽️");
  });

  it('[SCH-11] marks pro-only blocks as locked on the free tier', () => {
    const blocks = generateDailySchedule(adultDog, DEFAULT_PET_SCHEDULE_PREFERENCES, '2026-05-12');
    expect(blocks.some(block => block.isFreeFeature === false)).toBe(true);
  });

  it('[SCH-12] tolerates null preferences and falls back to defaults', () => {
    expect(() => generateDailySchedule(adultDog, null, '2026-05-12')).not.toThrow();
    const blocks = generateDailySchedule(adultDog, null, '2026-05-12');
    expect(blocks.length).toBeGreaterThan(0);
  });

  it('[SCH-13] schedules three meals for a senior cat', () => {
    const seniorCat: PetProfile = {
      ...adultCat,
      dob: '2014-01-01',
    };
    expect(resolvePetAgeStage(seniorCat.dob, 'cat', '2026-05-12')).toBe('senior');
    const feeding = resolveFeedingConfig(
      'senior',
      'cat',
      DEFAULT_PET_SCHEDULE_PREFERENCES,
    );
    expect(feeding.mealsPerDay).toBe(3);
  });

  it('[SCH-14] keeps stable block ids across regenerations', () => {
    const first = generateDailySchedule(adultDog, DEFAULT_PET_SCHEDULE_PREFERENCES, '2026-05-12');
    const second = generateDailySchedule(adultDog, DEFAULT_PET_SCHEDULE_PREFERENCES, '2026-05-12');
    expect(first.map(block => block.id)).toEqual(second.map(block => block.id));
  });

  it('[SCH-15] adds hot-season walk guidance for Apr–Jun', () => {
    expect(resolveIndiaWalkSeasonNote('2026-05-12')).toMatch(/Hot season|pavement/i);
    const blocks = generateDailySchedule(
      adultDog,
      DEFAULT_PET_SCHEDULE_PREFERENCES,
      '2026-05-12',
    );
    expect(findByTitle(blocks, 'Main exercise walk')?.description).toMatch(
      /Hot season|pavement/i,
    );
  });

  it('[SCH-16] adds monsoon walk guidance for Jul–Sep', () => {
    expect(resolveIndiaWalkSeasonNote('2026-08-01')).toMatch(/Monsoon/i);
    const blocks = generateDailySchedule(
      adultDog,
      DEFAULT_PET_SCHEDULE_PREFERENCES,
      '2026-08-01',
    );
    expect(findByTitle(blocks, 'Morning walk + potty break')?.description).toMatch(
      /Monsoon/i,
    );
  });
});
