import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { HomeQuickActionId } from '../../../store/homeQuickActionsUsageStore';
import { AppText } from '../../../../../shared/components/AppText';
import { MaterialIcon, type IconName } from '../../../../../shared/components/MaterialIcon';
import type { Theme } from '../../../../../shared/hooks/useTheme';

export interface HomeQuickActionsRowProps {
  /** Up to four action ids, ordered by usage + defaults. */
  orderedActionIds: HomeQuickActionId[];
  onPressAction: (id: HomeQuickActionId) => void;
  theme: Theme;
}

const ACTION_UI: Record<
  HomeQuickActionId,
  { label: string; icon: IconName; a11y: string }
> = {
  log_weight: {
    label: 'Weight',
    icon: 'weight',
    a11y: 'Log weight',
  },
  alerts: {
    label: 'Alerts',
    icon: 'notifications',
    a11y: 'Open alerts',
  },
  pet_profile: {
    label: 'Pet',
    icon: 'pets',
    a11y: 'Pet profile',
  },
  user_profile: {
    label: 'Account',
    icon: 'person',
    a11y: 'Your account',
  },
  pet_switcher: {
    label: 'Switch',
    icon: 'group',
    a11y: 'Switch pet',
  },
};

export const HomeQuickActionsRow: React.FC<HomeQuickActionsRowProps> = React.memo(
  ({ orderedActionIds, onPressAction, theme }) => {
    const { colors, radius, spacing, textStyles, fontFamilies } = theme;

    const actions = useMemo(
      () => orderedActionIds.map(id => ({ id, ...ACTION_UI[id] })),
      [orderedActionIds],
    );

    return (
      <View style={[styles.row, { gap: spacing.sm }]}>
        {actions.map(a => (
          <Pressable
            key={a.id}
            onPress={() => onPressAction(a.id)}
            accessibilityRole="button"
            accessibilityLabel={a.a11y}
            style={[
              styles.chip,
              {
                flex: 1,
                minHeight: 44,
                borderRadius: radius.sm,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surface,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.xs,
                gap: spacing.xs,
              },
            ]}
          >
            <MaterialIcon name={a.icon} size={20} color={colors.text.secondary} />
            <AppText
              style={[
                textStyles.caption,
                {
                  color: colors.text.heading,
                  fontFamily: fontFamilies.medium,
                  textAlign: 'center',
                },
              ]}
              numberOfLines={1}
            >
              {a.label}
            </AppText>
          </Pressable>
        ))}
      </View>
    );
  },
);

HomeQuickActionsRow.displayName = 'HomeQuickActionsRow';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
