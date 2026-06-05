import type { ImageSourcePropType } from 'react-native';

import { SHARE_INSTALL_URL } from '../../../../shared/constants/releaseBackend';
import { resolvePetAvatarSource } from '../../../../shared/utils/petDisplayPhoto';
import type { SmartHealthRecord } from '../../../records/domain/models/SmartHealthRecord';
import type { Pet } from '../models/Pet';
import type {
  PetHealthCardHighlight,
  PetHealthCardItem,
  PetHealthCardItemStatus,
  PetHealthCardSnapshot,
  PetHealthCardViewModel,
} from '../models/PetHealthCardViewModel';
import { formatPetAgeShareLabel } from '../utils/petDobDisplay';
import { safeToIsoString } from '../../../../shared/utils/calendarDate';

const SHARE_URL_DISPLAY = 'paw-fect.vercel.app';
const BRAND_LABEL = '🐾 Paw-fect';
const MAX_ITEMS = 3;
const COMPLETED_WINDOW_DAYS = 365;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface BuildPetHealthCardViewModelDeps {
  getPetById: (userId: string, petId: string) => Promise<Pet | null>;
  listSmartHealthRecords: (
    userId: string,
    petId: string,
  ) => Promise<SmartHealthRecord[]>;
  now?: () => Date;
}

export interface BuildPetHealthCardViewModelInput {
  userId: string;
  petId: string;
}

export class BuildPetHealthCardViewModel {
  constructor(private readonly deps: BuildPetHealthCardViewModelDeps) {}

  async execute(
    input: BuildPetHealthCardViewModelInput,
  ): Promise<PetHealthCardViewModel> {
    const now = this.deps.now ? this.deps.now() : new Date();
    const pet = await this.deps.getPetById(input.userId, input.petId);
    if (!pet) {
      throw new Error(`Pet not found: ${input.petId}`);
    }
    const records = await this.deps.listSmartHealthRecords(
      input.userId,
      input.petId,
    );

    const photoSource: ImageSourcePropType = resolvePetAvatarSource({
      type: pet.type,
      photo: pet.photo,
    });

    const breedLabel =
      pet.breed && pet.breed.trim().length > 0 ? pet.breed.trim() : null;
    const ageLabel = formatPetAgeShareLabel(pet.dob, now);
    const species = speciesMeta(pet.type);
    const genderLabel = formatGenderShareLabel(pet.gender);

    const snapshot = buildSnapshot(records, pet.type, now);
    const highlights = buildShareHighlights({
      pet,
      records,
      ageLabel,
      now,
    });
    const glance = highlightsToGlance(highlights);

    return {
      pet: {
        name: pet.name,
        breedLabel,
        ageLabel,
        photoSource,
        speciesEmoji: species.emoji,
        speciesLabel: species.label,
        genderLabel,
      },
      snapshot,
      highlights,
      glance,
      footer: {
        urlLabel: SHARE_URL_DISPLAY,
        brandLabel: BRAND_LABEL,
        shareUrl: SHARE_INSTALL_URL,
      },
    };
  }
}

function buildSnapshot(
  records: SmartHealthRecord[],
  petType: Pet['type'],
  now: Date,
): PetHealthCardSnapshot {
  const upcoming = pickNextUpcoming(records);
  const completed = pickRecentCompleted(records, now);

  if (!upcoming && completed.length === 0) {
    return { kind: 'empty', speciesEmoji: petType === 'cat' ? '🐈' : '🐕' };
  }

  const items: PetHealthCardItem[] = [];
  if (upcoming) {
    items.push(buildUpcomingItem(upcoming, now));
  }
  for (const rec of completed) {
    if (items.length >= MAX_ITEMS) break;
    items.push(buildCompletedItem(rec));
  }

  return { kind: 'items', items: items.slice(0, MAX_ITEMS) };
}

function pickNextUpcoming(
  records: SmartHealthRecord[],
): SmartHealthRecord | null {
  const candidates = records
    .filter(r => r.status === 'upcoming' || r.status === 'overdue')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return candidates[0] ?? null;
}

