import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import { icons } from '../../../../shared/assets/icons';
import { useTheme } from '../../../../shared/hooks/useTheme';
import type { SmartHealthRecord } from '../../domain/models/SmartHealthRecord';

export interface SmartHealthRecordItemProps {
  record: SmartHealthRecord;
  onUpdate: () => void;
}

function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const SmartHealthRecordItem: React.FC<SmartHealthRecordItemProps> = ({
  record,
  onUpdate,
}) => {
  const { colors, radius, space, spacing, textStyles, fontFamilies } =
    useTheme();
  const isVaccination = record.type === 'vaccination';

  const badgeBg =
    record.status === 'completed'
      ? colors.successSurface
      : record.status === 'overdue'
      ? colors.brandTint20
      : record.status === 'locked'
      ? colors.infoSurface
      : colors.brandTint12;
  const badgeText =
    record.status === 'completed'
      ? colors.success
      : record.status === 'overdue'
      ? colors.danger
      : record.status === 'locked'
      ? colors.info
      : colors.warning;
  const statusLabel =
    record.status === 'completed'
      ? 'COMPLETED'
      : record.status === 'overdue'
      ? 'OVERDUE'
      : record.status === 'locked'
      ? 'LOCKED'
      : 'UPCOMING';
  const detailPrefix =
    record.status === 'completed' ? 'Administered' : 'Scheduled';
  const cadenceSuffix =
    record.type === 'deworming' &&
    record.recurrenceType === 'quarterly' &&
    record.status !== 'completed'
      ? ' • Every 3 months'
      : '';

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: radius.lg,
          backgroundColor: colors.surfaceAlt,
          borderColor: colors.borderSubtle,
          padding: space('md'),
        },
      ]}
    >
      <View style={[styles.row, { gap: space('md') }]}>
        <View
          style={[
            styles.iconCircle,
            {
              borderRadius: radius.round,
              backgroundColor: colors.surface,
              width: spacing['4xl'],
              height: spacing['4xl'],
            },
          ]}
        >
          {isVaccination ? (
            <icons.vaccineIcon width={19} height={21} />
          ) : (
            <icons.dewormIcon width={20} height={20} />
          )}
        </View>

        <View style={[styles.infoCol, { gap: space('xs') }]}>
          <View
            style={[
              styles.badge,
              {
                borderRadius: radius.round,
                backgroundColor: badgeBg,
                paddingHorizontal: space('sm'),
                paddingVertical: space('xs'),
              },
            ]}
          >
            <AppText
              style={[
                textStyles.overline,
                { color: badgeText, fontFamily: fontFamilies.bold },
              ]}
            >
              {statusLabel}
            </AppText>
          </View>
          <AppText
            style={[
              textStyles.subtitle,
              { color: colors.text.heading, fontFamily: fontFamilies.bold },
            ]}
            numberOfLines={2}
          >
            {record.name}
          </AppText>
          <AppText
            style={[
              textStyles.caption,
              { color: colors.text.secondary, fontFamily: fontFamilies.medium },
            ]}
            numberOfLines={2}
          >
            {detailPrefix} {formatDate(record.dueDate)}
            {cadenceSuffix}
          </AppText>
        </View>
      </View>

      {record.status !== 'completed' && record.status !== 'locked' ? (
        <View style={{ marginTop: space('md'), alignItems: 'flex-end' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Update ${record.name} date`}
            onPress={onUpdate}
            style={({ pressed }) => [
              styles.updateBtn,
              {
                borderRadius: radius.round,
                backgroundColor: colors.accent,
                opacity: pressed ? 0.9 : 1,
                paddingHorizontal: space('lg'),
                paddingVertical: space('sm'),
              },
            ]}
          >
            <AppText
              style={[
                textStyles.subtitle,
                { color: colors.text.inverse, fontFamily: fontFamilies.bold },
              ]}
            >
              Update
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  badge: {
    alignSelf: 'flex-start',
  },
  updateBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 96,
  },
});
