import React, { useMemo } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppText } from '../../../../../shared/components/AppText';
import { Button } from '../../../../../shared/components/Button';
import { MaterialIcon } from '../../../../../shared/components/MaterialIcon';
import type { Theme } from '../../../../../shared/hooks/useTheme';
import { formatScheduleTimeLabel } from '../../../../schedule/ui/utils/scheduleDisplay';

export interface HomeTodayTaskItem {
  id: string;
  title: string;
  scheduledTime: string;
  isCompleted: boolean;
}

export interface HomeTodayTaskCarouselProps {
  petName: string;
  petPhoto: ImageSourcePropType;
  loading: boolean;
  tasks: HomeTodayTaskItem[];
  onPressSeeAll: () => void;
  onPressSetup: () => void;
  onPressComplete: (taskId: string) => void;
  theme: Theme;
}

export const HomeTodayTaskCarousel: React.FC<HomeTodayTaskCarouselProps> =
  React.memo(
    ({
      petName,
      petPhoto,
      loading,
      tasks,
      onPressSeeAll,
      onPressSetup,
      onPressComplete,
      theme,
    }) => {
      const { width } = useWindowDimensions();
      const { colors, radius, spacing, textStyles, fontFamilies, shadows } =
        theme;
      const cardWidth = Math.min(width - spacing.lg * 2 - spacing.xl, 300);

      const visible = useMemo(
        () => tasks.filter(task => !task.isCompleted).slice(0, 3),
        [tasks],
      );
      const allDone = tasks.length > 0 && visible.length === 0;

      return (
        <View style={{ gap: spacing.sm }}>
          <View style={styles.head}>
            <AppText
              accessibilityRole="header"
              style={[
                textStyles.subtitle,
                { color: colors.text.heading, fontFamily: fontFamilies.bold },
              ]}
            >
              Today&apos;s tasks
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="See all today care"
              onPress={onPressSeeAll}
              hitSlop={8}
              style={styles.seeAll}
            >
              <AppText
                style={[
                  textStyles.caption,
                  { color: colors.text.secondary, fontFamily: fontFamilies.medium },
                ]}
              >
                See all
              </AppText>
            </Pressable>
          </View>

          {loading ? (
            <View
              style={[
                styles.skel,
                {
                  height: 148,
                  borderRadius: radius.xl,
                  backgroundColor: colors.surfaceAlt,
                },
              ]}
            />
          ) : null}

          {!loading && tasks.length === 0 ? (
            <View
              style={[
                styles.empty,
                {
                  borderRadius: radius.xl,
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                  padding: spacing.lg,
                  gap: spacing.sm,
                },
              ]}
            >
              <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
                Set up {petName}&apos;s day to see the next meal or walk here.
              </AppText>
              <Button title="Set up care" onPress={onPressSetup} />
            </View>
          ) : null}

          {!loading && allDone ? (
            <View
              style={[
                styles.doneCard,
                {
                  borderRadius: radius.xl,
                  backgroundColor: colors.successSurface,
                  padding: spacing.lg,
                },
              ]}
            >
              <AppText
                style={[
                  textStyles.subtitle,
                  { color: colors.text.heading, fontFamily: fontFamilies.bold },
                ]}
              >
                {petName}&apos;s day is complete
              </AppText>
            </View>
          ) : null}

          {!loading && visible.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.lg }}
            >
              {visible.map((task, index) => (
                <View
                  key={task.id}
                  style={[
                    styles.card,
                    shadows.sm,
                    {
                      width: cardWidth,
                      borderRadius: radius.xl,
                      backgroundColor:
                        index === 0 ? colors.successSurface : colors.surface,
                      borderColor:
                        index === 0 ? colors.successSurface : colors.borderSubtle,
                      padding: spacing.lg,
                      gap: spacing.md,
                    },
                  ]}
                >
                  <View style={[styles.cardTop, { gap: spacing.sm }]}>
                    <Image
                      source={petPhoto}
                      accessible={false}
                      importantForAccessibility="no"
                      style={[
                        styles.thumb,
                        { borderRadius: radius.md },
                      ]}
                      accessibilityIgnoresInvertColors
                    />
                    <View style={styles.cardCopy}>
                      <AppText
                        style={[
                          textStyles.subtitle,
                          {
                            color: colors.text.heading,
                            fontFamily: fontFamilies.bold,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {petName} · {task.title}
                      </AppText>
                      <AppText
                        style={[
                          textStyles.caption,
                          { color: colors.text.secondary },
                        ]}
                        numberOfLines={1}
                      >
                        Up next
                      </AppText>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.rule,
                      { backgroundColor: colors.borderSubtle },
                    ]}
                  />
                  <View style={styles.cardFoot}>
                    <View style={[styles.timeRow, { gap: spacing.xs }]}>
                      <MaterialIcon
                        name="schedule"
                        size={16}
                        color={colors.text.secondary}
                      />
                      <AppText
                        style={[
                          textStyles.metricCaption,
                          { color: colors.text.heading },
                        ]}
                      >
                        {formatScheduleTimeLabel(task.scheduledTime)}
                      </AppText>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Complete ${task.title}`}
                      onPress={() => onPressComplete(task.id)}
                      style={[
                        styles.complete,
                        {
                          backgroundColor: colors.success,
                          borderRadius: radius.pill,
                          paddingHorizontal: spacing.md,
                          minHeight: 44,
                        },
                      ]}
                    >
                      <AppText
                        style={[
                          textStyles.caption,
                          {
                            color: colors.text.inverse,
                            fontFamily: fontFamilies.bold,
                          },
                        ]}
                      >
                        Complete
                      </AppText>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>
      );
    },
  );

HomeTodayTaskCarousel.displayName = 'HomeTodayTaskCarousel';

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAll: {
    minHeight: 44,
    justifyContent: 'center',
  },
  skel: {},
  empty: {
    borderWidth: 1,
  },
  doneCard: {},
  card: {
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: {
    width: 48,
    height: 48,
    resizeMode: 'cover',
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rule: {
    height: 1,
  },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  complete: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