function pickRecentCompleted(
  records: SmartHealthRecord[],
  now: Date,
): SmartHealthRecord[] {
  const cutoff = new Date(now.getTime() - COMPLETED_WINDOW_DAYS * MS_PER_DAY);
  const cutoffIso = safeToIsoString(cutoff)?.slice(0, 10) ?? '1970-01-01';
  return records
    .filter(r => r.status === 'completed')
    .filter(r => (r.completedDate ?? r.dueDate) >= cutoffIso)
    .sort((a, b) => {
      const ad = a.completedDate ?? a.dueDate;
      const bd = b.completedDate ?? b.dueDate;
      return bd.localeCompare(ad);
    });
}

function buildUpcomingItem(
  rec: SmartHealthRecord,
  now: Date,
): PetHealthCardItem {
  const due = new Date(`${rec.dueDate}T12:00:00.000Z`);
  const diffDays = Math.round((due.getTime() - now.getTime()) / MS_PER_DAY);
  const status: PetHealthCardItemStatus =
    diffDays < 0 || rec.status === 'overdue' ? 'overdue' : 'due_in';
  const detail =
    status === 'overdue'
      ? 'Overdue'
      : diffDays === 0
        ? 'Due today'
        : diffDays === 1
          ? 'Due in 1 day'
          : `Due in ${diffDays} days`;
  return { label: rec.name, status, detail };
}

function buildCompletedItem(rec: SmartHealthRecord): PetHealthCardItem {
  return { label: rec.name, status: 'done', detail: 'Done ✓' };
}

function speciesMeta(type: Pet['type']): { emoji: string; label: string } {
  return type === 'cat'
    ? { emoji: '🐈', label: 'Cat' }
    : { emoji: '🐕', label: 'Dog' };
}

function formatGenderShareLabel(gender: Pet['gender']): string | null {
  if (gender === 'male') {
    return 'Good boy';
  }
  if (gender === 'female') {
    return 'Good girl';
  }
  return null;
}

function buildShareHighlights(input: {
  pet: Pet;
  records: SmartHealthRecord[];
  ageLabel: string | null;
  now: Date;
}): PetHealthCardHighlight[] {
  const { pet, records, ageLabel, now } = input;
  const completed = records.filter(record => record.status === 'completed');
  const recent = pickRecentCompleted(records, now);
  const upcoming = pickNextUpcoming(records);
  const highlights: PetHealthCardHighlight[] = [];

  if (recent[0]) {
    highlights.push({
      emoji: '🏆',
      title: 'Latest win',
      detail: `Finished ${recent[0].name}`,
    });
  }

  if (completed.length > 0) {
    highlights.push({
      emoji: '✅',
      title: 'Care logged',
      detail: `${completed.length} health task${completed.length === 1 ? '' : 's'} done`,
    });
  }

  if (ageLabel) {
    highlights.push({
      emoji: '🎂',
      title: 'Growing up',
      detail: ageLabel,
    });
  } else if (pet.breed?.trim()) {
    highlights.push({
      emoji: speciesMeta(pet.type).emoji,
      title: pet.type === 'cat' ? 'My cat' : 'My dog',
      detail: pet.breed.trim(),
    });
  }

  if (upcoming) {
    const next = buildUpcomingItem(upcoming, now);
    highlights.push({
      emoji: '📅',
      title: 'On deck',
      detail: `${next.label} · ${next.detail}`,
    });
  }

  if (highlights.length === 0) {
    return [
      {
        emoji: '✨',
        title: 'New on Paw-fect',
        detail: `${pet.name}'s care plan is loading`,
      },
      {
        emoji: '💉',
        title: 'Auto schedule',
        detail: 'Vaccines and deworming added for you',
      },
      {
        emoji: '💛',
        title: 'Worth sharing',
        detail: 'Show family the plan is on the way',
      },
    ];
  }

  return highlights.slice(0, 3);
}

function highlightsToGlance(
  highlights: PetHealthCardHighlight[],
): Array<{ label: string; value: string }> {
  return highlights.slice(0, 3).map(highlight => ({
    label: highlight.title,
    value: highlight.detail,
  }));
}
