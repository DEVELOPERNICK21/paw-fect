import React, { useMemo, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';

import {
  CompanionBubble,
  companionLines,
} from '../../../../shared/components/Companion';
import type { MascotHandle } from '../../../../shared/components/Mascot';
import { careMascotMood } from '../../domain/utils/careMascotReactions';
import type { CareDayViewModel } from '../../domain/utils/careAggregator';
import { useCareCompletionReactions } from '../hooks/useCareCompletionReactions';
import { useOverdueAttentionReaction } from '../hooks/useOverdueAttentionReaction';

export interface CareMascotProps {
  species: 'dog' | 'cat';
  careView: Pick<CareDayViewModel, 'allGood' | 'attentionItem' | 'items' | 'openCount'>;
  /** Pet the Care tab is showing, or `all`. */
  petFilter: 'all' | string;
  /** Name of the pet the tab is filtered to, if any. */
  petName?: string;
  size?: number;
}

/**
 * The Care tab's mascot: its mood follows today's care; it reacts when a task is
 * genuinely completed (`success` / `celebrate`) and looks up, calmly, when a task
 * newly becomes overdue (`attention`). Pauses while the tab is not focused.
 */
export const CareMascot: React.FC<CareMascotProps> = ({
  species,
  careView,
  petFilter,
  petName,
  size = 76,
}) => {
  const mascotRef = useRef<MascotHandle>(null);
  const isFocused = useIsFocused();
  const mood = careMascotMood(careView);
  useCareCompletionReactions(mascotRef, petFilter);
  const attentionRequest = useOverdueAttentionReaction(careView.items);

  const lines = useMemo(
    () =>
      companionLines({
        scene: 'care',
        petName,
        allGood: careView.allGood,
        overdueCount: careView.items.filter(i => i.urgency === 'overdue')
          .length,
        remaining: careView.openCount,
      }),
    [petName, careView.allGood, careView.items, careView.openCount],
  );

  return (
    <CompanionBubble
      mascotRef={mascotRef}
      species={species}
      mood={mood}
      lines={lines}
      size={size}
      paused={!isFocused}
      reactionRequest={attentionRequest}
      testID="care-mascot"
    />
  );
};
