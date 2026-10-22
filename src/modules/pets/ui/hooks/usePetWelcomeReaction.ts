import { useEffect, useState } from 'react';

import type { MascotReactionRequest } from '../../../../shared/components/Mascot';
import { mascotReactionForPetCreated } from '../../domain/utils/petMascotReactions';
import { subscribeToPetCreated } from '../../store/petStore';

/**
 * Turns "a pet profile was created" into a mascot request.
 *
 * The screen hosting the mascot is usually mounted but not focused at the moment the pet
 * is saved (the Add Pet form is on top), so this returns a *request* the mascot plays as
 * soon as it is loaded and visible, instead of calling the mascot straight away. Each pet
 * is welcomed at most once; a request that cannot play within a few seconds is dropped.
 */
export function usePetWelcomeReaction(): MascotReactionRequest | null {
  const [request, setRequest] = useState<MascotReactionRequest | null>(null);

  useEffect(
    () =>
      subscribeToPetCreated(event => {
        setRequest({
          reaction: mascotReactionForPetCreated(event),
          id: `pet-created:${event.petId}`,
        });
      }),
    [],
  );

  return request;
}
