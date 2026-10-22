import { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';

import type { MascotReactionRequest } from '../../../../shared/components/Mascot';
import {
  INITIAL_HEALTH_RECORD_OPEN_STATE,
  stepHealthRecordOpen,
  type HealthRecordOpenState,
} from '../../domain/utils/recordMascotReactions';

interface OpenTracking {
  open: HealthRecordOpenState;
  request: MascotReactionRequest | null;
}

/**
 * A mascot request that fires each time the health record screen is opened for a pet.
 * The mapping and the "what counts as an open" rules live in `recordMascotReactions`;
 * this hook only feeds them the screen's focus and the pet being shown.
 */
export function useHealthRecordOpenReaction(
  petId: string | null,
): MascotReactionRequest | null {
  const focused = useIsFocused();
  const [tracking, setTracking] = useState<OpenTracking>({
    open: INITIAL_HEALTH_RECORD_OPEN_STATE,
    request: null,
  });

  useEffect(() => {
    setTracking(prev => {
      const step = stepHealthRecordOpen(prev.open, { focused, petId });
      if (step.state === prev.open && step.request == null) {
        return prev;
      }
      return { open: step.state, request: step.request ?? prev.request };
    });
  }, [focused, petId]);

  return tracking.request;
}
