import React, { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '../../../../../shared/hooks/useTheme';
import { MaterialIcon } from '../../../../../shared/components/MaterialIcon';

type OtpTopBarProps = {
  onBack: () => void;
};

export const OtpTopBar: React.FC<OtpTopBarProps> = ({ onBack }) => {
  const { colors, radius, shadows, spacing } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backButton: {
          width: 52,
          height: 52,
          borderRadius: radius.lg + spacing.xs,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.md,
        },
      }),
    [colors.borderSubtle, colors.surface, radius.lg, shadows.md, spacing.xs],
  );

  return (
    <Pressable
      onPress={onBack}
      style={styles.backButton}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <MaterialIcon
        name="arrow_back"
        size={26}
        color={colors.text.heading}
      />
    </Pressable>
  );
};

export default OtpTopBar;
