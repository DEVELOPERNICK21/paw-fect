import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { DailyCareBlock } from '../../domain/models/DailyCareBlock';
import { AppText } from '../../../../shared/components/AppText';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { DayCareBlockCard } from './DayCareBlockCard';
import { groupBlocksForTimeline } from '../utils/schedulePeriod';

export interface DayCareTimelineProps {
  blocks: DailyCareBlock[];
  currentBlockId: string | null;
  expandedBlockId: string | null;
  isPro: boolean;
  onToggleExpand: (blockId: string) => void;
  onToggleComplete: (blockId: string, completed: boolean) => void;
  onSnooze: (blockId: string) => void;
  onOpenActions: (blockId: string) => void;
}

export const DayCareTimeline: React.FC<DayCareTimelineProps> = ({
  blocks,
  currentBlockId,
  expandedBlockId,
  isPro,
  onToggleExpand,
  onToggleComplete,
  onSnooze,
  onOpenActions,
}) => {
  const { colors, spacing, textStyles, fontFamilies } = useTheme();
  const groups = groupBlocksForTimeline(blocks);
  const orderedBlocks = groups.flatMap(group => group.blocks);
  const lastBlockId = orderedBlocks[orderedBlocks.length - 1]?.id;

  return (
    <View style={styles.wrap}>
      {groups.map(group => (
        <View key={group.period} style={{ gap: spacing.md }}>
          <AppText
            style={[
              textStyles.caption,
              {
                color: colors.text.secondary,
                fontFamily: fontFamilies.semibold,
                letterSpacing: 0.6,
                marginLeft: spacing['2xl'] + spacing.sm,
              },
            ]}
          >
            {group.label}
          </AppText>
          {group.blocks.map(block => (
            <DayCareBlockCard
              key={block.id}
              block={block}
              period={group.period}
              isCurrent={block.id === currentBlockId}
              isExpanded={block.id === expandedBlockId}
              isLastInTimeline={block.id === lastBlockId}
              locked={!block.isFreeFeature && !isPro}
              onToggleExpand={() => onToggleExpand(block.id)}
              onToggleComplete={() => onToggleComplete(block.id, !block.isCompleted)}
              onSnooze={() => onSnooze(block.id)}
              onOpenActions={() => onOpenActions(block.id)}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
  },
});
