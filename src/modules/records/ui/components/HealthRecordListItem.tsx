import React, { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import type { HealthRecord } from '../../domain/models/HealthRecord';
import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon, type IconName } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';

export interface HealthRecordListItemProps {
  record: HealthRecord;
  iconName: IconName;
  todayIsoDate: string; // YYYY-MM-DD
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

export const HealthRecordListItem: React.FC<HealthRecordListItemProps> =
  React.memo(({ record, iconName, todayIsoDate }) => {
    const theme = useTheme();
    const {
      colors,
      radius,
      textStyles,
      fontFamilies,
      isDarkMode,
    } = theme;

    const isCompleted = record.date <= todayIsoDate;
    const statusLabel = isCompleted ? 'Completed' : 'Upcoming';
    const statusBg = isCompleted ? colors.successSurface : colors.brandTint12;
    const statusFg = isCompleted ? colors.success : colors.warning;

    const iconFg = useMemo(() => {
      if (iconName === 'vaccines') return colors.accent;
      if (iconName === 'healing') return colors.success;
      return isDarkMode ? colors.text.heading : colors.text.secondary;
    }, [colors, iconName, isDarkMode]);

    const duePrefix = isCompleted ? 'Administered' : 'Scheduled';
    const dueLine = `${duePrefix} ${formatShortRecordDate(record.date)}`;

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderSubtle,
            borderRadius: radius.lg,
          },
        ]}
      >
        <View
          style={[
            styles.iconShell,
            {
              backgroundColor: colors.elevated,
              borderRadius: radius.round,
            },
          ]}
        >
          <MaterialIcon name={iconName} size={22} color={iconFg} />
        </View>

        <View style={styles.body}>
          <View style={styles.topRow}>
            <AppText
              style={[
                textStyles.subtitle,
                { color: colors.text.heading, fontFamily: fontFamilies.bold },
              ]}
              numberOfLines={1}
            >
              {record.title}
            </AppText>

            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: statusBg,
                  borderRadius: radius.round,
                } satisfies ViewStyle,
              ]}
            >
              <AppText
                style={[
                  textStyles.overline,
                  { color: statusFg, fontFamily: fontFamilies.bold },
                ]}
              >
                {statusLabel}
              </AppText>
            </View>
          </View>

          <AppText
            style={[
              textStyles.caption,
              { color: colors.text.secondary, fontFamily: fontFamilies.medium },
            ]}
            numberOfLines={1}
          >
            {dueLine}
          </AppText>
        </View>
      </View>
    );
  });

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconShell: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});

