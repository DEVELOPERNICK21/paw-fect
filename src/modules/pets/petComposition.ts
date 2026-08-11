/**
 * Composition root for the pets module: wires repository implementations to use cases.
 */
import { useSmartHealthRecordStore } from '../records/store/smartHealthRecordStore';
import { ensureNotificationsReady } from '../../infrastructure/notifications/notificationDiagnostics';
import { notificationService } from '../../infrastructure/notifications/notificationService';
import {
  cancelDailyRoutineForPet,
  syncDailyRoutineNotificationsForPets,
} from '../../infrastructure/notifications/dailyCareNotifications';
import { createFirestorePetPhotoEncoder } from './data/photos/FirestorePetPhotoEncoder';
import { createPetRepository } from './data/repositories/PetRepositoryImpl';
import type { Pet } from './domain/models/Pet';
import { GetPets } from './domain/usecases/GetPets';
import { GetPetById } from './domain/usecases/GetPetById';
import { GetActivePetId } from './domain/usecases/GetActivePetId';
import { CreatePet } from './domain/usecases/CreatePet';
import { UpdatePet } from './domain/usecases/UpdatePet';
import { DeletePet } from './domain/usecases/DeletePet';
import { SetActivePet } from './domain/usecases/SetActivePet';
import { CreatePetProfile } from './domain/usecases/CreatePetProfile';
import { BuildPetHealthCardViewModel } from './domain/usecases/BuildPetHealthCardViewModel';
import { PreparePetPhoto } from './domain/usecases/PreparePetPhoto';
import type { PetHealthCardViewModel } from './domain/models/PetHealthCardViewModel';
import { registerPetCoordinationPorts } from './store/petCoordinationPorts';

const repository = createPetRepository();
const petPhotoEncoder = createFirestorePetPhotoEncoder();

registerPetCoordinationPorts({
  bootstrapPetHealthSchedule: async input => {
    await useSmartHealthRecordStore.getState().bootstrapPetSchedule({
      petId: input.petId,
      petType: input.petType,
      dateOfBirth: input.dateOfBirth,
      region: input.region,
      lifestyleType: input.lifestyleType,
      lifestyleRiskLevel: input.lifestyleRiskLevel,
      lastVaccinationDate: input.lastVaccinationDate,
      lastRabiesDate: input.lastRabiesDate,
      lastDewormingDate: input.lastDewormingDate,
    });
  },
  resyncHealthRecordsAfterPetRemoval: async nextActivePetId => {
    useSmartHealthRecordStore.getState().reset();
    if (nextActivePetId) {
      await useSmartHealthRecordStore.getState().loadPetRecords(nextActivePetId);
    }
  },
  getLastHealthMilestones: async petId => {
    await useSmartHealthRecordStore.getState().loadPetRecords(petId);
    const records = useSmartHealthRecordStore
      .getState()
      .records.filter(r => r.petId === petId && r.status === 'completed');

    const dewormDone = records
      .filter(r => r.type === 'deworming')
      .sort((a, b) => b.dueDate.localeCompare(a.dueDate));

    const vaccinationDone = records
      .filter(r => r.type === 'vaccination')
      .sort((a, b) =>
        (b.completedDate ?? b.dueDate).localeCompare(
          a.completedDate ?? a.dueDate,
        ),
      );

    const rabiesDone = vaccinationDone.filter(
      r => r.family?.toLowerCase() === 'rabies',
    );

    return {
      lastDewormingDate: dewormDone[0]?.dueDate,
      lastVaccinationDate:
        vaccinationDone[0]?.completedDate ?? vaccinationDone[0]?.dueDate,
      lastRabiesDate:
        rabiesDone[0]?.completedDate ?? rabiesDone[0]?.dueDate,
    };
  },
});

export const petComposition = {
  getPets: new GetPets(repository),
  getPetById: new GetPetById(repository),
  getActivePetId: new GetActivePetId(repository),
  createPet: new CreatePet(repository),
  updatePet: new UpdatePet(repository),
  deletePet: new DeletePet(repository),
  setActivePet: new SetActivePet(repository),
  createPetProfile: new CreatePetProfile(),
  preparePetPhoto: new PreparePetPhoto(petPhotoEncoder),
  syncDailyRoutineNotifications: async (pets: Pet[]): Promise<void> => {
    const granted = await ensureNotificationsReady();
    if (!granted) {
      return;
    }
    await syncDailyRoutineNotificationsForPets(
      pets.map(p => ({ id: p.id, name: p.name, type: p.type })),
      notificationService,
    );
  },
  cancelDailyRoutineNotificationsForPet: async (petId: string): Promise<void> => {
    await cancelDailyRoutineForPet(petId, notificationService);
  },
  cancelDailyRoutineNotificationsForPets: async (pets: Pet[]): Promise<void> => {
    await Promise.all(
      pets.map(pet =>
        cancelDailyRoutineForPet(pet.id, notificationService),
      ),
    );
  },
  /**
   * Builds the share-card view model for a pet. Pulls the pet from the repo
   * and the pet's smart-health records via the smart-health record store
   * (loaded on demand). Used by `PetHealthCardShareScreen` and the milestone
   * celebration modal preview.
   */
  buildPetHealthCard: async (
    userId: string,
    petId: string,
  ): Promise<PetHealthCardViewModel> => {
    const usecase = new BuildPetHealthCardViewModel({
      getPetById: async (uid, pid) => repository.getPetById(uid, pid),
      listSmartHealthRecords: async (_uid, pid) => {
        await useSmartHealthRecordStore.getState().loadPetRecords(pid);
        return useSmartHealthRecordStore
          .getState()
          .records.filter(r => r.petId === pid);
      },
    });
    return usecase.execute({ userId, petId });
  },
} as const;
