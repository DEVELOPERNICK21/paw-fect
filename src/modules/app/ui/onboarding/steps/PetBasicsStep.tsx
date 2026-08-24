import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../../../shared/components/AppText';
import {
  PetFieldLabel,
  PetFilledTextInput,
  PetPhotoHero,
  PetSpeciesCards,
  type PetSpeciesOption,
} from '../../../../../shared/components/petForm';
import { ScalePressable } from '../../../../../shared/components/ScalePressable';
import { useTheme } from '../../../../../shared/hooks/useTheme';
import type { PetDraft } from '../../../domain/onboarding/OnboardingDraft';
import { AccentHeadline } from '../components/AccentHeadline';

const SPECIES_OPTIONS: PetSpeciesOption[] = [
  { id: 'dog', label: 'Dog', kind: 'dog' },
  { id: 'cat', label: 'Cat', kind: 'cat' },
];

type AgeBandOption = { id: PetDraft['ageBand']; label: string };

const AGE_BAND_OPTIONS: AgeBandOption[] = [
  { id: 'puppy_kitten', label: 'Puppy / Kitten' },
  { id: 'adult', label: 'Adult' },
  { id: 'senior', label: 'Senior' },
];

type Props = {
  value: PetDraft;
  onChange: (next: PetDraft) => void;
};

export const PetBasicsStep: React.FC<Props> = ({ value, onChange }) => {
  const theme = useTheme();
  const { colors, spacing, radius, textStyles, fontFamilies } = theme;

  const trimmedNickname = value.nickname.trim();
  const photoCaption = trimmedNickname
    ? `We can't wait to meet ${trimmedNickname}!`
    : undefined;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.md,
        },
        subtitle: {
          marginTop: spacing.md,
          color: colors.text.body,
          textAlign: 'center',
        },
        heroSection: {
          marginTop: spacing.xl,
          alignItems: 'center',
        },
        fieldSection: {
          marginTop: spacing.xl,
        },
        ageRow: {
          flexDirection: 'row',
          gap: spacing.sm,
          width: '100%',
        },
        ageCard: {
          flex: 1,
          minHeight: 72,
          borderRadius: radius.lg,
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xs,
        },
        ageCardSelected: {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
        },
        ageCardIdle: {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
        },
        ageLabel: {
          fontFamily: fontFamilies.semibold,
          textAlign: 'center',
        },
        ageLabelSelected: {
          color: colors.text.inverse,
        },
        ageLabelIdle: {
          color: colors.text.heading,
        },
      }),
    [
      colors.accent,
      colors.borderSubtle,
      colors.surface,
      colors.text.body,
      colors.text.heading,
      colors.text.inverse,
      fontFamilies.semibold,
      radius.lg,
      spacing.lg,
      spacing.md,
      spacing.sm,
      spacing.xl,
      spacing.xs,
    ],
  );

  return (
    <View style={styles.container}>
      <AccentHeadline
        segments={[
          { type: 'text', value: 'Tell us about ' },
          { type: 'accent', value: 'your pet.' },
        ]}
      />
      <AppText style={[textStyles.marketingLead, styles.subtitle]}>
        Let&apos;s get the basics down so we can tailor their experience.
      </AppText>

      <View style={styles.heroSection}>
        <PetPhotoHero caption={photoCaption} />
      </View>

      <View style={styles.fieldSection}>
        <PetFieldLabel>PET NAME</PetFieldLabel>
        <PetFilledTextInput
          value={value.nickname}
          onChangeText={nickname => onChange({ ...value, nickname })}
          placeholder="e.g. Luna"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.fieldSection}>
        <PetFieldLabel>SPECIES</PetFieldLabel>
        <PetSpeciesCards
          options={SPECIES_OPTIONS}
          value={value.species}
          onChange={species =>
            onChange({ ...value, species: species as PetDraft['species'] })
          }
        />
      </View>

      <View style={styles.fieldSection}>
        <PetFieldLabel>ESTIMATED AGE</PetFieldLabel>
        <View style={styles.ageRow}>
          {AGE_BAND_OPTIONS.map(option => {
            const isSelected = value.ageBand === option.id;

            return (
              <ScalePressable
                key={option.id}
                onPress={() => onChange({ ...value, ageBand: option.id })}
                style={[
                  styles.ageCard,
                  isSelected ? styles.ageCardSelected : styles.ageCardIdle,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={option.label}
              >
                <AppText
                  style={[
                    textStyles.control,
                    styles.ageLabel,
                    isSelected ? styles.ageLabelSelected : styles.ageLabelIdle,
                  ]}
                >
                  {option.label}
                </AppText>
              </ScalePressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};
