import firestore from '@react-native-firebase/firestore';

import type {
  SmartHealthHistoryLog,
  SmartHealthRecord,
} from '../../domain/models/SmartHealthRecord';

export interface SmartHealthRecordRemoteDataSource {
  listByPet(userId: string, petId: string): Promise<SmartHealthRecord[]>;
  upsertMany(records: SmartHealthRecord[]): Promise<void>;
  updateOne(record: SmartHealthRecord): Promise<void>;
  appendHistory(logs: SmartHealthHistoryLog[]): Promise<void>;
}

class SmartHealthRecordRemoteDataSourceImpl
  implements SmartHealthRecordRemoteDataSource
{
  private recordsCollection(userId: string, petId: string) {
    return firestore()
      .collection('users')
      .doc(userId)
      .collection('pets')
      .doc(petId)
      .collection('healthRecords');
  }

  private historyCollection(userId: string, petId: string) {
    return firestore()
      .collection('users')
      .doc(userId)
      .collection('pets')
      .doc(petId)
      .collection('healthRecordHistory');
  }

  async listByPet(userId: string, petId: string): Promise<SmartHealthRecord[]> {
    const snap = await this.recordsCollection(userId, petId).get();
    const records: SmartHealthRecord[] = [];
    snap.forEach(doc => {
      const data = doc.data() as SmartHealthRecord;
      records.push({
        ...data,
        id: doc.id,
      });
    });
    return records;
  }

  async upsertMany(records: SmartHealthRecord[]): Promise<void> {
    if (records.length === 0) return;
    const batch = firestore().batch();
    for (const record of records) {
      const ref = this.recordsCollection(record.userId, record.petId).doc(record.id);
      batch.set(ref, record, { merge: true });
    }
    await batch.commit();
  }

  async updateOne(record: SmartHealthRecord): Promise<void> {
    const ref = this.recordsCollection(record.userId, record.petId).doc(record.id);
    await ref.set(record, { merge: true });
  }

  async appendHistory(logs: SmartHealthHistoryLog[]): Promise<void> {
    if (logs.length === 0) return;
    const batch = firestore().batch();
    for (const log of logs) {
      const ref = this.historyCollection(log.userId, log.petId).doc(log.id);
      batch.set(ref, log, { merge: true });
    }
    await batch.commit();
  }
}

export const createSmartHealthRecordRemoteDataSource =
  (): SmartHealthRecordRemoteDataSource =>
    new SmartHealthRecordRemoteDataSourceImpl();

