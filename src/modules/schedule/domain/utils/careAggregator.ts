import type { DailyCareBlock } from '../models/DailyCareBlock';
import {
  deriveBlockStatus,
  isBlockMissed,
  isWithinActiveWindow,
} from './wellnessBlockStatus';
import { getDayCompletion } from './wellnessCompletion';

export type CareUrgency =
  | 'overdue'
  | 'now'
  | 'upcoming'
  | 'later'
  | 'done'
  | 'skipped';

export interface CarePetRef {
  id: string;
  name: string;
  type: 'dog' | 'cat';
  photo?: string | null;
}

export interface CareAggregatedItem {
  block: DailyCareBlock;
  pet: CarePetRef;
  urgency: CareUrgency;
  whenLabel: string;
}

export interface CareDayViewModel {
  items: CareAggregatedItem[];
  attentionItem: CareAggregatedItem | null;
  upNext: CareAggregatedItem[];
  later: CareAggregatedItem[];
  openCount: number;
  doneCount: number;
  totalCount: number;
  allGood: boolean;
}

function parseTimeToMinutes(time24: string): number {
  const [hours, minutes] = time24.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function formatClockLabel(time24: string): string {
  const [hRaw, mRaw] = time24.split(':').map(Number);
  const hours = hRaw ?? 0;
  const minutes = mRaw ?? 0;
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = ((hours + 11) % 12) + 1;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function urgencyRank(urgency: CareUrgency): number {
  switch (urgency) {
    case 'overdue':
      return 0;
    case 'now':
      return 1;
    case 'upcoming':
      return 2;
    case 'later':
      return 3;
    case 'skipped':
      return 4;
    case 'done':
      return 5;
    default:
      return 6;
  }
}

/**
 * Classifies a block's urgency for All Pets Care hierarchy.
 */
export function resolveCareUrgency(
  block: DailyCareBlock,
  now: Date,
  relaxedMode: boolean,
): CareUrgency {
  const status = deriveBlockStatus(block, undefined, now);
  if (status === 'done') {
    return 'done';
  }
  if (status === 'skipped' || block.isSkipped) {
    return 'skipped';
  }
  if (isBlockMissed({ ...block, status }, now, relaxedMode)) {
    return 'overdue';
  }
  if (isWithinActiveWindow(block.scheduledTime, now) || status === 'active') {
    return 'now';
  }
  const scheduled = parseTimeToMinutes(block.scheduledTime);
  const current = now.getHours() * 60 + now.getMinutes();
  if (scheduled - current <= 180) {
    return 'upcoming';
  }
  return 'later';
}

export function resolveWhenLabel(
  urgency: CareUrgency,
  scheduledTime: string,
  now: Date,
): string {
  if (urgency === 'done') {
    return 'Done';
  }
  if (urgency === 'skipped') {
    return 'Skipped';
  }
  if (urgency === 'now') {
    return "It's time";
  }
  if (urgency === 'overdue') {
    const late = Math.max(
      0,
      now.getHours() * 60 +
        now.getMinutes() -
        parseTimeToMinutes(scheduledTime),
    );
    if (late < 60) {
      return `Was due ${late || 1} min ago`;
    }
    const hours = Math.floor(late / 60);
    return `Was due ${hours}h ago`;
  }
  return formatClockLabel(scheduledTime);
}

export interface AggregateCareDayInput {
  pets: CarePetRef[];
  /** petId → enriched or raw daily blocks for today */
  blocksByPetId: Record<string, DailyCareBlock[]>;
  filterPetId: 'all' | string;
  now: Date;
  relaxedMode?: boolean;
  isPro?: boolean;
  upNextLimit?: number;
  laterLimit?: number;
}

/**
 * Presentation aggregator: merges DailyCareBlock[] from all pets.
 * Does not generate schedules — only sorts/filters for Care UI.
 */
export function aggregateCareDay(
  input: AggregateCareDayInput,
): CareDayViewModel {
  const relaxedMode = input.relaxedMode ?? false;
  const upNextLimit = input.upNextLimit ?? 3;
  const laterLimit = input.laterLimit ?? 4;
  const petMap = new Map(input.pets.map(pet => [pet.id, pet]));

  const items: CareAggregatedItem[] = [];
  for (const pet of input.pets) {
    if (input.filterPetId !== 'all' && pet.id !== input.filterPetId) {
      continue;
    }
    const blocks = input.blocksByPetId[pet.id] ?? [];
    for (const block of blocks) {
      if (block.petId !== pet.id) {
        continue;
      }
      const urgency = resolveCareUrgency(block, input.now, relaxedMode);
      items.push({
        block: {
          ...block,
          status:
            urgency === 'done'
              ? 'done'
              : urgency === 'skipped'
                ? 'skipped'
                : urgency === 'now'
                  ? 'active'
                  : 'upcoming',
          isMissed: urgency === 'overdue',
        },
        pet,
        urgency,
        whenLabel: resolveWhenLabel(urgency, block.scheduledTime, input.now),
      });
    }
  }

  items.sort((left, right) => {
    const urgencyDelta =
      urgencyRank(left.urgency) - urgencyRank(right.urgency);
    if (urgencyDelta !== 0) {
      return urgencyDelta;
    }
    return (
      left.block.scheduledTime.localeCompare(right.block.scheduledTime) ||
      left.block.order - right.block.order ||
      left.pet.name.localeCompare(right.pet.name)
    );
  });

  const openItems = items.filter(
    item => item.urgency !== 'done' && item.urgency !== 'skipped',
  );
  const attentionItem = openItems[0] ?? null;
  const remaining = openItems.slice(1);
  const upNext = remaining.slice(0, upNextLimit);
  const later = remaining.slice(upNextLimit, upNextLimit + laterLimit);

  const allBlocks = items.map(item => item.block);
  const completion = getDayCompletion(allBlocks, input.isPro ?? false);

  return {
    items,
    attentionItem,
    upNext,
    later,
    openCount: openItems.length,
    doneCount: completion.done,
    totalCount: completion.total,
    allGood: openItems.length === 0 && completion.total > 0,
  };
}

/**
 * Chronological full-day list (includes completed) for Day View.
 */
export function chronologicalCareItems(
  input: AggregateCareDayInput,
): CareAggregatedItem[] {
  const view = aggregateCareDay({
    ...input,
    upNextLimit: 999,
    laterLimit: 999,
  });
  return [...view.items].sort(
    (left, right) =>
      left.block.scheduledTime.localeCompare(right.block.scheduledTime) ||
      left.block.order - right.block.order,
  );
}
