import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { icons } from '../../../../shared/assets/icons';
import { AppText } from '../../../../shared/components/AppText';
import { useTheme } from '../../../../shared/hooks/useTheme';
import type { SmartHealthRecord } from '../../domain/models/SmartHealthRecord';
import { buildCareOwnerCopy } from '../../domain/utils/careOwnerCopy';

export interface NeedsNextCareCardProps {
  record: SmartHealthRecord;
  petName: string;
  whenLine: string;
  statusLabel: string;
  onMarkDone?: (record: SmartHealthRecord) => void;
  onEditDate?: (record: SmartHealthRecord) => void;
  onSkipDose?: (record: SmartHealthRecord) => void;
  primaryActionLabel?: string;
}

function formatShortDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}

export const NeedsNextCareCard: React.FC<NeedsNextCareCardProps> = React.memo(
  ({
    record,
    petName,
    whenLine,
    statusLabel,
    onMarkDone,
    onEditDate,
    onSkipDose,
    primaryActionLabel = 'I did this',
  }) => {
    const theme = useTheme();
    const { colors, fontFamilies, textStyles, radius, spacing, shadows } =
      theme;
    const copy = useMemo(
      () => buildCareOwnerCopy(record, petName),
      [petName, record],
    );
    const isUrgent =
      record.status === 'overdue' || record.status === 'missed';
    const isWorm = record.type === 'deworming';
    const typeLabel = isWorm ? 'Worm' : 'Shot';
    const TypeIcon = isWorm ? icons.dewormIcon : icons.vaccineIcon;

    const styles = useMemo(
      () =>
        StyleSheet.create({
          card: {
            borderWidth: 1,
          },
          topRow: {
            flexDirection: 'row',
            alignItems: 'center',
          },
          iconTile: {
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
          },
          copyCol: {
            flex: 1,
            minWidth: 0,
          },
          typeRow: {
            flexDirection: 'row',
            alignItems: 'center',
          },
          foot: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
          whenCol: {
            flex: 1,
            minWidth: 0,
          },
          primaryCta: {
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 40,
            paddingHorizontal: spacing.md,
          },
          secondaryRow: {
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
          },
        }),
      [spacing],
    );

    const handleMark = useCallback(() => {
      onMarkDone?.(record);
    }, [onMarkDone, record]);

    return (
      <View
        style={[
          styles.card,
          shadows.sm,
          {
            backgroundColor: isUrgent ? colors.dangerSurface : colors.surface,
            borderColor: isUrgent ? colors.danger : colors.borderSubtle,
            borderRadius: radius.xl,
            padding: spacing.md,
            gap: spacing.sm,
          },
        ]}
      >
        <View style={[styles.topRow, { gap: spacing.sm }]}>
          <View
            style={[
              styles.iconTile,
              {
                backgroundColor: isWorm
                  ? colors.brandTint12
                  : colors.infoSurface,
                borderRadius: radius.md,
              },
            ]}
          >
            <TypeIcon
              width={22}
              height={22}
              // SVG icons may ignore color; tile color still signals type
            />
          </View>

          <View style={styles.copyCol}>
            <View style={[styles.typeRow, { gap: spacing.xs }]}>
              <AppText
                style={[
                  textStyles.footer,
                  {
                    color: isWorm ? colors.accent : colors.info,
                    fontFamily: fontFamilies.bold,
                  },
                ]}
              >
                {typeLabel}
              </AppText>
              <AppText
                style={[textStyles.footer, { color: colors.text.muted }]}
              >
                ·
              </AppText>
              <AppText
                style={[
                  textStyles.footer,
                  {
                    color: isUrgent ? colors.danger : colors.text.subdued,
                    fontFamily: fontFamilies.semibold,
                  },
                ]}
                numberOfLines={1}
              >
                {statusLabel}
              </AppText>
            </View>

            <AppText
              style={[
                textStyles.subtitle,
                {
                  color: colors.text.heading,
                  fontFamily: fontFamilies.bold,
                  marginTop: spacing.xxs,
                },
              ]}
              numberOfLines={1}
            >
              {copy.what}
            </AppText>

            <AppText
              style={[
                textStyles.caption,
                {
                  color: colors.text.secondary,
                  marginTop: spacing.xxs,
                },
              ]}
              numberOfLines={1}
            >
              {copy.why}
            </AppText>
          </View>
        </View>

        <View style={[styles.foot, { gap: spacing.sm }]}>
          <View style={styles.whenCol}>
            <AppText
              style={[
                textStyles.caption,
                {
                  color: isUrgent ? colors.danger : colors.text.heading,
                  fontFamily: fontFamilies.bold,
                },
              ]}
              numberOfLines={1}
            >
              {formatShortDate(record.dueDate)}
            </AppText>
            <AppText
              style={[
                textStyles.footer,
                {
                  color: isUrgent ? colors.danger : colors.text.secondary,
                },
              ]}
              numberOfLines={1}
            >
              {whenLine}
            </AppText>
          </View>

          {onMarkDone ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${primaryActionLabel}: ${copy.what}`}
              onPress={handleMark}
              style={({ pressed }) => [
                styles.primaryCta,
                {
                  backgroundColor: isUrgent ? colors.danger : colors.primary,
                  borderRadius: radius.pill,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <AppText
                style={[
                  textStyles.caption,
                  {
                    color: colors.onAccent,
                    fontFamily: fontFamilies.bold,
                  },
                ]}
              >
                {primaryActionLabel}
              </AppText>
            </Pressable>
          ) : null}
        </View>

        {(onEditDate || onSkipDose) && (
          <View style={[styles.secondaryRow, { gap: spacing.xs }]}>
            {onEditDate ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Change date for ${copy.what}`}
                onPress={() => onEditDate(record)}
                hitSlop={8}
              >
                <AppText
                  style={[
                    textStyles.footer,
                    {
                      color: colors.text.secondary,
                      fontFamily: fontFamilies.semibold,
                    },
                  ]}
                >
                  Change date
                </AppText>
              </Pressable>
            ) : null}
            {isWorm && onSkipDose ? (
              <>
                <AppText
                  style={[textStyles.footer, { color: colors.text.muted }]}
                >
                  ·
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Skip for now ${copy.what}`}
                  onPress={() => onSkipDose(record)}
                  hitSlop={8}
                >
                  <AppText
                    style={[
                      textStyles.footer,
                      {
                        color: colors.text.secondary,
                        fontFamily: fontFamilies.semibold,
                      },
                    ]}
                  >
                    Skip for now
                  </AppText>
                </Pressable>
              </>
            ) : null}
          </View>
        )}
      </View>
    );
  },
);

NeedsNextCareCard.displayName = 'NeedsNextCareCard';
