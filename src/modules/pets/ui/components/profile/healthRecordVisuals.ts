import type { IconName } from '../../../../../shared/components/MaterialIcon';
import type { HealthRecord } from '../../../../records/domain/models/HealthRecord';

export function healthRecordIconName(record: HealthRecord): IconName {
  const haystack = `${record.title} ${record.category} ${record.notes}`.toLowerCase();

  if (/\bvaccin/i.test(haystack) || /\brabies\b/i.test(haystack)) {
    return 'vaccines';
  }

  if (/\bcheckup\b/i.test(haystack) || /\bwellness\b/i.test(haystack)) {
    return 'medical_services';
  }

  return 'medical_services';
}

