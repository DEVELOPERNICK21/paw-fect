import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../../shared/hooks/useTheme';
import type { PetFormProgress } from '../../domain/utils/computePetFormProgress';

type PetFormPsychologyChromeProps = {
  isEditMode: boolean;
  petsUsed: number;
  maxPets: number;
  planLabel: string;
  progress: PetFormProgress;
  lockedInCount: number;
  petDisplayName: string;
  variant?: 'full' | 'compact';
};

/**
 * Psychology chrome for create/edit pet:
 * - Number anchoring (slot X of Y)
 * - Goal gradient progress bar
 * - Give-something-first gift strip
 * - IKEA locked-in count
 */
export const PetFormPsychologyChrome: React.FC<PetFormPsychologyChromeProps> = ({
  isEditMode,
  petsUsed,
  maxPets,
  planLabel,
  progress,
  lockedInCount,
  petDisplayName,
  variant = 'full',
}) => {
  const { colors, fontFamilies, spacing, radius } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { gap: spacing.sm, marginBottom: spacing.md },
        compactWrap: { alignItems: 'center' },
        anchor: {
          fontSize: 13,
          color: colors.text.subdued,
        },
        compactAnchor: {
          textAlign: 'center',
        },
        gift: {
          backgroundColor: colors.brandTint5,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.primary + '33',
          padding: spacing.md,
        },
        giftTitle: {
          fontSize: 15,
          color: colors.text.heading,
          marginBottom: 4,
        },
        giftBody: {
          fontSize: 13,
          color: colors.text.body,
          lineHeight: 18,
        },
        progressLabelRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        progressLabel: {
          fontSize: 13,
          color: colors.text.heading,
        },
        progressPct: {
          fontSize: 13,
          color: colors.primary,
        },
        track: {
          height: 8,
          borderRadius: 999,
          backgroundColor: colors.borderSubtle,
          overflow: 'hidden',
        },
        fill: {
          height: '100%',
          borderRadius: 999,
          backgroundColor: colors.primary,
        },
        ikea: {
          fontSize: 12,
          color: colors.text.subdued,
        },
      }),
    [colors, radius, spacing],
  );

  const giftName = petDisplayName.trim() || 'your pet';
  const anchorText = isEditMode
    ? `Editing ${giftName}`
    : `Pet slot ${Math.min(petsUsed + 1, maxPets)} of ${maxPets} on ${planLabel}`;

  if (variant === 'compact') {
    return (
      <View style={styles.compactWrap}>
        <Text
          style={[
            styles.anchor,
            styles.compactAnchor,
            { fontFamily: fontFamilies.medium },
          ]}
        >
          {anchorText}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.anchor, { fontFamily: fontFamilies.medium }]}>
        {isEditMode
          ? `Editing ${giftName} · ${progress.percent}% profile strength`
          : anchorText}
      </Text>

      {!isEditMode ? (
        <View style={styles.gift}>
          <Text style={[styles.giftTitle, { fontFamily: fontFamilies.bold }]}>
            Your care timeline is reserved
          </Text>
          <Text style={[styles.giftBody, { fontFamily: fontFamilies.regular }]}>
            As soon as you add a name and birthday, Pawsoul unlocks a vet-aligned
            vaccine and deworming plan for {giftName}. No blank start.
          </Text>
        </View>
      ) : null}

      <View style={styles.progressLabelRow}>
        <Text style={[styles.progressLabel, { fontFamily: fontFamilies.semibold }]}>
          Profile progress
        </Text>
        <Text style={[styles.progressPct, { fontFamily: fontFamilies.bold }]}>
          {progress.percent}%
        </Text>
      </View>
      <View style={styles.track} accessibilityRole="progressbar">
        <View style={[styles.fill, { width: `${progress.percent}%` }]} />
      </View>
      <Text style={[styles.ikea, { fontFamily: fontFamilies.medium }]}>
        {lockedInCount > 0
          ? `${lockedInCount} detail${lockedInCount === 1 ? '' : 's'} locked in. Keep going.`
          : 'Smart defaults already applied. A few taps finish the profile.'}
      </Text>
    </View>
  );
};
