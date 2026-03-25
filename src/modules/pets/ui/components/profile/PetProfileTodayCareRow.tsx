import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { HomeDashboardTodayCareItem } from '../../../../app/domain/models/HomeDashboardViewModel';
import { AppText } from '../../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../../shared/components/MaterialIcon';
import { reminderTypeIcon } from '../../../../../shared/utils/reminderTypeIcon';
import type { Theme } from '../../../../../shared/hooks/useTheme';
import { useTheme } from '../../../../../shared/hooks/useTheme';

export interface PetProfileTodayCareRowProps {
  item: HomeDashboardTodayCareItem;
  index: number;
}

function iconShellFromIconName(
  theme: Theme,
  iconName: ReturnType<typeof reminderTypeIcon>,
): { bg: string; fg: string } {
  const { colors } = theme;

  if (iconName === 'pill') {
    return { bg: colors.infoSurface, fg: colors.info };
  }

  if (iconName === 'directions_walk') {
    return { bg: colors.successSurface, fg: colors.success };
  }

  return { bg: colors.brandTint12, fg: colors.accent };
}

export const PetProfileTodayCareRow: React.FC<PetProfileTodayCareRowProps> =
  React.memo(({ item, index: _index }) => {
    const theme = useTheme();
    const { colors, radius, shadows, spacing, textStyles, fontFamilies } =
      theme;

    const { reminder, showCompletedCheck } = item;
    const iconName = reminderTypeIcon(reminder.type);
    const shell = iconShellFromIconName(theme, iconName);
    const subtitle =
      reminder.time.trim().length > 0 ? reminder.time : 'All day';

    return (
      <View
        style={[
          styles.row,
          {
            height: spacing['6xl'] * 1.2,
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderColor: showCompletedCheck
              ? colors.brandTint20
              : colors.brandTint10,
            borderWidth: 1,
            padding: spacing.lg,
            gap: spacing.md,
          },
          shadows.sm,
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            {
              borderRadius: radius.md,
              backgroundColor: shell.bg,
              width: spacing['2xl'] + spacing.sm,
              height: spacing['2xl'] + spacing.sm,
            },
          ]}
        >
          <MaterialIcon name={iconName} size={22} color={shell.fg} />
        </View>

        <View style={[styles.rowText, { gap: spacing.xxs }]}>
          <AppText
            style={[
              textStyles.caption,
              { color: colors.text.heading, fontFamily: fontFamilies.bold },
            ]}
            numberOfLines={1}
          >
            {reminder.title}
          </AppText>
          <AppText
            style={[textStyles.footer, { color: colors.text.secondary }]}
            numberOfLines={1}
          >
            {subtitle}
          </AppText>
        </View>

        <View style={[styles.status, { width: spacing['2xl'] }]}>
          {showCompletedCheck ? (
            <MaterialIcon
              name="check_circle"
              size={24}
              color={colors.primary}
            />
          ) : (
            <View
              style={[
                styles.pendingRing,
                {
                  borderColor: colors.border,
                  width: spacing.lg + spacing.xs,
                  height: spacing.lg + spacing.xs,
                  borderRadius: radius.round,
                },
              ]}
            />
          )}
        </View>
      </View>
    );
  });

PetProfileTodayCareRow.displayName = 'PetProfileTodayCareRow';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  status: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingRing: {
    borderWidth: 2,
  },
});
