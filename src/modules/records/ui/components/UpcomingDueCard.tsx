import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import {
  MaterialIcon,
  type IconName,
} from '../../../../shared/components/MaterialIcon';
import { WidgetSurface } from '../../../../shared/components/WidgetSurface';
import { useTheme } from '../../../../shared/hooks/useTheme';

export interface UpcomingDueCardProps {
  iconName: IconName;
  title: string;
  dueLabel: string; // e.g. "Due on Oct 24, 2024"
  onPressUpdate?: () => void;
}

export const UpcomingDueCard: React.FC<UpcomingDueCardProps> = ({
  iconName,
  title,
  dueLabel,
  onPressUpdate,
}) => {
  const theme = useTheme();
  const { colors, radius, spacing, textStyles, fontFamilies, isDarkMode } =
    theme;

  const updateTextColor = isDarkMode ? colors.text.inverse : colors.text.heading;

  return (
    <WidgetSurface theme={theme}>
      <View style={styles.card}>
        <View style={styles.row}>
          <View
            style={[
              styles.iconTile,
              {
                backgroundColor: colors.brandTint12,
                borderRadius: radius.sm,
                width: spacing['2xl'],
                height: spacing['2xl'],
              },
            ]}
          >
            <MaterialIcon name={iconName} size={20} color={colors.accent} />
          </View>

          <View style={styles.textCol}>
            <AppText
              style={[
                textStyles.overline,
                { color: colors.accent, fontFamily: fontFamilies.bold },
              ]}
              numberOfLines={1}
            >
              Next due
            </AppText>
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
              {title}
            </AppText>
            <AppText
              style={[
                textStyles.caption,
                {
                  color: colors.text.secondary,
                  fontFamily: fontFamilies.medium,
                },
              ]}
              numberOfLines={1}
            >
              {dueLabel}
            </AppText>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Update next due task"
          onPress={onPressUpdate}
          style={({ pressed }) => [
            styles.updateBtn,
            {
              backgroundColor: colors.accent,
              borderRadius: radius.sm,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <AppText
            style={[
              textStyles.caption,
              {
                color: updateTextColor,
                fontFamily: fontFamilies.bold,
              },
            ]}
            numberOfLines={1}
          >
            Update
          </AppText>
        </Pressable>
      </View>
    </WidgetSurface>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconTile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  updateBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
