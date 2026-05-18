import type { HomeDashboardViewModel } from '../../modules/app/domain/models/HomeDashboardViewModel';
import type { Pet } from '../../modules/pets/domain/models/Pet';
import type { DailyCareBlock } from '../../modules/schedule/domain/models/DailyCareBlock';
import type { DailySchedule } from '../../modules/schedule/domain/models/DailySchedule';

function formatCareTimeLabel(time24: string): string {
  const [hourPart, minutePart] = time24.split(':').map(Number);
  const date = new Date();
  date.setHours(hourPart ?? 0, minutePart ?? 0, 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export interface WidgetTaskRow {
  id?: string;
  title: string;
  subtitle: string;
  done: boolean;
}

export interface WidgetMilestoneSnapshot {
  title: string;
  dueDateLabel: string;
  countdownLabel: string;
  dueDateYmd: string;
  kind: 'vaccination' | 'deworming';
}

export interface WidgetNextUpSnapshot {
  title: string;
  timeLabel: string;
  blockId: string;
  petId: string;
}

export interface WidgetCareProgressSnapshot {
  completed: number;
  total: number;
  percent: number;
}

/** JSON persisted for home / lock screen / watch glance surfaces. */
export interface WidgetSnapshot {
  petName: string;
  breed: string;
  milestone: WidgetMilestoneSnapshot | null;
  tasks: WidgetTaskRow[];
  nextUp: WidgetNextUpSnapshot | null;
  careProgress: WidgetCareProgressSnapshot | null;
  updatedAt: string;
}

function petBreedLabel(pet: Pet): string {
  return (
    pet.breed?.trim() ||
    (pet.type === 'dog' ? 'Dog' : pet.type === 'cat' ? 'Cat' : 'Pet')
  );
}

function milestoneFromDashboard(
  vm: HomeDashboardViewModel,
): WidgetMilestoneSnapshot | null {
  const m = vm.nextMilestone;
  if (m == null) {
    return null;
  }
  return {
    title: m.title,
    dueDateLabel: m.dueDateLabel,
    countdownLabel: m.countdownLabel,
    dueDateYmd: m.dueDateYmd,
    kind: m.kind,
  };
}

function tasksFromDashboard(vm: HomeDashboardViewModel): WidgetTaskRow[] {
  return vm.todayCare.slice(0, 5).map(item => {
    const t = item.reminder.time.trim();
    const subtitle =
      !t || /^all\s*day$/i.test(t)
        ? 'All day'
        : item.showCompletedCheck
          ? `Done at ${t}`
          : t;
    return {
      title: item.reminder.title,
      subtitle,
      done: item.showCompletedCheck,
    };
  });
}

function tasksFromSchedule(blocks: DailyCareBlock[]): WidgetTaskRow[] {
  return blocks.slice(0, 5).map(block => ({
    id: block.id,
    title: block.title,
    subtitle: block.isCompleted
      ? 'Done'
      : formatCareTimeLabel(block.scheduledTime),
    done: block.isCompleted,
  }));
}

function nextUpFromScheduleBlocks(
  petId: string,
  blocks: DailyCareBlock[],
): WidgetNextUpSnapshot | null {
  const pending = blocks
    .filter(block => !block.isCompleted)
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  const block = pending[0];
  if (block == null) {
    return null;
  }
  return {
    title: block.title,
    timeLabel: formatCareTimeLabel(block.scheduledTime),
    blockId: block.id,
    petId,
  };
}

function nextUpFromDashboard(
  petId: string,
  vm: HomeDashboardViewModel,
): WidgetNextUpSnapshot | null {
  const pending = vm.todayCare.find(item => !item.showCompletedCheck);
  if (pending == null) {
    return null;
  }
  const t = pending.reminder.time.trim();
  const timeLabel =
    !t || /^all\s*day$/i.test(t) ? 'All day' : t;
  return {
    title: pending.reminder.title,
    timeLabel,
    blockId: pending.reminder.id,
    petId,
  };
}

function careProgressFromBlocks(
  blocks: DailyCareBlock[],
): WidgetCareProgressSnapshot | null {
  if (blocks.length === 0) {
    return null;
  }
  const completed = blocks.filter(block => block.isCompleted).length;
  return {
    completed,
    total: blocks.length,
    percent: Math.round((completed / blocks.length) * 100),
  };
}

export function buildWidgetSnapshot(input: {
  pet: Pet;
  viewModel?: HomeDashboardViewModel | null;
  schedule?: DailySchedule | null;
  updatedAt?: string;
}): WidgetSnapshot {
  const { pet, viewModel, schedule } = input;
  const updatedAt = input.updatedAt ?? new Date().toISOString();
  const scheduleBlocks =
    schedule != null && schedule.petId === pet.id ? schedule.blocks : [];

  const milestone =
    viewModel != null && viewModel.activePet?.id === pet.id
      ? milestoneFromDashboard(viewModel)
      : null;

  const tasks =
    scheduleBlocks.length > 0
      ? tasksFromSchedule(scheduleBlocks)
      : viewModel != null && viewModel.activePet?.id === pet.id
        ? tasksFromDashboard(viewModel)
        : [];

  const nextUp =
    scheduleBlocks.length > 0
      ? nextUpFromScheduleBlocks(pet.id, scheduleBlocks)
      : viewModel != null && viewModel.activePet?.id === pet.id
        ? nextUpFromDashboard(pet.id, viewModel)
        : null;

  const careProgress =
    scheduleBlocks.length > 0
      ? careProgressFromBlocks(scheduleBlocks)
      : null;

  return {
    petName: pet.name,
    breed: petBreedLabel(pet),
    milestone,
    tasks,
    nextUp,
    careProgress,
    updatedAt,
  };
}

export function serializeWidgetSnapshot(snapshot: WidgetSnapshot): string {
  return JSON.stringify(snapshot);
}
