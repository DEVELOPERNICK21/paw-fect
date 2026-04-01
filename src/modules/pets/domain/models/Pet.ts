export type PetType = 'dog' | 'cat';

export type PetGender = 'male' | 'female' | 'unknown';

export type PetSyncStatus = 'pending' | 'synced' | 'failed';
export type PetLifestyleType = 'indoor' | 'outdoor' | 'mixed';
export type PetLifestyleRiskLevel = 'low' | 'medium' | 'high';
export type PetRegion = 'IN' | 'US' | 'EU' | 'OTHER';

export interface Pet {
  id: string;
  userId: string;
  name: string;
  type: PetType;
  breed?: string;
  gender?: PetGender;
  dob?: string;
  lifestyle?: {
    type: PetLifestyleType;
    riskLevel: PetLifestyleRiskLevel;
  };
  region?: PetRegion;
  photo?: string;
  createdAt: string;
  updatedAt: string;
  /**
   * Local-only sync status for offline-first UX.
   * This must never be sent to the remote API.
   */
  syncStatus?: PetSyncStatus;
}
