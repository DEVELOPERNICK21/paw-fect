import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon, type IconName } from '../../../../shared/components/MaterialIcon';
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
  const { colors, radius, space, textStyles, fontFamilies, shadows, isDarkMode } =
    theme;

  // The design uses dark text on the accent button and dark surface card.
  const updateTextColor = isDarkMode ? colors.text.inverse : colors.text.heading;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.brandTint10,
          borderWidth: 1,
          borderRadius: radius.lg,
          padding: space('lg'),
        },
        shadows.sm,
      ]}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.iconShell,
            { backgroundColor: colors.brandTint12, borderRadius: radius.round },
          ]}
        >
          <MaterialIcon
            name={iconName}
            size={28}
            color={colors.accent}
          />
        </View>

        <View style={styles.textCol}>
          <AppText
            style={[
              textStyles.overline,
              { color: colors.accent, fontFamily: fontFamilies.bold },
            ]}
            numberOfLines={1}
          >
            Next Due
          </AppText>
          <AppText
            style={[
              textStyles.title,
              { color: colors.text.heading, fontFamily: fontFamilies.extrabold },
            ]}
            numberOfLines={1}
          >
            {title}
          </AppText>
          <AppText
            style={[
              textStyles.caption,
              { color: colors.text.secondary, fontFamily: fontFamilies.medium },
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
            borderRadius: radius.round,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <AppText
          style={[
            textStyles.subtitle,
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
  iconShell: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  updateBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

