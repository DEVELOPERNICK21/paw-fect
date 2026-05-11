import type { ImageSourcePropType } from 'react-native';

import { SHARE_INSTALL_URL } from '../../../../shared/constants/releaseBackend';
import { resolvePetAvatarSource } from '../../../../shared/utils/petDisplayPhoto';
import type { SmartHealthRecord } from '../../../records/domain/models/SmartHealthRecord';
import type { Pet } from '../models/Pet';
import type {
  PetHealthCardItem,
  PetHealthCardItemStatus,
  PetHealthCardSnapshot,
  PetHealthCardViewModel,
} from '../models/PetHealthCardViewModel';
import { formatPetAgeShareLabel } from '../utils/petDobDisplay';

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

    const snapshot = buildSnapshot(records, pet.type, now);

    return {
      pet: { name: pet.name, breedLabel, ageLabel, photoSource },
      snapshot,
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
  const cutoffIso = cutoff.toISOString().slice(0, 10);
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
