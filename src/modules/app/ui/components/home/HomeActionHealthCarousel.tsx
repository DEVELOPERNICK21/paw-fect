import React from 'react';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import type { HomeDashboardActionHealthItem } from '../../../domain/models/HomeDashboardViewModel';
import { AppText } from '../../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../../shared/components/MaterialIcon';
import type { Theme } from '../../../../../shared/hooks/useTheme';

export interface HomeActionHealthCarouselProps {
  petName: string;
  petPhoto: ImageSourcePropType;
  items: HomeDashboardActionHealthItem[];
  onPressSeeAll: () => void;
  onPressItem: (itemId: string) => void;
  theme: Theme;
}

export const HomeActionHealthCarousel: React.FC<HomeActionHealthCarouselProps> =
  React.memo(
    ({ petName, petPhoto, items, onPressSeeAll, onPressItem, theme }) => {
      const { width } = useWindowDimensions();
      const { colors, radius, spacing, textStyles, fontFamilies, shadows } =
        theme;
      const cardWidth = Math.min(width - spacing.lg * 2 - spacing.xl, 300);

      if (items.length === 0) {
        return null;
      }

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
              Needs action
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="See all health records"
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: spacing.md,
              paddingRight: spacing.lg,
            }}
          >
            {items.map((item, index) => {
              const kindLabel =
                item.kind === 'vaccination' ? 'Vaccination' : 'Deworming';
              const featured = index === 0;
              const overdue = item.urgency === 'overdue';
              return (
                <View
                  key={item.id}
                  style={[
                    styles.card,
                    shadows.sm,
                    {
                      width: cardWidth,
                      borderRadius: radius.xl,
                      backgroundColor: overdue
                        ? colors.dangerSurface
                        : featured
                          ? colors.brandTint12
                          : colors.surface,
                      borderColor: overdue
                        ? colors.dangerSurface
                        : featured
                          ? colors.brandTint12
                          : colors.borderSubtle,
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
                      style={[styles.thumb, { borderRadius: radius.md }]}
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
                        {petName} · {kindLabel}
                      </AppText>
                      <AppText
                        style={[
                          textStyles.caption,
                          { color: colors.text.secondary },
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
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
                    <View style={[styles.metaRow, { gap: spacing.xs }]}>
                      <MaterialIcon
                        name={
                          item.kind === 'vaccination' ? 'vaccines' : 'pill'
                        }
                        size={16}
                        color={
                          overdue ? colors.danger : colors.text.secondary
                        }
                      />
                      <AppText
                        style={[
                          textStyles.metricCaption,
                          {
                            color: overdue
                              ? colors.danger
                              : colors.text.heading,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.countdownLabel}
                      </AppText>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Log ${item.title}`}
                      onPress={() => onPressItem(item.id)}
                      style={[
                        styles.action,
                        {
                          backgroundColor: overdue
                            ? colors.danger
                            : colors.primary,
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
                            color: colors.onAccent,
                            fontFamily: fontFamilies.bold,
                          },
                        ]}
                      >
                        Log
                      </AppText>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      );
    },
  );

HomeActionHealthCarousel.displayName = 'HomeActionHealthCarousel';

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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  action: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
