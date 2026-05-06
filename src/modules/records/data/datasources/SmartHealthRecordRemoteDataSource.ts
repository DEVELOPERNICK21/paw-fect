import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  limit,
  query,
  setDoc,
  writeBatch,
} from '@react-native-firebase/firestore';

import type {
  SmartHealthHistoryLog,
  SmartHealthRecord,
} from '../../domain/models/SmartHealthRecord';
import { stripUndefinedDeep } from '../utils/stripUndefinedDeep';

export interface SmartHealthRecordRemoteDataSource {
  listByPet(userId: string, petId: string): Promise<SmartHealthRecord[]>;
  upsertMany(records: SmartHealthRecord[]): Promise<void>;
  updateOne(record: SmartHealthRecord): Promise<void>;
  appendHistory(logs: SmartHealthHistoryLog[]): Promise<void>;
  deleteOne(userId: string, petId: string, recordId: string): Promise<void>;
  deleteAll(userId: string, petId: string): Promise<void>;
}

class SmartHealthRecordRemoteDataSourceImpl
  implements SmartHealthRecordRemoteDataSource
{
  private readonly db = getFirestore();

  private async ensurePetDocument(
    userId: string,
    petId: string,
  ): Promise<void> {
    const petRef = doc(this.db, 'users', userId, 'pets', petId);
    await setDoc(
      petRef,
      {
        id: petId,
        userId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  }

  private healthRecordsCollection(userId: string, petId: string) {
    return collection(this.db, 'users', userId, 'pets', petId, 'healthRecords');
  }

  private healthRecordHistoryCollection(userId: string, petId: string) {
    return collection(
      this.db,
      'users',
      userId,
      'pets',
      petId,
      'healthRecordHistory',
    );
  }

  async listByPet(userId: string, petId: string): Promise<SmartHealthRecord[]> {
    const colRef = this.healthRecordsCollection(userId, petId);
    const snap = await getDocs(colRef);
    const records: SmartHealthRecord[] = [];
    for (const snapshotDoc of snap.docs) {
      const data = snapshotDoc.data() as SmartHealthRecord;
      records.push({
        ...data,
        id: snapshotDoc.id,
      });
    }
    return records;
  }

  async upsertMany(records: SmartHealthRecord[]): Promise<void> {
    if (records.length === 0) return;
    const petKeys = new Set(records.map(record => `${record.userId}:${record.petId}`));
    for (const petKey of petKeys) {
      const [userId, petId] = petKey.split(':');
      if (!userId || !petId) continue;
      await this.ensurePetDocument(userId, petId);
    }
    const batch = writeBatch(this.db);
    for (const record of records) {
      const colRef = this.healthRecordsCollection(record.userId, record.petId);
      const ref = doc(colRef, record.id);
      const payload = stripUndefinedDeep(record);
      batch.set(ref, payload, { merge: true });
    }
    await batch.commit();
  }

  async updateOne(record: SmartHealthRecord): Promise<void> {
    const colRef = this.healthRecordsCollection(record.userId, record.petId);
    const ref = doc(colRef, record.id);
    await setDoc(ref, stripUndefinedDeep(record), { merge: true });
  }

  async appendHistory(logs: SmartHealthHistoryLog[]): Promise<void> {
    if (logs.length === 0) return;
    const petKeys = new Set(logs.map(log => `${log.userId}:${log.petId}`));
    for (const petKey of petKeys) {
      const [userId, petId] = petKey.split(':');
      if (!userId || !petId) continue;
      await this.ensurePetDocument(userId, petId);
    }
    const batch = writeBatch(this.db);
    for (const log of logs) {
      const colRef = this.healthRecordHistoryCollection(log.userId, log.petId);
      const ref = doc(colRef, log.id);
      batch.set(ref, stripUndefinedDeep(log), { merge: true });
    }
    await batch.commit();
  }

  async deleteOne(
    userId: string,
    petId: string,
    recordId: string,
  ): Promise<void> {
    const colRef = this.healthRecordsCollection(userId, petId);
    const ref = doc(colRef, recordId);
    await deleteDoc(ref);
  }

  async deleteAll(userId: string, petId: string): Promise<void> {
    const colRef = this.healthRecordsCollection(userId, petId);
    const chunk = 450;
    while (true) {
      const snap = await getDocs(query(colRef, limit(chunk)));
      if (snap.empty) return;
      const batch = writeBatch(this.db);
      for (const snapshotDoc of snap.docs) {
        batch.delete(snapshotDoc.ref);
      }
      await batch.commit();
    }
  }
}

export const createSmartHealthRecordRemoteDataSource =
  (): SmartHealthRecordRemoteDataSource =>
    new SmartHealthRecordRemoteDataSourceImpl();
