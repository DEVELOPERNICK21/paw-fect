import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '../../../../../shared/hooks/useTheme';
import { lineHeights } from '../../../../../shared/theme/typography';
import type { PetDraft } from '../../../domain/onboarding/OnboardingDraft';

type SpeciesOption = { id: PetDraft['species']; label: string; glyph: string };
type AgeBandOption = { id: PetDraft['ageBand']; label: string };

const SPECIES_OPTIONS: SpeciesOption[] = [
  { id: 'dog', label: 'Dog', glyph: '🐶' },
  { id: 'cat', label: 'Cat', glyph: '🐱' },
  { id: 'both', label: 'Both', glyph: '🐾' },
];

const AGE_BAND_OPTIONS: AgeBandOption[] = [
  { id: 'puppy_kitten', label: 'Puppy / Kitten' },
  { id: 'adult', label: 'Adult' },
  { id: 'senior', label: 'Senior' },
];

type Props = {
  value: PetDraft;
  onChange: (next: PetDraft) => void;
};

type ThemeParams = {
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  radius: ReturnType<typeof useTheme>['radius'];
  fontSizes: ReturnType<typeof useTheme>['fontSizes'];
};

const createStyles = ({ colors, spacing, radius, fontSizes }: ThemeParams) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
      alignItems: 'center',
    },
    title: {
      fontSize: fontSizes['2xl'],
      lineHeight: lineHeights['2xl'],
      color: colors.text.heading,
      textAlign: 'center',
      letterSpacing: -0.6,
    },
    subtitle: {
      marginTop: spacing.md,
      fontSize: fontSizes.lead,
      lineHeight: lineHeights.md,
      color: colors.text.body,
      textAlign: 'center',
    },
    sectionLabel: {
      alignSelf: 'flex-start',
      marginTop: spacing.xl,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      color: colors.text.secondary,
    },
    row: {
      marginTop: spacing.sm,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      width: '100%',
    },
    chip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    chipSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipIdle: {
      backgroundColor: colors.brandTint5,
      borderColor: colors.brandTint20,
    },
    chipGlyph: {
      fontSize: fontSizes.md,
      marginRight: spacing.xs,
    },
    chipLabel: {
      fontSize: fontSizes.lead,
      lineHeight: lineHeights.md,
    },
    textInput: {
      marginTop: spacing.sm,
      width: '100%',
      height: 52,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      fontSize: fontSizes.base,
      color: colors.text.heading,
    },
  });

export const PetBasicsStep: React.FC<Props> = ({ value, onChange }) => {
  const { colors, fontFamilies, fontSizes, spacing, radius } = useTheme();
  const styles = useMemo(
    () => createStyles({ colors, spacing, radius, fontSizes }),
    [colors, spacing, radius, fontSizes],
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontFamily: fontFamilies.extrabold }]}>
        Tell us about your pet
      </Text>
      <Text style={[styles.subtitle, { fontFamily: fontFamilies.medium }]}>
        We&apos;ll personalise your plan around them.
      </Text>

      <Text style={[styles.sectionLabel, { fontFamily: fontFamilies.semibold }]}>
        SPECIES
      </Text>
      <View style={styles.row}>
        {SPECIES_OPTIONS.map(option => {
          const isSelected = value.species === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => onChange({ ...value, species: option.id })}
              style={[
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipIdle,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
            >
              <Text style={styles.chipGlyph}>{option.glyph}</Text>
              <Text
                style={[
                  styles.chipLabel,
                  {
                    fontFamily: fontFamilies.bold,
                    color: isSelected
                      ? colors.text.inverse
                      : colors.text.heading,
                  },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.sectionLabel, { fontFamily: fontFamilies.semibold }]}>
        AGE
      </Text>
      <View style={styles.row}>
        {AGE_BAND_OPTIONS.map(option => {
          const isSelected = value.ageBand === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => onChange({ ...value, ageBand: option.id })}
              style={[
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipIdle,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
            >
              <Text
                style={[
                  styles.chipLabel,
                  {
                    fontFamily: fontFamilies.bold,
                    color: isSelected
                      ? colors.text.inverse
                      : colors.text.heading,
                  },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.sectionLabel, { fontFamily: fontFamilies.semibold }]}>
        NICKNAME
      </Text>
      <TextInput
        value={value.nickname}
        onChangeText={nickname => onChange({ ...value, nickname })}
        placeholder="e.g. Luna"
        placeholderTextColor={colors.input.placeholder}
        style={[styles.textInput, { fontFamily: fontFamilies.medium }]}
      />
    </View>
  );
};
