import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../../../shared/components/AppText';
import { useTheme } from '../../../../../shared/hooks/useTheme';

export interface PetProfileTipCardProps {
  title: string;
  body: string;
}

export const PetProfileTipCard: React.FC<PetProfileTipCardProps> = React.memo(
  ({ title, body }) => {
    const theme = useTheme();
    const { colors, radius, spacing, textStyles, fontFamilies } = theme;

    return (
      <View
        style={[
          styles.card,
          {
            borderRadius: radius.lg,
            backgroundColor: colors.brandTint12,
            borderColor: colors.brandTint20,
            borderWidth: 1,
            padding: spacing.lg,
            marginVertical: spacing.lg,
          },
        ]}
      >
        <AppText
          style={[
            textStyles.subtitle,
            { color: colors.text.heading, fontFamily: fontFamilies.bold },
          ]}
        >
          {title}
        </AppText>
        <AppText
          style={[
            textStyles.body,
            { color: colors.text.body, marginTop: spacing.xs },
          ]}
        >
          {body}
        </AppText>
      </View>
    );
  },
);

PetProfileTipCard.displayName = 'PetProfileTipCard';

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
});
