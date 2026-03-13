export type PetType = 'dog' | 'cat' | 'other';

export interface Pet {
  id: string;
  name: string;
  type: PetType;
  breed?: string;
  dob?: string;
  photo?: string;
  createdAt: string;
}

