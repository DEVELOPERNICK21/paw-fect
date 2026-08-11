import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '../AppText';
import { MaterialIcon } from '../MaterialIcon';
import { ScalePressable } from '../ScalePressable';
import { useTheme } from '../../hooks/useTheme';

export interface PetPrimaryCtaProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const PetPrimaryCta: React.FC<PetPrimaryCtaProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
}) => {
  const theme = useTheme();
  const { colors, radius, spacing, textStyles } = theme;
  const isDisabled = disabled || loading;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        button: {
          width: '100%',
          minHeight: 56,
          borderRadius: radius.lg,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          opacity: isDisabled ? 0.6 : 1,
        },
        content: {
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: spacing.sm,
        },
      }),
    [
      colors.primary,
      isDisabled,
      radius.lg,
      spacing.lg,
      spacing.md,
      spacing.sm,
    ],
  );

  return (
    <ScalePressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={styles.button}
      pressedScale={0.98}
    >
      {loading ? (
        <ActivityIndicator color={colors.text.inverse} />
      ) : (
        <View style={styles.content}>
          <AppText style={[textStyles.primaryCta, { color: colors.text.inverse }]}>
            {title}
          </AppText>
          <MaterialIcon
            name="arrow_forward"
            size={22}
            color={colors.text.inverse}
          />
        </View>
      )}
    </ScalePressable>
  );
};
