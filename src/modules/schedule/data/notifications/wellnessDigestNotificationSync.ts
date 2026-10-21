import {
  priorityForWellnessDigest,
  type NotificationCandidate,
} from '../../../../infrastructure/notifications/notificationCandidate';
import { parseReminderLocalDateTime } from '../../../../shared/utils/reminderDateTime';
import type { DailyCareBlock } from '../../domain/models/DailyCareBlock';

export type WellnessDigestSlot = 'morning' | 'midday' | 'evening';

const DIGEST_LEAD_MINUTES = 15;

export function wellnessDigestNotificationId(
  petId: string,
  slot: WellnessDigestSlot,
): string {
  return `wellness-digest-${petId}-${slot}`;
}

function parseTimeMinutes(time24: string): number {
  const [hours, minutes] = time24.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function sortedUndoneBlocks(blocks: DailyCareBlock[]): DailyCareBlock[] {
  return blocks
    .filter(block => block.status !== 'done' && !block.isCompleted)
    .sort(
      (left, right) =>
        left.scheduledTime.localeCompare(right.scheduledTime) ||
        left.order - right.order,
    );
}

/**
 * Picks morning, midday, and evening digest target blocks from undone schedule blocks.
 */
export function pickWellnessDigestBlocks(
  blocks: DailyCareBlock[],
): Partial<Record<WellnessDigestSlot, DailyCareBlock>> {
  const undone = sortedUndoneBlocks(blocks);
  if (undone.length === 0) {
    return {};
  }

  const morning = undone[0];

  const middayCandidates = undone.filter(block => {
    const minutes = parseTimeMinutes(block.scheduledTime);
    return minutes >= 11 * 60 && minutes <= 14 * 60;
  });
  const midday =
    middayCandidates.sort(
      (left, right) =>
        Math.abs(parseTimeMinutes(left.scheduledTime) - 12 * 60) -
        Math.abs(parseTimeMinutes(right.scheduledTime) - 12 * 60),
    )[0] ?? undone.find(block => parseTimeMinutes(block.scheduledTime) >= 11 * 60);

  const eveningGrooming = [...undone]
    .reverse()
    .find(
      block =>
        block.category === 'grooming' ||
        block.category === 'health_check' ||
        block.title.toLowerCase().includes('health check'),
    );
  const evening =
    eveningGrooming ??
    [...undone].reverse().find(block => block.category !== 'bedtime') ??
    undone[undone.length - 1];

  const result: Partial<Record<WellnessDigestSlot, DailyCareBlock>> = {
    morning,
  };
  if (midday && midday.id !== morning.id) {
    result.midday = midday;
  }
  if (evening && evening.id !== morning.id && evening.id !== midday?.id) {
    result.evening = evening;
  } else if (!result.midday && evening && evening.id !== morning.id) {
    result.evening = evening;
  }

  return result;
}

/**
 * Builds warm, pet-personalized notification copy for a digest slot.
 */
export function buildWellnessDigestCopy(
  slot: WellnessDigestSlot,
  petName: string,
  block: DailyCareBlock,
): { title: string; body: string } {
  const label = block.title.toLowerCase();
  if (slot === 'morning') {
    if (label.includes('walk')) {
      return {
        title: `${petName}'s morning walk window opens in 15 min 🐾`,
        body: `Time to head out with ${petName}.`,
      };
    }
    if (label.includes('play')) {
      return {
        title: `Play time for ${petName} 🎾`,
        body: `${petName}'s first care block starts in 15 min.`,
      };
    }
    return {
      title: `${petName}'s care day starts soon 🐾`,
      body: `${block.title} — 15 min away.`,
    };
  }
  if (slot === 'midday') {
    if (label.includes('litter')) {
      return {
        title: `Time for ${petName}'s midday litter scoop 🐱`,
        body: `A quick scoop keeps ${petName} comfortable.`,
      };
    }
    return {
      title: `Midday care for ${petName}`,
      body: `${block.title} — 15 min away.`,
    };
  }
  return {
    title: `Evening bonding + health check for ${petName} — 15 min away 🐶`,
    body: block.title,
  };
}

function scheduleDateForBlock(
  scheduleDate: string,
  block: DailyCareBlock,
): Date | null {
  const event = parseReminderLocalDateTime(scheduleDate, block.scheduledTime);
  if (!event) {
    return null;
  }
  event.setMinutes(event.getMinutes() - DIGEST_LEAD_MINUTES);
  return event;
}

/**
 * Builds up to three wellness digest planner candidates for remaining undone tasks.
 */
export function buildWellnessDigestCandidates(
  scheduleDate: string,
  petId: string,
  petName: string,
  blocks: DailyCareBlock[],
  nowMs: number = Date.now(),
): NotificationCandidate[] {
  const slots = pickWellnessDigestBlocks(blocks);
  const candidates: NotificationCandidate[] = [];

  for (const slot of ['morning', 'midday', 'evening'] as const) {
    const block = slots[slot];
    if (!block) {
      continue;
    }
    const scheduledDate = scheduleDateForBlock(scheduleDate, block);
    if (!scheduledDate || scheduledDate.getTime() <= nowMs + 1500) {
      continue;
    }
    const copy = buildWellnessDigestCopy(slot, petName, block);
    const notificationId = wellnessDigestNotificationId(petId, slot);
    candidates.push({
      id: notificationId,
      kind: 'wellnessDigest',
      petId,
      fireAt: scheduledDate,
      priority: priorityForWellnessDigest(),
      payload: {
        id: notificationId,
        title: copy.title,
        body: copy.body,
        scheduledDate,
        data: {
          kind: 'wellnessDigest',
          petId,
          blockId: block.id,
          date: scheduleDate,
          slot,
          notificationId,
        },
      },
    });
  }

  return candidates;
}
