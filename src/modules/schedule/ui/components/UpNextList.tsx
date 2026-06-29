import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import type { DailyCareBlock } from '../../domain/models/DailyCareBlock';
import { careCategoryIcon } from '../utils/careCategoryIcon';
import { formatScheduleTimeLabel } from '../utils/scheduleDisplay';

export interface UpNextListProps {
  blocks: DailyCareBlock[];
  onSelectBlock: (blockId: string) => void;
}

export const UpNextList: React.FC<UpNextListProps> = ({ blocks, onSelectBlock }) => {
  const { colors, spacing, radius, textStyles, fontFamilies } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          gap: spacing.sm,
        },
        scroll: {
          gap: spacing.sm,
        },
        card: {
          width: 148,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surface,
          padding: spacing.md,
          gap: spacing.xs,
        },
        cardHead: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
      }),
    [colors, radius, spacing],
  );

  if (blocks.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <AppText
        style={[
          textStyles.caption,
          { color: colors.text.secondary, fontFamily: fontFamilies.semibold },
        ]}
      >
        Up next
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {blocks.map(block => (
          <Pressable
            key={block.id}
            style={styles.card}
            onPress={() => onSelectBlock(block.id)}
            accessibilityRole="button"
          >
            <View style={styles.cardHead}>
              <MaterialIcon
                name={careCategoryIcon(block.category)}
                size={16}
                color={colors.primary}
              />
              <AppText
                numberOfLines={2}
                style={[
                  textStyles.caption,
                  { color: colors.text.heading, fontFamily: fontFamilies.semibold, flex: 1 },
                ]}
              >
                {block.title}
              </AppText>
            </View>
            <AppText style={[textStyles.footer, { color: colors.text.secondary }]}>
              {formatScheduleTimeLabel(block.scheduledTime)}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};
