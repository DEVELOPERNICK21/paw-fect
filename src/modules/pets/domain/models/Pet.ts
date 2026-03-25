export type PetType = 'dog' | 'cat' | 'other';

export type PetGender = 'male' | 'female' | 'unknown';

export type PetSyncStatus = 'pending' | 'synced' | 'failed';

export interface Pet {
  id: string;
  userId: string;
  name: string;
  type: PetType;
  breed?: string;
  gender?: PetGender;
  dob?: string;
  photo?: string;
  createdAt: string;
  updatedAt: string;
  /**
   * Local-only sync status for offline-first UX.
   * This must never be sent to the remote API.
   */
  syncStatus?: PetSyncStatus;
}
