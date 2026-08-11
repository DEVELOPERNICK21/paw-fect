import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { icons } from '../../assets/icons';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { useTheme } from '../../hooks/useTheme';

export type PetSpeciesOption = {
  id: string;
  label: string;
  kind: 'dog' | 'cat' | 'other';
};

export interface PetSpeciesCardsProps {
  options: PetSpeciesOption[];
  value: string;
  onChange: (id: string) => void;
}

const SPECIES_ICON_SIZE = 40;

const SpeciesIcon: React.FC<{ kind: PetSpeciesOption['kind'] }> = ({
  kind,
}) => {
  if (kind === 'dog') {
    return <icons.dogIcon width={SPECIES_ICON_SIZE} height={SPECIES_ICON_SIZE} />;
  }
  if (kind === 'cat') {
    return <icons.catIcon width={SPECIES_ICON_SIZE} height={SPECIES_ICON_SIZE} />;
  }
  return <icons.paws width={SPECIES_ICON_SIZE} height={SPECIES_ICON_SIZE} />;
};

export const PetSpeciesCards: React.FC<PetSpeciesCardsProps> = ({
  options,
  value,
  onChange,
}) => {
  const theme = useTheme();
  const { colors, spacing, radius, textStyles, fontFamilies } = theme;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          gap: spacing.sm,
          width: '100%',
        },
        card: {
          flex: 1,
          minHeight: 96,
          borderRadius: radius.lg,
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.sm,
        },
        cardSelected: {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
        },
        cardIdle: {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
        },
        label: {
          marginTop: spacing.sm,
          fontFamily: fontFamilies.semibold,
        },
        labelSelected: {
          color: colors.text.inverse,
        },
        labelIdle: {
          color: colors.text.heading,
        },
      }),
    [
      colors.accent,
      colors.borderSubtle,
      colors.text.inverse,
      colors.surface,
      colors.text.heading,
      fontFamilies.semibold,
      radius.lg,
      spacing.md,
      spacing.sm,
    ],
  );

  return (
    <View style={styles.row}>
      {options.map(option => {
        const isSelected = value === option.id;

        return (
          <ScalePressable
            key={option.id}
            onPress={() => onChange(option.id)}
            style={[
              styles.card,
              isSelected ? styles.cardSelected : styles.cardIdle,
            ]}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={option.label}
          >
            <SpeciesIcon kind={option.kind} />
            <AppText
              style={[
                textStyles.control,
                styles.label,
                isSelected ? styles.labelSelected : styles.labelIdle,
              ]}
            >
              {option.label}
            </AppText>
          </ScalePressable>
        );
      })}
    </View>
  );
};
