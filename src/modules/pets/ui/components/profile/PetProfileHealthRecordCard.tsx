import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { HealthRecord } from '../../../../records/domain/models/HealthRecord';
import { AppText } from '../../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../../shared/components/MaterialIcon';
import type { IconName } from '../../../../../shared/components/MaterialIcon';
import { healthRecordIconName } from './healthRecordVisuals';
import { useTheme } from '../../../../../shared/hooks/useTheme';

export interface PetProfileHealthRecordCardProps {
  record: HealthRecord;
  onPressDetails: () => void;
}

function formatShortRecordDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const PetProfileHealthRecordCard: React.FC<PetProfileHealthRecordCardProps> =
  React.memo(({ record, onPressDetails }) => {
    const theme = useTheme();
    const { colors, radius, spacing, textStyles, fontFamilies } = theme;

    const iconName = healthRecordIconName(record);
    const iconShell = iconShellFromIconName(colors, iconName);

    return (
      <View
        style={[
          styles.card,
          {
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            backgroundColor: colors.surface,
            padding: spacing.lg,
            gap: spacing.md,
          },
        ]}
      >
        <View style={[styles.topRow, { gap: spacing.md }]}>
          <View
            style={[
              styles.iconTile,
              {
                borderRadius: radius.md,
                backgroundColor: iconShell.bg,
                width: spacing['2xl'],
                height: spacing['2xl'],
              },
            ]}
          >
            <MaterialIcon name={iconName} size={20} color={iconShell.fg} />
          </View>

          <View style={{ flex: 1, minWidth: 0, gap: spacing.xxs }}>
            <AppText
              style={[
                textStyles.caption,
                { color: colors.text.heading, fontFamily: fontFamilies.bold },
              ]}
              numberOfLines={2}
            >
              {record.title}
            </AppText>
            <AppText
              style={[textStyles.footer, { color: colors.text.secondary }]}
              numberOfLines={1}
            >
              {record.category} • {formatShortRecordDate(record.date)}
            </AppText>
          </View>
        </View>

        <View
          style={[
            styles.tag,
            {
              borderRadius: radius.xs,
              backgroundColor: colors.successSurface,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xxs,
              alignSelf: 'flex-start',
              gap: spacing.xs,
            },
          ]}
        >
          <MaterialIcon name="check" size={14} color={colors.success} />
          <AppText
            style={[
              textStyles.footer,
              { color: colors.success, fontFamily: fontFamilies.bold },
            ]}
          >
            COMPLETED
          </AppText>
        </View>

        <Pressable
          onPress={onPressDetails}
          accessibilityRole="button"
          accessibilityLabel="Record details"
          hitSlop={8}
          style={{
            alignSelf: 'center',
            backgroundColor: colors.surface,
            padding: spacing.xs,
            borderRadius: radius.md,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          }}
        >
          <AppText
            style={[
              textStyles.subtitle,
              { color: colors.text.secondary, fontFamily: fontFamilies.bold },
            ]}
          >
            Details
          </AppText>
        </Pressable>
      </View>
    );
  });

function iconShellFromIconName(
  colors: ReturnType<typeof useTheme>['colors'],
  iconName: IconName,
): { bg: string; fg: string } {
  if (iconName === 'vaccines') {
    return { bg: colors.infoSurface, fg: colors.info };
  }
  return { bg: colors.brandTint12, fg: colors.accent };
}

PetProfileHealthRecordCard.displayName = 'PetProfileHealthRecordCard';

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconTile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
