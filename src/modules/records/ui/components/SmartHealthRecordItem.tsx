import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import { Button } from '../../../../shared/components/Button';
import { icons } from '../../../../shared/assets/icons';
import { useTheme } from '../../../../shared/hooks/useTheme';
import type { SmartHealthRecord } from '../../domain/models/SmartHealthRecord';

export interface SmartHealthRecordItemProps {
  record: SmartHealthRecord;
  onMarkAsDone: () => void;
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
  onMarkAsDone,
}) => {
  const { colors, radius, space, spacing, textStyles, fontFamilies } = useTheme();
  const isVaccination = record.type === 'vaccination';

  const badgeBg =
    record.status === 'completed'
      ? colors.successSurface
      : record.status === 'overdue'
      ? colors.brandTint20
      : colors.brandTint12;
  const badgeText =
    record.status === 'completed'
      ? colors.success
      : record.status === 'overdue'
      ? colors.danger
      : colors.warning;
  const statusLabel =
    record.status === 'completed'
      ? 'COMPLETED'
      : record.status === 'overdue'
      ? 'OVERDUE'
      : 'UPCOMING';
  const detailPrefix =
    record.status === 'completed' ? 'Administered' : 'Scheduled';

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
          <AppText
            style={[
              textStyles.subtitle,
              { color: colors.text.heading, fontFamily: fontFamilies.bold },
            ]}
            numberOfLines={1}
          >
            {record.name}
          </AppText>
          <AppText
            style={[
              textStyles.caption,
              { color: colors.text.secondary, fontFamily: fontFamilies.medium },
            ]}
          >
            {detailPrefix} {formatDate(record.dueDate)}
          </AppText>
        </View>

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
      </View>

      {record.status === 'upcoming' || record.status === 'overdue' ? (
        <View style={{ marginTop: space('md') }}>
          <Button
            title="Mark as Done"
            onPress={onMarkAsDone}
            variant="primary"
            style={{ borderRadius: radius.round, minHeight: spacing['4xl'] }}
            textStyle={{ fontFamily: fontFamilies.bold }}
          />
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
});
