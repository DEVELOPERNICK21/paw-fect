import type { Pet } from '../../domain/models/Pet';
import { apiClient } from '../../../../infrastructure/api/apiClient';

export interface PetRemoteDataSource {
  fetchPets(): Promise<Pet[]>;
  fetchPetById(id: string): Promise<Pet | null>;
  createPet(pet: Pet): Promise<Pet>;
  updatePet(pet: Pet): Promise<Pet>;
  deletePet(id: string): Promise<void>;
}

class PetRemoteDataSourceImpl implements PetRemoteDataSource {
  async fetchPets(): Promise<Pet[]> {
    const response = await apiClient.request<Pet[]>({
      path: '/pets',
      method: 'GET',
    });

    return response.data ?? [];
  }

  async fetchPetById(id: string): Promise<Pet | null> {
    const response = await apiClient.request<Pet>({
      path: `/pets/${id}`,
      method: 'GET',
    });

    return response.data ?? null;
  }

  async createPet(pet: Pet): Promise<Pet> {
    const response = await apiClient.request<Pet, Pet>({
      path: '/pets',
      method: 'POST',
      body: pet,
    });

    if (!response.data) {
      throw new Error('Failed to create pet');
    }

    return response.data;
  }

  async updatePet(pet: Pet): Promise<Pet> {
    const response = await apiClient.request<Pet, Pet>({
      path: `/pets/${pet.id}`,
      method: 'PUT',
      body: pet,
    });

    if (!response.data) {
      throw new Error('Failed to update pet');
    }

    return response.data;
  }

  async deletePet(id: string): Promise<void> {
    await apiClient.request<void>({
      path: `/pets/${id}`,
      method: 'DELETE',
    });
  }
}

export const createPetRemoteDataSource = (): PetRemoteDataSource =>
  new PetRemoteDataSourceImpl();

