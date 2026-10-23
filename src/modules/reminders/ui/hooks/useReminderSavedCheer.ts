import { useEffect, useMemo, useState } from 'react';

import type { MascotReactionRequest } from '../../../../shared/components/Mascot';

/** How long the companion's "Got it!" stays on the list. */
export const SAVED_CHEER_VISIBLE_MS = 8000;

export interface ReminderSavedCheer {
  petName?: string;
  request: MascotReactionRequest;
}

/**
 * Right after a reminder is saved, the list shows the companion cheering (`success`) for a few
 * seconds. Keyed by `savedAt`, so each save cheers once and an old param (e.g. restored
 * navigation state) does nothing.
 */
export function useReminderSavedCheer(
  params: { savedAt?: number; savedPetName?: string } | undefined,
  now: () => number = Date.now,
): ReminderSavedCheer | null {
  const savedAt = params?.savedAt;
  const petName = params?.savedPetName;
  const [visibleFor, setVisibleFor] = useState<number | null>(null);

  useEffect(() => {
    if (savedAt == null || now() - savedAt > SAVED_CHEER_VISIBLE_MS) {
      setVisibleFor(null);
      return undefined;
    }
    setVisibleFor(savedAt);
    const timer = setTimeout(
      () => setVisibleFor(null),
      SAVED_CHEER_VISIBLE_MS - (now() - savedAt),
    );
    return () => clearTimeout(timer);
  }, [savedAt, now]);

  return useMemo(
    () =>
      visibleFor == null
        ? null
        : {
            petName,
            request: { reaction: 'success', id: `reminder-saved-${visibleFor}` },
          },
    [visibleFor, petName],
  );
}
