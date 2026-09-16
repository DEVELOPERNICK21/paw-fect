import type { AppColors } from '../../../../shared/theme/colors';
import type { SmartHealthRecordStatus } from '../../domain/models/SmartHealthRecord';

export function resolveHealthRecordCardSurface(params: {
  status: SmartHealthRecordStatus;
  isHero: boolean;
  colors: AppColors;
}): string {
  const { status, isHero, colors } = params;
  if (status === 'overdue' || status === 'missed') {
    return colors.dangerSurface;
  }
  if (isHero && status === 'upcoming') {
    return colors.brandTint12;
  }
  return colors.surface;
}
