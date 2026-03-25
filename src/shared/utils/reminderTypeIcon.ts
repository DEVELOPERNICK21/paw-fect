import type { IconName } from '../components/MaterialIcon';
import type { ReminderType } from '../../modules/reminders/domain/models/Reminder';

export function reminderTypeIcon(type: ReminderType): IconName {
  switch (type) {
    case 'vaccination':
      return 'vaccines';
    case 'medication':
      return 'pill';
    case 'grooming':
      return 'content_cut';
    case 'checkup':
      return 'medical_services';
    default:
      return 'directions_walk';
  }
}

