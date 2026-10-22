import type { CareCompletionEvent } from '../models/CareCompletionEvent';

export type CareCompletionUnsubscribe = () => void;
export type CareCompletionListener = (event: CareCompletionEvent) => void;

/**
 * Notifies interested parties (e.g. the mascot) that a care task was really
 * completed. Implemented in the application layer; the store depends only on
 * this port.
 */
export interface CareCompletionEventPort {
  subscribe(listener: CareCompletionListener): CareCompletionUnsubscribe;
  emit(event: CareCompletionEvent): void;
}
