import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { HealthRecord } from '../../../../records/domain/models/HealthRecord';
import { AppText } from '../../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../../shared/components/MaterialIcon';
import type { IconName } from '../../../../../shared/components/MaterialIcon';
import { healthRecordIconName } from './healthRecordVisuals';
import { useTheme } from '../../../../../shared/hooks/useTheme';
import type { Theme } from '../../../../../shared/hooks/useTheme';
import type { AppColors } from '../../../../../shared/theme/colors';

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
    const iconShell = useMemo(
      () => iconShellFromIconName(colors, iconName),
      [colors, iconName],
    );

    const styles = useMemo(
      () =>
        createStyles({
          radius,
          spacing,
          iconShell,
        }),
      [radius, spacing, iconShell],
    );

    return (
      <View
        style={[
          styles.card,
          theme.shadows.sm,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.xl,
            borderColor: colors.borderSubtle,
            borderWidth: 1,
            padding: spacing.lg,
            gap: spacing.md,
          },
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.iconTile}>
            <MaterialIcon name={iconName} size={18} color={iconShell.fg} />
          </View>

          <View style={styles.infoCol}>
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
              {record.category} · {formatShortRecordDate(record.date)}
            </AppText>
          </View>

          <View
            style={[
              styles.tag,
              {
                backgroundColor: colors.successSurface,
                borderRadius: radius.pill,
              },
            ]}
          >
            <MaterialIcon name="check" size={12} color={colors.success} />
            <AppText
              style={[
                textStyles.footer,
                { color: colors.success, fontFamily: fontFamilies.bold },
              ]}
            >
              Done
            </AppText>
          </View>
        </View>

        <Pressable
          onPress={onPressDetails}
          accessibilityRole="button"
          accessibilityLabel="Record details"
          hitSlop={8}
          style={styles.detailsBtn}
        >
          <AppText
            style={[
              textStyles.caption,
              { color: colors.accent, fontFamily: fontFamilies.bold },
            ]}
          >
            Details
          </AppText>
        </Pressable>
      </View>
    );
  });

function iconShellFromIconName(
  colors: AppColors,
  iconName: IconName,
): { bg: string; fg: string } {
  if (iconName === 'vaccines') {
    return { bg: colors.infoSurface, fg: colors.info };
  }
  return { bg: colors.brandTint12, fg: colors.accent };
}

PetProfileHealthRecordCard.displayName = 'PetProfileHealthRecordCard';

interface StyleParams {
  radius: Theme['radius'];
  spacing: Theme['spacing'];
  iconShell: { bg: string; fg: string };
}

const createStyles = ({ radius, spacing, iconShell }: StyleParams) =>
  StyleSheet.create({
    card: {},
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconTile: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: iconShell.bg,
      width: spacing['2xl'],
      height: spacing['2xl'],
    },
    infoCol: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xxs,
    },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs,
      gap: spacing.xs,
    },
    detailsBtn: {
      alignSelf: 'flex-start',
      paddingVertical: spacing.xxs,
    },
  });
