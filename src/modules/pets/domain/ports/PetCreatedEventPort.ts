import type { PetCreatedEvent } from '../models/PetCreatedEvent';

export type PetCreatedUnsubscribe = () => void;
export type PetCreatedListener = (event: PetCreatedEvent) => void;

/**
 * Tells interested parties (e.g. the mascot) that a pet profile was created.
 * Implemented in the application layer; the use case depends only on this port.
 */
export interface PetCreatedEventPort {
  subscribe(listener: PetCreatedListener): PetCreatedUnsubscribe;
  emit(event: PetCreatedEvent): void;
}
