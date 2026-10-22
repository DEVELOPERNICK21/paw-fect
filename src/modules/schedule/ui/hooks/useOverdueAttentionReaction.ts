import { useEffect, useMemo, useRef, useState } from 'react';

import type { MascotReactionRequest } from '../../../../shared/components/Mascot';
import { getTodayIsoDateLocal } from '../../../../shared/utils/calendarDate';
import {
  createOverdueAttentionTracker,
  mascotReactionForOverdue,
  overdueAttentionKeys,
} from '../../domain/utils/careAttention';
import type { CareAggregatedItem } from '../../domain/utils/careAggregator';

/**
 * A mascot request that fires when a care task *newly* becomes overdue on screen (including
 * the first time the screen shows one). It stays quiet for tasks it already looked up for,
 * for completed ones, and on re-renders. The persistent calm look while something is
 * overdue is the `nudge` mood, set separately.
 */
export function useOverdueAttentionReaction(
  items: readonly CareAggregatedItem[],
): MascotReactionRequest | null {
  const tracker = useRef(createOverdueAttentionTracker()).current;
  const [request, setRequest] = useState<MascotReactionRequest | null>(null);
  const sequence = useRef(0);

  const keysSignature = useMemo(
    () => overdueAttentionKeys(items, getTodayIsoDateLocal()).join('\n'),
    [items],
  );

  useEffect(() => {
    const keys = keysSignature === '' ? [] : keysSignature.split('\n');
    if (tracker.observe(keys)) {
      sequence.current += 1;
      setRequest({
        reaction: mascotReactionForOverdue(),
        id: `overdue-attention:${sequence.current}`,
      });
    }
  }, [keysSignature, tracker]);

  return request;
}
