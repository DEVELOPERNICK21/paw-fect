import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { resolvePetAvatarSource } from '../../../../shared/utils/petDisplayPhoto';
import type { CareAggregatedItem } from '../../domain/utils/careAggregator';
import { careTaskShortVerb } from '../../domain/utils/careTaskCopy';
import { careCategoryIcon } from '../utils/careCategoryIcon';

export interface CareUpNextListProps {
  title: string;
  items: CareAggregatedItem[];
  onSelect?: (item: CareAggregatedItem) => void;
}

/**
 * Level-2 compact rows — WHO · WHAT · WHEN.
 */
export const CareUpNextList: React.FC<CareUpNextListProps> = ({
  title,
  items,
  onSelect,
}) => {
  const { colors, spacing, radius, textStyles, fontFamilies, shadows } =
    useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { gap: spacing.sm },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          minHeight: 64,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surface,
        },
        avatar: {
          width: 40,
          height: 40,
          borderRadius: radius.round,
        },
        iconWell: {
          width: 32,
          height: 32,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.brandTint10,
        },
        textCol: { flex: 1, minWidth: 0, gap: 2 },
        time: {
          fontVariant: ['tabular-nums'],
        },
      }),
    [colors, radius, spacing],
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <AppText
        style={[
          textStyles.caption,
          {
            color: colors.text.secondary,
            fontFamily: fontFamilies.semibold,
            letterSpacing: 0.4,
          },
        ]}
      >
        {title}
      </AppText>
      {items.map(item => {
        const what = careTaskShortVerb(item.block);
        const content = (
          <>
            <Image
              source={resolvePetAvatarSource(item.pet)}
              style={styles.avatar}
            />
            <View style={styles.iconWell}>
              <MaterialIcon
                name={careCategoryIcon(item.block.category)}
                size={18}
                color={colors.accent}
              />
            </View>
            <View style={styles.textCol}>
              <AppText
                style={[
                  textStyles.caption,
                  {
                    color: colors.text.heading,
                    fontFamily: fontFamilies.bold,
                  },
                ]}
                numberOfLines={1}
              >
                {item.pet.name}
              </AppText>
              <AppText
                style={[textStyles.footer, { color: colors.text.secondary }]}
                numberOfLines={1}
              >
                {what}
              </AppText>
            </View>
            <AppText
              style={[
                textStyles.caption,
                styles.time,
                {
                  color: colors.text.heading,
                  fontFamily: fontFamilies.semibold,
                },
              ]}
            >
              {item.whenLabel}
            </AppText>
          </>
        );

        if (onSelect) {
          return (
            <Pressable
              key={`${item.pet.id}:${item.block.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${item.pet.name}, ${what}, ${item.whenLabel}`}
              onPress={() => onSelect(item)}
              style={({ pressed }) => [
                styles.row,
                shadows.sm,
                { opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] },
              ]}
            >
              {content}
            </Pressable>
          );
        }

        return (
          <View
            key={`${item.pet.id}:${item.block.id}`}
            style={[styles.row, shadows.sm]}
          >
            {content}
          </View>
        );
      })}
    </View>
  );
};
