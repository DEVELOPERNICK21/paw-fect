import type {
  PetHealthBootstrapParams,
  PetHealthMilestones,
} from '../domain/ports/PetHealthCoordinationPort';

export interface PetCoordinationPorts {
  bootstrapPetHealthSchedule: (
    input: PetHealthBootstrapParams,
  ) => Promise<void>;
  resyncHealthRecordsAfterPetRemoval: (
    nextActivePetId: string | undefined,
  ) => Promise<void>;
  /**
   * Resolves the last completed deworming / vaccination / rabies dates for a pet.
   * Used by pets UI (via petStore) when prefilling the edit form, so UI never inspects records data shapes.
   */
  getLastHealthMilestones: (petId: string) => Promise<PetHealthMilestones>;
}

const warnUnregistered = (scope: string) => async (): Promise<void> => {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn(
      `[petCoordinationPorts] ${scope} called before registration — ensure pets/petComposition is imported at app startup.`,
    );
  }
};

let ports: PetCoordinationPorts = {
  bootstrapPetHealthSchedule: warnUnregistered('bootstrapPetHealthSchedule'),
  resyncHealthRecordsAfterPetRemoval: async () => {},
  getLastHealthMilestones: async () => ({}),
};

export function registerPetCoordinationPorts(next: PetCoordinationPorts): void {
  ports = next;
}

export function getPetCoordinationPorts(): PetCoordinationPorts {
  return ports;
}
