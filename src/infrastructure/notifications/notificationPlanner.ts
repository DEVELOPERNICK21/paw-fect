import {
  GLOBAL_PENDING_NOTIFICATION_BUDGET,
  isManagedOrPhase1ExtraId,
  type NotificationCandidate,
} from './notificationCandidate';
import type { NotificationService } from './notificationService';

export function selectCandidates(
  candidates: NotificationCandidate[],
  activePetId: string | null,
  budget: number = GLOBAL_PENDING_NOTIFICATION_BUDGET,
): NotificationCandidate[] {
  const sorted = [...candidates].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    const fireAtDiff = a.fireAt.getTime() - b.fireAt.getTime();
    if (fireAtDiff !== 0) {
      return fireAtDiff;
    }

    const aActive = activePetId !== null && a.petId === activePetId ? 0 : 1;
    const bActive = activePetId !== null && b.petId === activePetId ? 0 : 1;
    if (aActive !== bActive) {
      return aActive - bActive;
    }

    return a.id.localeCompare(b.id);
  });

  return sorted.slice(0, budget);
}

export interface PlanApplyResult {
  selected: NotificationCandidate[];
  cancelledIds: string[];
  scheduledIds: string[];
  droppedByKind: Record<string, number>;
}

function computeDroppedByKind(
  candidates: NotificationCandidate[],
  selectedIds: Set<string>,
): Record<string, number> {
  const droppedByKind: Record<string, number> = {};

  for (const candidate of candidates) {
    if (selectedIds.has(candidate.id)) {
      continue;
    }
    droppedByKind[candidate.kind] = (droppedByKind[candidate.kind] ?? 0) + 1;
  }

  return droppedByKind;
}

export async function planAndApply(options: {
  candidates: NotificationCandidate[];
  activePetId: string | null;
  service: NotificationService;
  budget?: number;
}): Promise<PlanApplyResult> {
  const { candidates, activePetId, service, budget } = options;

  const selected = selectCandidates(candidates, activePetId, budget);
  const selectedIds = new Set(selected.map(candidate => candidate.id));

  const pending = await service.getTriggerNotificationIds();
  const cancelledIds: string[] = [];

  for (const id of pending) {
    if (!isManagedOrPhase1ExtraId(id) || selectedIds.has(id)) {
      continue;
    }
    await service.cancelNotification(id);
    cancelledIds.push(id);
  }

  const scheduledIds: string[] = [];
  for (const candidate of selected) {
    await service.scheduleNotification(candidate.payload);
    scheduledIds.push(candidate.id);
  }

  const droppedByKind = computeDroppedByKind(candidates, selectedIds);

  return {
    selected,
    cancelledIds,
    scheduledIds,
    droppedByKind,
  };
}
