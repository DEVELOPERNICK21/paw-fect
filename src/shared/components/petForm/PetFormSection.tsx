import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../AppText';
import { Card } from '../Card';
import { MaterialIcon } from '../MaterialIcon';
import { ScalePressable } from '../ScalePressable';
import { useTheme } from '../../hooks/useTheme';

export interface PetFormSectionProps {
  title: string;
  optional?: boolean;
  collapsedSummary?: string;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  children?: React.ReactNode;
}

export const PetFormSection: React.FC<PetFormSectionProps> = ({
  title,
  optional = false,
  collapsedSummary,
  collapsible = false,
  expanded = true,
  onToggle,
  children,
}) => {
  const { colors, spacing, radius, textStyles, fontFamilies } = useTheme();
  const showBody = !collapsible || expanded;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          gap: collapsible ? spacing.md : spacing.sm,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          minHeight: collapsible ? 44 : undefined,
        },
        headerCopy: {
          flex: 1,
          minWidth: 0,
          gap: spacing.xxs,
        },
        title: {
          color: colors.text.heading,
          fontFamily: fontFamilies.bold,
        },
        optional: {
          color: colors.text.subdued,
        },
        summary: {
          color: colors.text.subdued,
        },
        chevron: {
          padding: spacing.xs,
        },
        card: {
          padding: spacing.lg,
          borderRadius: radius.xl,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.elevated,
        },
        cardContent: {
          marginTop: 0,
        },
      }),
    [
      colors.borderSubtle,
      colors.elevated,
      colors.text.heading,
      colors.text.subdued,
      fontFamilies.bold,
      radius.xl,
      spacing.lg,
      spacing.md,
      spacing.sm,
      spacing.xxs,
      spacing.xs,
      collapsible,
    ],
  );

  const headerLabel = optional ? `${title}, optional` : title;

  const header = (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        <AppText style={[textStyles.subtitle, styles.title]}>{title}</AppText>
        {collapsible && !expanded && collapsedSummary ? (
          <AppText style={[textStyles.caption, styles.summary]}>
            {collapsedSummary}
          </AppText>
        ) : null}
      </View>
      {optional ? (
        <AppText style={[textStyles.caption, styles.optional]}>Optional</AppText>
      ) : null}
      {collapsible ? (
        <View style={styles.chevron}>
          <MaterialIcon
            name={expanded ? 'expand_less' : 'expand_more'}
            size={22}
            color={colors.text.subdued}
          />
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.root}>
      {collapsible && onToggle ? (
        <ScalePressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={headerLabel}
          accessibilityState={{ expanded }}
        >
          {header}
        </ScalePressable>
      ) : (
        header
      )}
      {showBody ? (
        <Card containerStyle={styles.card} contentStyle={styles.cardContent}>
          {children}
        </Card>
      ) : null}
    </View>
  );
};
