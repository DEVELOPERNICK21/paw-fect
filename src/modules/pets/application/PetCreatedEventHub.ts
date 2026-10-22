import type { PetCreatedEvent } from '../domain/models/PetCreatedEvent';
import type {
  PetCreatedEventPort,
  PetCreatedListener,
  PetCreatedUnsubscribe,
} from '../domain/ports/PetCreatedEventPort';

/**
 * Application-layer implementation of {@link PetCreatedEventPort}.
 */
export class PetCreatedEventHub implements PetCreatedEventPort {
  private readonly listeners = new Set<PetCreatedListener>();

  subscribe(listener: PetCreatedListener): PetCreatedUnsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: PetCreatedEvent): void {
    for (const listener of [...this.listeners]) {
      try {
        listener(event);
      } catch {
        // Never let a listener break the bus or pet creation
      }
    }
  }
}
