import type {
  MascotMood,
  MascotReaction,
} from '../../../../shared/components/Mascot/mascotTypes';
import type { CareCompletionEvent } from '../models/CareCompletionEvent';
import type { CareDayViewModel } from './careAggregator';

/**
 * Which mascot reaction a care event deserves. Pure: no React, no animation code.
 * - a task done            -> `success`
 * - the whole day now done -> `celebrate` (replaces `success`, never both)
 */
export function mascotReactionForCareEvent(
  event: CareCompletionEvent,
): MascotReaction {
  return event.dayCompleted ? 'celebrate' : 'success';
}

/**
 * Persistent mood for the Care tab's mascot. Overdue is a calm, attentive
 * `nudge` (never sad or scolding); everything done is `proud`.
 */
export function careMascotMood(
  view: Pick<CareDayViewModel, 'allGood' | 'attentionItem'>,
): MascotMood {
  if (view.attentionItem?.urgency === 'overdue') {
    return 'nudge';
  }
  if (view.allGood) {
    return 'proud';
  }
  return 'happy';
}

/** Should a completion for `eventPetId` animate a mascot filtered to `petFilter`? */
export function careEventMatchesPetFilter(
  eventPetId: string,
  petFilter: 'all' | string,
): boolean {
  return petFilter === 'all' || petFilter === eventPetId;
}
