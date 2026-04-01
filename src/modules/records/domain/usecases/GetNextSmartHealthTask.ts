import type { SmartHealthRecord } from '../models/SmartHealthRecord';
import { PetCareLifecycleEngine } from '../utils/PetCareLifecycleEngine';

export class GetNextSmartHealthTask {
  private readonly engine = new PetCareLifecycleEngine();

  execute(records: SmartHealthRecord[]): SmartHealthRecord | null {
    return this.engine.getActionRequired(records);
  }
}
