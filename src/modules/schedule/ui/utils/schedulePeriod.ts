import type { AppColors } from '../../../../shared/theme/colors';
import type { DailyCareBlock } from '../../domain/models/DailyCareBlock';
import { formatScheduleTimeLabel } from '../utils/scheduleDisplay';

export type ScheduleDayPeriod =
  | 'morning'
  | 'midday'
  | 'afternoon'
  | 'evening'
  | 'night';

export interface ScheduleTimelineGroup {
  period: ScheduleDayPeriod;
  label: string;
  blocks: DailyCareBlock[];
}

const PERIOD_LABELS: Record<ScheduleDayPeriod, string> = {
  morning: 'Morning',
  midday: 'Midday',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};

export function resolveScheduleDayPeriod(time24: string): ScheduleDayPeriod {
  const hours = Number(time24.split(':')[0] ?? 0);
  if (hours >= 5 && hours < 11) {
    return 'morning';
  }
  if (hours >= 11 && hours < 14) {
    return 'midday';
  }
  if (hours >= 14 && hours < 18) {
    return 'afternoon';
  }
  if (hours >= 18 && hours < 22) {
    return 'evening';
  }
  return 'night';
}

export function periodAccentColor(
  period: ScheduleDayPeriod,
  colors: AppColors,
): string {
  switch (period) {
    case 'morning':
      return colors.warning;
    case 'midday':
      return colors.info;
    case 'afternoon':
      return colors.primary;
    case 'evening':
      return colors.accent;
    case 'night':
      return colors.success;
    default:
      return colors.primary;
  }
}

export function periodAccentSurface(
  period: ScheduleDayPeriod,
  colors: AppColors,
): string {
  switch (period) {
    case 'morning':
      return colors.brandTint12;
    case 'midday':
      return colors.infoSurface;
    case 'afternoon':
      return colors.brandTint12;
    case 'evening':
      return colors.brandTint10;
    case 'night':
      return colors.successSurface;
    default:
      return colors.brandTint10;
  }
}

function compareTime24(left: string, right: string): number {
  return left.localeCompare(right);
}

function buildPeriodLabel(period: ScheduleDayPeriod, blocks: DailyCareBlock[]): string {
  const sorted = [...blocks].sort((left, right) =>
    compareTime24(left.scheduledTime, right.scheduledTime),
  );
  const start = formatScheduleTimeLabel(sorted[0]?.scheduledTime ?? '07:00');
  const end = formatScheduleTimeLabel(sorted[sorted.length - 1]?.scheduledTime ?? start);
  return `${PERIOD_LABELS[period].toUpperCase()} — ${start}–${end}`;
}

export function groupBlocksForTimeline(blocks: DailyCareBlock[]): ScheduleTimelineGroup[] {
  const sorted = [...blocks].sort((left, right) => {
    const byTime = compareTime24(left.scheduledTime, right.scheduledTime);
    if (byTime !== 0) {
      return byTime;
    }
    return left.order - right.order;
  });

  const groups: ScheduleTimelineGroup[] = [];
  for (const block of sorted) {
    const period = resolveScheduleDayPeriod(block.scheduledTime);
    const current = groups[groups.length - 1];
    if (current?.period === period) {
      current.blocks.push(block);
      current.label = buildPeriodLabel(period, current.blocks);
      continue;
    }
    groups.push({
      period,
      label: buildPeriodLabel(period, [block]),
      blocks: [block],
    });
  }
  return groups;
}

export function splitDescriptionBullets(description: string): string[] {
  const trimmed = description.trim();
  if (!trimmed) {
    return [];
  }
  const parts = trimmed
    .split(/(?<=[.!?])\s+/)
    .map(part => part.trim())
    .filter(Boolean);
  if (parts.length <= 1 && trimmed.length > 72) {
    return [trimmed];
  }
  return parts.length > 0 ? parts : [trimmed];
}
