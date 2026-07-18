export type DogJourneyStage = {
  id: string;
  title: string;
  age: string;
  summary: string;
  points: string[];
  emoji: string;
};

export const dogJourneyStages: DogJourneyStage[] = [
  {
    id: "newborn",
    title: "Newborn puppy",
    age: "0-3 months",
    summary: "Foundational immunity, first vaccines, and establishing a healthy baseline.",
    points: [
      "Puppy DP and first DHPP doses",
      "Feeding and growth tracking",
      "Early wellness and vet visits",
    ],
    emoji: "🐶",
  },
  {
    id: "growing",
    title: "Growing puppy",
    age: "3-12 months",
    summary: "Critical booster window and habit-building for lifelong preventive care.",
    points: [
      "DHPP booster series on schedule",
      "Regular deworming cadence",
      "Lifestyle-based risk adjustments",
    ],
    emoji: "🦴",
  },
  {
    id: "young-adult",
    title: "Young adult",
    age: "1-3 years",
    summary: "Steady preventive care as your dog settles into their adult routine.",
    points: [
      "Annual core vaccines",
      "Bordetella and Lyme where relevant",
      "Complete care history in one place",
    ],
    emoji: "🐕",
  },
  {
    id: "adult",
    title: "Adult",
    age: "3-6 years",
    summary: "Reliable maintenance schedules and a full health timeline you can trust.",
    points: [
      "Routine annual boosters",
      "Regular deworming reminders",
      "Vet-ready records and summaries",
    ],
    emoji: "🐕‍🦺",
  },
];
