import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Pet } from '../../../../pets/domain/models/Pet';
import type { HomeDashboardNextMilestone } from '../../../domain/models/HomeDashboardViewModel';
import { AppText } from '../../../../../shared/components/AppText';
import type { Theme } from '../../../../../shared/hooks/useTheme';
import { openGoogleCalendarAllDayEvent } from '../../utils/openGoogleCalendarTemplate';
import { WidgetSurface } from './WidgetSurface';

export interface HomeNextMilestoneWidgetProps {
  pet: Pet;
  milestone: HomeDashboardNextMilestone | null;
  onPressOpenHealth: () => void;
  onPressPet?: () => void;
  theme: Theme;
}

export const HomeNextMilestoneWidget: React.FC<HomeNextMilestoneWidgetProps> =
  React.memo(({ pet, milestone, onPressOpenHealth, onPressPet, theme }) => {
    const { colors, spacing, textStyles, fontFamilies } = theme;

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

    return (
      <WidgetSurface theme={theme}>
        <View style={{ gap: spacing.sm }}>
          <AppText
            accessibilityRole="header"
            style={[
              textStyles.subtitle,
              { color: colors.text.heading, fontFamily: fontFamilies.bold },
            ]}
          >
            Next milestone
          </AppText>

          {milestone == null ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View health records"
              onPress={onPressOpenHealth}
              style={styles.footerLink}
            >
              <AppText
                style={[
                  textStyles.caption,
                  { color: colors.text.secondary, fontFamily: fontFamilies.medium },
                ]}
              >
                No vaccination or deworming dates yet. Open health.
              </AppText>
            </Pressable>
          ) : (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${milestone.title}, ${milestone.dueDateLabel}`}
                onPress={onPressPet ?? onPressOpenHealth}
                style={[
                  styles.row,
                  {
                    minHeight: 44,
                    paddingVertical: spacing.xs,
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: colors.accent },
                  ]}
                />
                <View style={styles.copy}>
                  <AppText
                    style={[
                      textStyles.caption,
                      {
                        color: colors.text.heading,
                        fontFamily: fontFamilies.medium,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {milestone.title}
                  </AppText>
                  <AppText
                    style={[
                      textStyles.metricCaption,
                      { color: colors.text.secondary },
                    ]}
                    numberOfLines={1}
                  >
                    {milestone.dueDateLabel} · {milestone.countdownLabel}
                  </AppText>
                </View>
              </Pressable>
              <View style={[styles.actions, { gap: spacing.md }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add milestone to calendar"
                  onPress={() => void onAddToCalendar()}
                  hitSlop={8}
                  style={styles.footerLink}
                >
                  <AppText
                    style={[
                      textStyles.caption,
                      {
                        color: colors.text.secondary,
                        fontFamily: fontFamilies.medium,
                      },
                    ]}
                  >
                    Add to calendar
                  </AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open health records"
                  onPress={onPressOpenHealth}
                  hitSlop={8}
                  style={styles.footerLink}
                >
                  <AppText
                    style={[
                      textStyles.caption,
                      {
                        color: colors.text.secondary,
                        fontFamily: fontFamilies.medium,
                      },
                    ]}
                  >
                    Open health
                  </AppText>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </WidgetSurface>
    );
  });

HomeNextMilestoneWidget.displayName = 'HomeNextMilestoneWidget';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLink: {
    minHeight: 44,
    justifyContent: 'center',
  },
});
