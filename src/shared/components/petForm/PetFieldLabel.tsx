import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { AppText } from '../AppText';
import { useTheme } from '../../hooks/useTheme';

export interface PetFieldLabelProps {
  children: string;
}

export const PetFieldLabel: React.FC<PetFieldLabelProps> = ({ children }) => {
  const { colors, textStyles, fontFamilies } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        label: {
          color: colors.text.secondary,
          textTransform: 'uppercase',
          fontFamily: fontFamilies.semibold,
        },
      }),
    [colors.text.secondary, fontFamilies.semibold],
  );

  return (
    <AppText style={[textStyles.overline, styles.label]}>{children}</AppText>
  );
};
