import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import { ScalePressable } from '../../../../shared/components/ScalePressable';
import { useTheme } from '../../../../shared/hooks/useTheme';
import type { PetPhotoAnalysis } from '../../domain/ports/PetPhotoAnalyzer';

export type PetPhotoAnalysisConfirmSelection = {
  species: 'dog' | 'cat';
};

export type PetPhotoAnalysisCardProps = {
  photoUri: string;
  status: 'analyzing' | 'ready' | 'failed';
  analysis?: PetPhotoAnalysis;
  onConfirm: (selection: PetPhotoAnalysisConfirmSelection) => void;
  onSkip: () => void;
};

function speciesLine(analysis: PetPhotoAnalysis): string {
  if (analysis.species === 'dog') {
    return 'We think this looks like a dog';
  }
  if (analysis.species === 'cat') {
    return 'We think this looks like a cat';
  }
  return "We're not sure what pet this is";
}

export const PetPhotoAnalysisCard: React.FC<PetPhotoAnalysisCardProps> = ({
  photoUri,
  status,
  analysis,
  onConfirm,
  onSkip,
}) => {
  const { colors, spacing, radius, textStyles, fontFamilies } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          marginTop: spacing.lg,
          padding: spacing.lg,
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        },
        preview: {
          width: '100%',
          height: 160,
          borderRadius: radius.md,
          backgroundColor: colors.brandTint5,
        },
        analyzingRow: {
          marginTop: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        analyzingText: {
          color: colors.text.body,
        },
        section: {
          marginTop: spacing.md,
        },
        speciesTitle: {
          color: colors.text.heading,
        },
        bodyText: {
          color: colors.text.body,
        },
        captionText: {
          color: colors.text.secondary,
        },
        warning: {
          marginTop: spacing.sm,
          color: colors.warning,
        },
        actions: {
          marginTop: spacing.lg,
          gap: spacing.sm,
        },
        primary: {
          minHeight: 48,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accent,
          paddingHorizontal: spacing.lg,
        },
        primaryDisabled: {
          opacity: 0.45,
        },
        primaryLabel: {
          color: colors.text.inverse,
          fontFamily: fontFamilies.semibold,
        },
        secondary: {
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
        },
        secondaryLabel: {
          color: colors.text.secondary,
          fontFamily: fontFamilies.medium,
        },
        failed: {
          marginTop: spacing.md,
          color: colors.text.body,
        },
      }),
    [
      colors.accent,
      colors.borderSubtle,
      colors.brandTint5,
      colors.surface,
      colors.text.body,
      colors.text.heading,
      colors.text.inverse,
      colors.text.secondary,
      colors.warning,
      fontFamilies.medium,
      fontFamilies.semibold,
      radius.lg,
      radius.md,
      spacing.lg,
      spacing.md,
      spacing.sm,
    ],
  );

  const photoSource: ImageSourcePropType = { uri: photoUri };

  const canConfirm =
    status === 'ready' &&
    analysis != null &&
    (analysis.species === 'dog' || analysis.species === 'cat');

  const handleConfirm = (): void => {
    if (analysis == null) {
      return;
    }
    if (analysis.species !== 'dog' && analysis.species !== 'cat') {
      return;
    }
    onConfirm({ species: analysis.species });
  };

  return (
    <View style={styles.card} accessibilityLabel="Pet photo suggestions">
      <Image source={photoSource} style={styles.preview} resizeMode="cover" />

      {status === 'analyzing' ? (
        <View style={styles.analyzingRow}>
          <ActivityIndicator color={colors.accent} />
          <AppText style={[textStyles.body, styles.analyzingText]}>
            Analyzing photo…
          </AppText>
        </View>
      ) : null}

      {status === 'failed' ? (
        <AppText style={[textStyles.body, styles.failed]}>
          Couldn&apos;t analyze this photo. You can choose dog or cat manually.
        </AppText>
      ) : null}

      {status === 'ready' && analysis != null ? (
        <>
          <View style={styles.section}>
            <AppText style={[textStyles.title, styles.speciesTitle]}>
              {speciesLine(analysis)}
            </AppText>
            {analysis.lowConfidence ? (
              <AppText style={[textStyles.caption, styles.warning]}>
                Not sure — please check
              </AppText>
            ) : null}
          </View>

          <View style={styles.section}>
            <AppText style={[textStyles.body, styles.bodyText]}>
              Photo quality:{' '}
              {analysis.quality === 'good'
                ? 'Good'
                : analysis.quality === 'fair'
                  ? 'Fair'
                  : 'Poor'}
            </AppText>
            <AppText style={[textStyles.caption, styles.captionText]}>
              {analysis.qualityHint}
            </AppText>
          </View>
        </>
      ) : null}

      <View style={styles.actions}>
        {status === 'ready' ? (
          <ScalePressable
            onPress={handleConfirm}
            disabled={!canConfirm}
            style={[styles.primary, !canConfirm ? styles.primaryDisabled : null]}
            accessibilityRole="button"
            accessibilityLabel="Confirm species"
            accessibilityState={{ disabled: !canConfirm }}
          >
            <AppText style={[textStyles.control, styles.primaryLabel]}>
              Confirm species
            </AppText>
          </ScalePressable>
        ) : null}
        <ScalePressable
          onPress={onSkip}
          style={styles.secondary}
          accessibilityRole="button"
          accessibilityLabel="Skip"
        >
          <AppText style={[textStyles.caption, styles.secondaryLabel]}>
            Skip
          </AppText>
        </ScalePressable>
      </View>
    </View>
  );
};
