import React, { useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  InteractionManager,
  Linking,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import { trackEvent } from '../../../../../infrastructure/analytics/analytics';
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
import { petComposition } from '../../../../pets/petComposition';
import type { PetPhotoAnalysis } from '../../../../pets/domain/ports/PetPhotoAnalyzer';
import {
  PetPhotoAnalysisCard,
  type PetPhotoAnalysisConfirmSelection,
} from '../../../../pets/ui/components/PetPhotoAnalysisCard';
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

type PhotoAnalysisUiState =
  | { visible: false }
  | { visible: true; status: 'analyzing'; photoUri: string }
  | {
      visible: true;
      status: 'ready' | 'failed';
      photoUri: string;
      analysis?: PetPhotoAnalysis;
    };

type Props = {
  value: PetDraft;
  onChange: (next: PetDraft) => void;
};

export const PetBasicsStep: React.FC<Props> = ({ value, onChange }) => {
  const theme = useTheme();
  const { colors, spacing, radius, textStyles, fontFamilies } = theme;
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoAnalysis, setPhotoAnalysis] = useState<PhotoAnalysisUiState>({
    visible: false,
  });

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
          width: '100%',
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

  const handlePick = async (source: 'camera' | 'library'): Promise<void> => {
    try {
      const picked = await petComposition.pickPetPhoto(source);
      if (!picked) {
        return;
      }
      setPhotoUri(picked.localUri);
      setPhotoAnalysis({
        visible: true,
        status: 'analyzing',
        photoUri: picked.localUri,
      });
      void trackEvent('pet_photo_analysis_started', { surface: 'onboarding' });
      try {
        const analysis = await petComposition.analyzePetPhoto.execute(
          picked.localUri,
        );
        setPhotoAnalysis({
          visible: true,
          status: 'ready',
          photoUri: picked.localUri,
          analysis,
        });
        void trackEvent('pet_photo_analysis_completed', {
          species: analysis.species,
          low_confidence: analysis.lowConfidence,
          quality: analysis.quality,
        });
      } catch {
        setPhotoAnalysis({
          visible: true,
          status: 'failed',
          photoUri: picked.localUri,
        });
      }
    } catch (pickError) {
      const message =
        pickError instanceof Error
          ? pickError.message
          : 'Could not open the photo picker.';
      if (message === 'PERMISSION_DENIED') {
        Alert.alert(
          source === 'camera' ? 'Camera access needed' : 'Photo access needed',
          source === 'camera'
            ? 'Allow camera access in Settings so you can take a pet photo.'
            : 'Allow photo access in Settings to add a pet photo.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                Linking.openSettings().catch(() => undefined);
              },
            },
          ],
        );
        return;
      }
      Alert.alert('Photo', message);
    }
  };

  const enqueuePhotoPick = (source: 'camera' | 'library'): void => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        handlePick(source).catch(() => undefined);
      }, Platform.OS === 'android' ? 350 : 0);
    });
  };

  const openPhotoOptions = (): void => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Take photo', 'Choose from library', 'Cancel'],
          cancelButtonIndex: 2,
          title: 'Pet photo',
        },
        selectedIndex => {
          if (selectedIndex === 0) {
            enqueuePhotoPick('camera');
          } else if (selectedIndex === 1) {
            enqueuePhotoPick('library');
          }
        },
      );
      return;
    }

    Alert.alert('Pet photo', 'Choose a photo option', [
      {
        text: 'Take photo',
        onPress: () => enqueuePhotoPick('camera'),
      },
      {
        text: 'Choose from library',
        onPress: () => enqueuePhotoPick('library'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleConfirmPhotoAnalysis = (
    selection: PetPhotoAnalysisConfirmSelection,
  ): void => {
    onChange({
      ...value,
      species: selection.species,
      breed: selection.breed,
    });
    setPhotoAnalysis({ visible: false });
    void trackEvent('pet_photo_analysis_confirmed', {
      species: selection.species,
      breed_selected: selection.breed ?? '',
      was_suggestion: selection.breed != null,
    });
  };

  const handleSkipPhotoAnalysis = (): void => {
    setPhotoAnalysis({ visible: false });
    void trackEvent('pet_photo_analysis_skipped', { surface: 'onboarding' });
  };

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
        <PetPhotoHero
          photoSource={photoUri != null ? { uri: photoUri } : undefined}
          caption={photoCaption}
          onPressCamera={openPhotoOptions}
          accessibilityLabel={
            photoUri != null ? 'Change pet photo' : 'Add pet photo'
          }
        />
        {photoAnalysis.visible ? (
          <PetPhotoAnalysisCard
            photoUri={photoAnalysis.photoUri}
            status={photoAnalysis.status}
            analysis={
              photoAnalysis.status === 'analyzing'
                ? undefined
                : photoAnalysis.analysis
            }
            onConfirm={handleConfirmPhotoAnalysis}
            onSkip={handleSkipPhotoAnalysis}
          />
        ) : null}
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
