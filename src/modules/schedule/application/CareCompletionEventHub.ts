import type { CareCompletionEvent } from '../domain/models/CareCompletionEvent';
import type {
  CareCompletionEventPort,
  CareCompletionListener,
  CareCompletionUnsubscribe,
} from '../domain/ports/CareCompletionEventPort';

/**
 * Application-layer implementation of {@link CareCompletionEventPort}.
 */
export class CareCompletionEventHub implements CareCompletionEventPort {
  private readonly listeners = new Set<CareCompletionListener>();

  subscribe(listener: CareCompletionListener): CareCompletionUnsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: CareCompletionEvent): void {
    for (const listener of [...this.listeners]) {
      try {
        listener(event);
      } catch {
        // Never let a listener break the bus or the completion flow
      }
    }
  }
}
