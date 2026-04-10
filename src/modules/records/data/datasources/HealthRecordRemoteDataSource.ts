import type { HealthRecord } from '../../domain/models/HealthRecord';
import { apiClient } from '../../../../infrastructure/api/apiClient';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  setDoc,
} from '@react-native-firebase/firestore';
import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';

export interface HealthRecordRemoteDataSource {
  fetchRecords(): Promise<HealthRecord[]>;
  createRecord(record: HealthRecord): Promise<HealthRecord>;
  deleteRecord(record: HealthRecord): Promise<void>;
}

class HealthRecordRemoteDataSourceImpl
  implements HealthRecordRemoteDataSource
{
  private readonly db = getFirestore();
  private readonly auth = getAuth(getApp());
  private readonly manualCollectionName = 'manualHealthRecords';

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

  async fetchRecords(): Promise<HealthRecord[]> {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) return [];
      const petsRef = collection(this.db, 'users', userId, 'pets');
      const petsSnap = await getDocs(petsRef);
      const records: HealthRecord[] = [];
      for (const petDoc of petsSnap.docs) {
        const petId = petDoc.id;
        const healthRecordsRef = collection(
          this.db,
          'users',
          userId,
          'pets',
          petId,
          this.manualCollectionName,
        );
        const healthRecordsSnap = await getDocs(healthRecordsRef);
        for (const snapshotDoc of healthRecordsSnap.docs) {
          const data = snapshotDoc.data() as Omit<HealthRecord, 'id'>;
          records.push({ ...data, id: snapshotDoc.id });
        }
      }
      return records;
    } catch {
      const response = await apiClient.request<HealthRecord[]>({
        path: '/health-records',
        method: 'GET',
      });
      return response.data ?? [];
    }
  }

  async createRecord(record: HealthRecord): Promise<HealthRecord> {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('No authenticated user.');
      const ref = doc(
        this.db,
        'users',
        userId,
        'pets',
        record.petId,
        this.manualCollectionName,
        record.id,
      );
      await this.ensurePetDocument(userId, record.petId);
      await setDoc(ref, {
        id: record.id,
        userId,
        petId: record.petId,
        title: record.title,
        category: record.category,
        date: record.date,
        notes: record.notes,
        attachments: record.attachments,
      });
      return record;
    } catch {
      const response = await apiClient.request<HealthRecord, HealthRecord>({
        path: '/health-records',
        method: 'POST',
        body: record,
      });

      if (!response.data) {
        throw new Error('Failed to create health record');
      }
      return response.data;
    }
  }

  async deleteRecord(record: HealthRecord): Promise<void> {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('No authenticated user.');
      const ref = doc(
        this.db,
        'users',
        userId,
        'pets',
        record.petId,
        this.manualCollectionName,
        record.id,
      );
      await deleteDoc(ref);
    } catch {
      await apiClient.request<void>({
        path: `/health-records/${record.id}`,
        method: 'DELETE',
      });
    }
  }
}

export const createHealthRecordRemoteDataSource =
  (): HealthRecordRemoteDataSource => new HealthRecordRemoteDataSourceImpl();

