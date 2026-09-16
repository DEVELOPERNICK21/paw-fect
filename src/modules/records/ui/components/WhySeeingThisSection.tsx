import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { whySeeingThisBody } from '../../domain/utils/careOwnerCopy';

export interface WhySeeingThisSectionProps {
  petName: string;
  ageLabel: string;
}

export const WhySeeingThisSection: React.FC<WhySeeingThisSectionProps> =
  React.memo(({ petName, ageLabel }) => {
    const theme = useTheme();
    const { colors, fontFamilies, textStyles, radius, spacing, shadows } =
      theme;
    const [expanded, setExpanded] = useState(false);
    const body = useMemo(
      () => whySeeingThisBody({ petName, ageLabel }),
      [ageLabel, petName],
    );

    const styles = useMemo(
      () =>
        StyleSheet.create({
          wrap: { gap: spacing.sm },
          toggle: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 44,
          },
          panel: {
            borderWidth: 1,
            padding: spacing.md,
          },
        }),
      [spacing],
    );

    return (
      <View style={styles.wrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel="Why am I seeing this"
          onPress={() => setExpanded(v => !v)}
          style={styles.toggle}
        >
          <AppText
            style={[
              textStyles.caption,
              {
                color: colors.text.secondary,
                fontFamily: fontFamilies.semibold,
              },
            ]}
          >
            Why am I seeing this?
          </AppText>
          <MaterialIcon
            name={expanded ? 'expand_less' : 'expand_more'}
            size={20}
            color={colors.text.subdued}
          />
        </Pressable>
        {expanded ? (
          <View
            style={[
              styles.panel,
              shadows.sm,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
                borderRadius: radius.lg,
              },
            ]}
          >
            <AppText
              style={[
                textStyles.caption,
                { color: colors.text.secondary, lineHeight: 20 },
              ]}
            >
              {body}
            </AppText>
          </View>
        ) : null}
      </View>
    );
  });

WhySeeingThisSection.displayName = 'WhySeeingThisSection';
