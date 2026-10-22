import { useEffect, useRef, type RefObject } from 'react';

import type { MascotHandle } from '../../../../shared/components/Mascot';
import {
  careEventMatchesPetFilter,
  mascotReactionForCareEvent,
} from '../../domain/utils/careMascotReactions';
import { subscribeToCareCompletions } from '../../store/scheduleStore';

/**
 * Plays `success` / `celebrate` on the mascot whenever a care task is genuinely
 * completed (saved and newly done), for the pet(s) the screen is showing.
 *
 * The mapping lives in `careMascotReactions`; this hook only wires the event
 * stream to the mascot's handle. A task that fails to save, was already done,
 * or is merely tapped never reaches it.
 */
export function useCareCompletionReactions(
  mascotRef: RefObject<MascotHandle | null>,
  petFilter: 'all' | string,
): void {
  const filterRef = useRef(petFilter);
  filterRef.current = petFilter;

  useEffect(
    () =>
      subscribeToCareCompletions(event => {
        if (!careEventMatchesPetFilter(event.petId, filterRef.current)) {
          return;
        }
        mascotRef.current?.react(mascotReactionForCareEvent(event));
      }),
    [mascotRef],
  );
}
