import React, { useMemo } from 'react';
import { useIsFocused } from '@react-navigation/native';

import {
  CompanionBubble,
  companionLines,
} from '../../../../shared/components/Companion';
import type { MascotMood } from '../../../../shared/components/Mascot';
import {
  type HealthSummary,
} from '../../domain/utils/healthSummary';
import { careWhatLabel } from '../../domain/utils/careOwnerCopy';
import { useHealthRecordOpenReaction } from '../hooks/useHealthRecordOpenReaction';

export interface HealthMascotProps {
  petId: string | null;
  petName: string;
  species: 'dog' | 'cat';
  summary: HealthSummary;
  size?: number;
}

const MOOD_BY_TONE: Record<HealthSummary['tone'], MascotMood> = {
  attention: 'nudge',
  soon: 'curious',
  ontrack: 'proud',
  empty: 'thinking',
};

/**
 * The app character on the Health screen. It looks curious each time the screen
 * opens, and says what the plan means in one friendly sentence.
 */
export const HealthMascot: React.FC<HealthMascotProps> = ({
  petId,
  petName,
  species,
  summary,
  size = 76,
}) => {
  const isFocused = useIsFocused();
  const reactionRequest = useHealthRecordOpenReaction(petId);

  const lines = useMemo(
    () =>
      companionLines({
        scene: 'health',
        petName,
        tone: summary.tone,
        overdueCount: summary.overdue,
        nextLabel: summary.next ? careWhatLabel(summary.next) : undefined,
        nextDays: summary.daysToNext ?? undefined,
      }),
    [petName, summary],
  );

  return (
    <CompanionBubble
      species={species}
      mood={MOOD_BY_TONE[summary.tone]}
      lines={lines}
      size={size}
      paused={!isFocused}
      reactionRequest={reactionRequest}
      testID="health-record-mascot"
    />
  );
};
