import type { SmartHealthRecord } from '../../domain/models/SmartHealthRecord';
import { storageService } from '../../../../infrastructure/storage/storageService';

const cacheKey = (userId: string, petId: string): string =>
  `smartHealthRecords:${userId}:${petId}`;

export interface SmartHealthLocalDataSource {
  getRecords(userId: string, petId: string): Promise<SmartHealthRecord[]>;
  saveRecords(
    userId: string,
    petId: string,
    records: SmartHealthRecord[],
  ): Promise<void>;
  clearPet(userId: string, petId: string): Promise<void>;
}

class SmartHealthLocalDataSourceImpl implements SmartHealthLocalDataSource {
  async getRecords(userId: string, petId: string): Promise<SmartHealthRecord[]> {
    const raw = await storageService.getItem<unknown>(cacheKey(userId, petId));
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw as SmartHealthRecord[];
  }

  async saveRecords(
    userId: string,
    petId: string,
    records: SmartHealthRecord[],
  ): Promise<void> {
    await storageService.setItem(cacheKey(userId, petId), records);
  }

  async clearPet(userId: string, petId: string): Promise<void> {
    await storageService.removeItem(cacheKey(userId, petId));
  }
}

export const createSmartHealthLocalDataSource = (): SmartHealthLocalDataSource =>
  new SmartHealthLocalDataSourceImpl();
