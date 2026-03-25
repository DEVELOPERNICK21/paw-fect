import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../../../shared/components/AppText';
import { useTheme } from '../../../../../shared/hooks/useTheme';

export interface PetProfileSectionHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
}

export const PetProfileSectionHeader: React.FC<PetProfileSectionHeaderProps> = React.memo(
  ({ title, rightElement }) => {
    const { colors, spacing, textStyles, fontFamilies } = useTheme();

    return (
      <View style={[styles.row, { marginBottom: spacing.md, gap: spacing.md }]}>
        <AppText
          style={[
            textStyles.subtitle,
            { color: colors.text.heading, fontFamily: fontFamilies.bold },
          ]}
        >
          {title}
        </AppText>
        {rightElement ? <View>{rightElement}</View> : null}
      </View>
    );
  },
);

PetProfileSectionHeader.displayName = 'PetProfileSectionHeader';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

