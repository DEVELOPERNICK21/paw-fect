import type { Pet } from '../../domain/models/Pet';
import { apiClient } from '../../../../infrastructure/api/apiClient';
import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  getFirestore,
  limit,
  query,
  setDoc,
  writeBatch,
} from '@react-native-firebase/firestore';

export interface PetRemoteDataSource {
  fetchPets(): Promise<Pet[]>;
  fetchPetById(id: string): Promise<Pet | null>;
  createPet(pet: Pet): Promise<Pet>;
  updatePet(pet: Pet): Promise<Pet>;
  deletePet(id: string): Promise<void>;
}

class PetRemoteDataSourceImpl implements PetRemoteDataSource {
  private readonly db = getFirestore();
  private readonly auth = getAuth(getApp());
  private readonly cascadeCollections = [
    'healthRecords',
    'manualHealthRecords',
    'healthRecordHistory',
    'vaccinations',
    'deworming',
  ] as const;

  private currentUserId(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  private petsCollection(userId: string) {
    return collection(this.db, 'users', userId, 'pets');
  }

  private serializePetForFirestore(pet: Pet): Record<string, unknown> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { syncStatus: _syncStatus, photo, ...rest } = pet;
    return {
      ...rest,
      // Explicit null clears a previous photo under setDoc merge.
      photo: photo && photo.trim().length > 0 ? photo : null,
    };
  }

  /** Firestore batches max 500 ops; delete in chunks to avoid silent failures. */
  private static readonly DELETE_CHUNK = 450;

  private async deleteCollectionDocs(
    userId: string,
    petId: string,
    childCollection: string,
  ): Promise<void> {
    const subRef = collection(this.db, 'users', userId, 'pets', petId, childCollection);
    const chunk = PetRemoteDataSourceImpl.DELETE_CHUNK;
    while (true) {
      const snap = await getDocs(query(subRef, limit(chunk)));
      if (snap.empty) return;
      const batch = writeBatch(this.db);
      for (const d of snap.docs) {
        batch.delete(d.ref);
      }
      await batch.commit();
    }
  }

  async fetchPets(): Promise<Pet[]> {
    const userId = this.currentUserId();
    if (userId) {
      try {
        const colRef = this.petsCollection(userId);
        const snap = await getDocs(colRef);
        return snap.docs.map(snapshotDoc => {
          const data = snapshotDoc.data() as Omit<Pet, 'id'>;
          return { ...data, id: snapshotDoc.id };
        });
      } catch {
        // Fall back to API below.
      }
    }
    const response = await apiClient.request<Pet[]>({
      path: '/pets',
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(`fetchPets failed: ${response.status}`);
    }
    return response.data ?? [];
  }

  async fetchPetById(id: string): Promise<Pet | null> {
    const userId = this.currentUserId();
    if (userId) {
      try {
        const ref = doc(this.db, 'users', userId, 'pets', id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          return null;
        }
        const data = snap.data() as Omit<Pet, 'id'>;
        return { ...data, id: snap.id };
      } catch {
        // Fall back to API below.
      }
    }
    const response = await apiClient.request<Pet>({
      path: `/pets/${id}`,
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(`fetchPetById failed: ${response.status}`);
    }
    return response.data ?? null;
  }

  async createPet(pet: Pet): Promise<Pet> {
    const userId = this.currentUserId();
    if (userId) {
      try {
        const ref = doc(this.db, 'users', userId, 'pets', pet.id);
        await setDoc(ref, this.serializePetForFirestore(pet), { merge: true });
        return pet;
      } catch {
        // Fall back to API below.
      }
    }
    const response = await apiClient.request<Pet, Record<string, unknown>>({
      path: '/pets',
      method: 'POST',
      body: this.serializePetForFirestore(pet),
    });
    if (!response.ok || !response.data) {
      throw new Error('Failed to create pet');
    }
    return response.data;
  }

  async updatePet(pet: Pet): Promise<Pet> {
    const userId = this.currentUserId();
    if (userId) {
      try {
        const ref = doc(this.db, 'users', userId, 'pets', pet.id);
        await setDoc(ref, this.serializePetForFirestore(pet), { merge: true });
        return pet;
      } catch {
        // Fall back to API below.
      }
    }
    const response = await apiClient.request<Pet, Record<string, unknown>>({
      path: `/pets/${pet.id}`,
      method: 'PUT',
      body: this.serializePetForFirestore(pet),
    });
    if (!response.ok || !response.data) {
      throw new Error('Failed to update pet');
    }
    return response.data;
  }

  async deletePet(id: string): Promise<void> {
    const userId = this.currentUserId();
    if (userId) {
      try {
        for (const childCollection of this.cascadeCollections) {
          await this.deleteCollectionDocs(userId, id, childCollection);
        }
        const ref = doc(this.db, 'users', userId, 'pets', id);
        await deleteDoc(ref);
        return;
      } catch {
        // Fall back to API below.
      }
    }
    const response = await apiClient.request<void>({
      path: `/pets/${id}`,
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`deletePet failed: ${response.status}`);
    }
  }
}

export const createPetRemoteDataSource = (): PetRemoteDataSource =>
  new PetRemoteDataSourceImpl();
