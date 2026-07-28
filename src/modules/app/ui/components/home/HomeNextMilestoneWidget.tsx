import React, { useCallback, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import type { Pet } from '../../../../pets/domain/models/Pet';
import type { HomeDashboardNextMilestone } from '../../../domain/models/HomeDashboardViewModel';
import { daysUntilDate } from '../../../domain/utils/homeDashboardDates';
import { AppText } from '../../../../../shared/components/AppText';
import { Button } from '../../../../../shared/components/Button';
import { MaterialIcon } from '../../../../../shared/components/MaterialIcon';
import type { Theme } from '../../../../../shared/hooks/useTheme';
import { lineHeights } from '../../../../../shared/theme/typography';
import { openGoogleCalendarAllDayEvent } from '../../utils/openGoogleCalendarTemplate';
import { WidgetSurface } from './WidgetSurface';

function formatCountdownPill(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, ' ');
}

/** How many of 3 segments are filled (urgency toward due date). */
function filledProgressSegments(dueYmd: string): number {
  const now = new Date();
  const d = daysUntilDate(dueYmd, now);
  if (d < 0) {
    return 3;
  }
  if (d <= 7) {
    return 3;
  }
  if (d <= 30) {
    return 2;
  }
  return 1;
}

export interface HomeNextMilestoneWidgetProps {
  pet: Pet;
  milestone: HomeDashboardNextMilestone | null;
  onPressOpenHealth: () => void;
  onPressPet?: () => void;
  theme: Theme;
}

export const HomeNextMilestoneWidget: React.FC<HomeNextMilestoneWidgetProps> =
  React.memo(({ pet, milestone, onPressOpenHealth, onPressPet, theme }) => {
    const { colors, radius, spacing, textStyles, fontSizes, fontFamilies } =
      theme;

    const onAddToCalendar = useCallback(async () => {
      if (milestone == null) {
        return;
      }
      await openGoogleCalendarAllDayEvent({
        title: `${pet.name}: ${milestone.title}`,
        dateYmd: milestone.dueDateYmd,
        details: `Scheduled in Pawsoul for ${pet.name}.`,
      });
    }, [milestone, pet.name]);

    const segmentsFilled = useMemo(
      () =>
        milestone != null ? filledProgressSegments(milestone.dueDateYmd) : 0,
      [milestone],
    );

    return (
      <WidgetSurface theme={theme}>
        <View style={{ gap: spacing.md }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${pet.name}. Open profile.`}
            disabled={onPressPet == null}
            onPress={onPressPet}
            android_ripple={
              onPressPet
                ? { color: colors.brandTint20, borderless: false }
                : undefined
            }
            style={({ pressed }) => ({
              opacity:
                onPressPet == null ? 1 : pressed && Platform.OS === 'ios'
                  ? 0.9
                  : 1,
            })}
          >
            <View style={styles.topRow}>
              <View
                style={[
                  styles.pawChip,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: radius.round,
                  },
                ]}
              >
                <MaterialIcon name="pets" size={20} color={colors.text.inverse} />
              </View>
              <AppText
                style={[
                  textStyles.subtitle,
                  {
                    color: colors.text.heading,
                    fontFamily: fontFamilies.bold,
                    fontSize: fontSizes.lg,
                    flex: 1,
                  },
                ]}
                numberOfLines={1}
              >
                {pet.name}
              </AppText>
              {milestone != null ? (
                <View
                  style={[
                    styles.countPill,
                    {
                      backgroundColor: colors.primary,
                      borderRadius: radius.pill,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xxs,
                      maxWidth: '42%',
                    },
                  ]}
                >
                  <AppText
                    style={[
                      textStyles.footer,
                      {
                        color: colors.text.inverse,
                        fontFamily: fontFamilies.bold,
                        letterSpacing: 0.4,
                      },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatCountdownPill(milestone.countdownLabel)}
                  </AppText>
                </View>
              ) : null}
            </View>
          </Pressable>

          {milestone == null ? (
            <View style={{ gap: spacing.md }}>
              <AppText
                style={[textStyles.body, { color: colors.text.secondary }]}
              >
                No upcoming vaccination or deworming milestones yet. Open
                health records to review your pet&apos;s plan.
              </AppText>
              <Button
                title="View health records"
                onPress={onPressOpenHealth}
                variant="secondary"
              />
            </View>
          ) : (
            <>
              <AppText
                style={[
                  textStyles.title,
                  {
                    color: colors.text.heading,
                    fontFamily: fontFamilies.extrabold,
                    fontSize: fontSizes['2xl'],
                    lineHeight: lineHeights['2xl'],
                    marginTop: spacing.xs,
                  },
                ]}
                numberOfLines={3}
              >
                {milestone.title}
              </AppText>

              <View style={styles.dateRow}>
                <MaterialIcon
                  name="calendar_today"
                  size={18}
                  color={colors.text.muted}
                />
                <AppText
                  style={[
                    textStyles.body,
                    {
                      color: colors.text.secondary,
                      fontFamily: fontFamilies.medium,
                    },
                  ]}
                >
                  {milestone.dueDateLabel}
                </AppText>
              </View>

              <View style={styles.progressTrack}>
                {[0, 1, 2].map(i => (
                  <View
                    key={i}
                    style={[
                      styles.progressSeg,
                      {
                        flex: 1,
                        height: 6,
                        borderRadius: radius.pill,
                        backgroundColor:
                          i < segmentsFilled
                            ? colors.primary
                            : colors.borderSubtle,
                      },
                    ]}
                  />
                ))}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add milestone to calendar"
                onPress={() => void onAddToCalendar()}
                android_ripple={{ color: colors.brandTint20 }}
                style={({ pressed }) => ({
                  marginTop: spacing.sm,
                  opacity: pressed ? 0.88 : 1,
                })}
              >
                <View
                  style={[
                    styles.softCta,
                    {
                      borderRadius: radius.xl,
                      backgroundColor: colors.brandTint12,
                      borderWidth: 1,
                      borderColor: colors.brandTint20,
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.lg,
                    },
                  ]}
                >
                  <MaterialIcon
                    name="calendar_today"
                    size={20}
                    color={colors.primary}
                  />
                  <AppText
                    style={[
                      textStyles.subtitle,
                      {
                        color: colors.primaryDark,
                        fontFamily: fontFamilies.bold,
                      },
                    ]}
                  >
                    Add to Calendar
                  </AppText>
                </View>
              </Pressable>
            </>
          )}
        </View>
      </WidgetSurface>
    );
  });

HomeNextMilestoneWidget.displayName = 'HomeNextMilestoneWidget';

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pawChip: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPill: {},
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  progressSeg: {},
  softCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
