/**
 * Sample care timeline for the interactive landing-page demo.
 * Content reflects commonly used schedules and is labelled as a sample in the UI;
 * it is not veterinary advice and varies by region and individual pet.
 */
export type DemoSpecies = "dog" | "cat";
export type DemoStage = "baby" | "puppy" | "young" | "adult" | "senior";
export type DemoLifestyle = "indoor" | "outdoor";
export type DemoItemKind = "vaccine" | "deworm" | "checkup" | "care";

export interface DemoItem {
  kind: DemoItemKind;
  title: string;
  when: string;
}

export const DEMO_STAGES: ReadonlyArray<{
  id: DemoStage;
  dog: string;
  cat: string;
  range: string;
}> = [
  { id: "baby", dog: "Newborn puppy", cat: "Newborn kitten", range: "Under 8 weeks" },
  { id: "puppy", dog: "Puppy", cat: "Kitten", range: "2 to 6 months" },
  { id: "young", dog: "Young dog", cat: "Young cat", range: "6 to 12 months" },
  { id: "adult", dog: "Adult dog", cat: "Adult cat", range: "1 to 7 years" },
  { id: "senior", dog: "Senior dog", cat: "Senior cat", range: "7+ years" },
];

const dewormInterval = (lifestyle: DemoLifestyle): string =>
  lifestyle === "outdoor" ? "Every 1 to 3 months" : "Every 3 months";

export function demoPlanFor(
  species: DemoSpecies,
  stage: DemoStage,
  lifestyle: DemoLifestyle,
): DemoItem[] {
  const core = species === "dog" ? "DHPP" : "FVRCP";
  switch (stage) {
    case "baby":
      return [
        { kind: "deworm", title: "Deworming", when: "Every 2 weeks from 2 weeks old" },
        { kind: "vaccine", title: `${core} dose 1`, when: "At 6 to 8 weeks" },
        { kind: "checkup", title: "First vet check", when: "Before the first vaccine" },
        { kind: "care", title: "Weigh-in", when: "Weekly while growing" },
      ];
    case "puppy":
      return [
        { kind: "vaccine", title: `${core} boosters`, when: "Every 3 to 4 weeks until 16 weeks" },
        { kind: "vaccine", title: "Rabies", when: "From 12 weeks (local rules vary)" },
        { kind: "deworm", title: "Deworming", when: "Monthly until 6 months" },
        { kind: "care", title: "Flea and tick check", when: "Monthly" },
      ];
    case "young":
      return [
        { kind: "vaccine", title: `${core} booster`, when: "At about 1 year" },
        { kind: "vaccine", title: "Rabies booster", when: "At about 1 year" },
        { kind: "deworm", title: "Deworming", when: dewormInterval(lifestyle) },
        { kind: "checkup", title: "Wellness visit", when: "Once this year" },
      ];
    case "adult":
      return [
        { kind: "vaccine", title: `${core} and rabies`, when: "Booster as your vet advises" },
        { kind: "deworm", title: "Deworming", when: dewormInterval(lifestyle) },
        { kind: "checkup", title: "Yearly checkup", when: "Every 12 months" },
        { kind: "care", title: "Dental and weight check", when: "Every 6 months" },
      ];
    case "senior":
      return [
        { kind: "checkup", title: "Senior checkup", when: "Every 6 months" },
        { kind: "vaccine", title: "Boosters", when: "As your vet advises" },
        { kind: "deworm", title: "Deworming", when: dewormInterval(lifestyle) },
        { kind: "care", title: "Mobility and weight notes", when: "Monthly" },
      ];
  }
}
