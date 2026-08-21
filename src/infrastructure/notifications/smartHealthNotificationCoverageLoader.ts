import { getNotificationFeaturePorts } from './notificationFeaturePorts';
import type { SmartHealthNotificationCoverage } from './smartHealthNotificationSelection';

export async function loadSmartHealthNotificationCoverage(): Promise<SmartHealthNotificationCoverage | null> {
  return getNotificationFeaturePorts().loadSmartHealthCoverage();
}

export function formatSmartHealthNotificationCoverage(
  coverage: SmartHealthNotificationCoverage,
): string {
  if (coverage.totalSchedulable === 0) {
    return 'No upcoming health doses need reminders right now.';
  }
  const base = `${coverage.scheduledCount} of ${coverage.totalSchedulable} upcoming doses have reminders scheduled.`;
  if (!coverage.capped) {
    return base;
  }
  return `${base} Some doses are not covered because of the multi-pet reminder limit.`;
}
