import type { SmartHealthRecord } from '../models/SmartHealthRecord';

export class GetNextSmartHealthTask {
  execute(records: SmartHealthRecord[]): SmartHealthRecord | null {
    const actionable = records
      .filter(record => record.status === 'overdue' || record.status === 'upcoming')
      .slice()
      .sort((a, b) => {
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (b.status === 'overdue' && a.status !== 'overdue') return 1;
        return a.dueDate.localeCompare(b.dueDate);
      });

    return actionable[0] ?? null;
  }
}
