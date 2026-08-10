import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { trackEvent } from '../../../../../infrastructure/analytics/analytics';
import { useTheme } from '../../../../../shared/hooks/useTheme';
import { lineHeights } from '../../../../../shared/theme/typography';
import { useSettingsStore } from '../../../../settings/store/settingsStore';
import { useOnboardingDraftStore } from '../../../store/onboardingDraftStore';

type Tip = {
  glyph: string;
  title: string;
  body: string;
};

const buildTips = (nickname: string): Tip[] => {
  const petLabel = nickname.trim().length > 0 ? nickname.trim() : null;
  return [
    {
      glyph: '🔔',
      title: 'Timely reminders',
      body: petLabel
        ? `Gentle nudges for ${petLabel}'s vaccines, walks, and medicines, so nothing slips through the cracks.`
        : 'Gentle nudges for vaccines, walks, and medicines, so nothing slips through the cracks.',
    },
    {
      glyph: '📋',
      title: 'One health record',
      body: 'Vaccination and vet visit history kept in one place, ready whenever you need it.',
    },
  ];
};

type ThemeParams = {
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  radius: ReturnType<typeof useTheme>['radius'];
  fontSizes: ReturnType<typeof useTheme>['fontSizes'];
};

const createStyles = ({ colors, spacing, radius, fontSizes }: ThemeParams) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundAlt,
    },
    container: {
      flex: 1,
      paddingHorizontal: spacing.xl,
    },
    header: {
      paddingTop: spacing['3xl'],
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
      marginTop: spacing.sm,
      fontSize: fontSizes.md,
      lineHeight: lineHeights.base,
      color: colors.text.body,
      textAlign: 'center',
    },
    tipList: {
      marginTop: spacing['2xl'],
    },
    tipCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderRadius: radius.lg,
      backgroundColor: colors.brandTint5,
      borderWidth: 1,
      borderColor: colors.brandTint10,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    tipBadge: {
      width: 44,
      height: 44,
      borderRadius: radius.round,
      backgroundColor: colors.brandTint10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    tipGlyph: {
      fontSize: fontSizes.lg,
    },
    tipTextWrap: {
      flex: 1,
    },
    tipTitle: {
      fontSize: fontSizes.lead,
      lineHeight: lineHeights.md,
      color: colors.text.heading,
    },
    tipBody: {
      marginTop: spacing.xxs,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      color: colors.text.body,
    },
    errorText: {
      marginTop: spacing.md,
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      color: colors.danger,
      textAlign: 'center',
    },
    actions: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    primaryButton: {
      flexDirection: 'row',
      backgroundColor: colors.accent,
      borderRadius: radius.xl,
      paddingVertical: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonDisabled: {
      opacity: 0.45,
    },
    primaryButtonSpinner: {
      marginRight: spacing.sm,
    },
    primaryButtonText: {
      fontSize: fontSizes.base,
      lineHeight: lineHeights.base,
      color: colors.text.inverse,
    },
  });

export const OnboardingTipsScreen: React.FC = () => {
  const { colors, fontFamilies, fontSizes, spacing, radius, isDarkMode } =
    useTheme();
  const styles = useMemo(
    () => createStyles({ colors, spacing, radius, fontSizes }),
    [colors, spacing, radius, fontSizes],
  );

  const draft = useOnboardingDraftStore(state => state.draft);
  const completeFunnel = useOnboardingDraftStore(state => state.completeFunnel);
  const tips = useMemo(
    () => buildTips(draft.petDraft?.nickname ?? ''),
    [draft.petDraft?.nickname],
  );

  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = useCallback(async () => {
    if (completing) {
      return;
    }
    setCompleting(true);
    setError(null);

    const skippedPaywall = draft.skippedPaywall;
    const careInterests = draft.careInterests;

    await completeFunnel();

    const settingsAfterComplete = useSettingsStore.getState().settings;
    if (!settingsAfterComplete?.onboardingCompleted) {
      setError("We couldn't finish setting things up. Please try again.");
      setCompleting(false);
      return;
    }

    void trackEvent('onboarding_completed', {
      skipped_paywall: skippedPaywall,
      care_interests: careInterests.join(','),
    });
  }, [completing, draft.skippedPaywall, draft.careInterests, completeFunnel]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.backgroundAlt}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { fontFamily: fontFamilies.extrabold }]}>
            Here&apos;s how Pawsoul helps
          </Text>
          <Text style={[styles.subtitle, { fontFamily: fontFamilies.medium }]}>
            Two small habits, and you&apos;ll always feel on top of your
            pet&apos;s care.
          </Text>
        </View>

        <View style={styles.tipList}>
          {tips.map(tip => (
            <View key={tip.title} style={styles.tipCard}>
              <View style={styles.tipBadge}>
                <Text style={styles.tipGlyph}>{tip.glyph}</Text>
              </View>
              <View style={styles.tipTextWrap}>
                <Text
                  style={[styles.tipTitle, { fontFamily: fontFamilies.bold }]}
                >
                  {tip.title}
                </Text>
                <Text
                  style={[
                    styles.tipBody,
                    { fontFamily: fontFamilies.medium },
                  ]}
                >
                  {tip.body}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {error ? (
          <Text style={[styles.errorText, { fontFamily: fontFamilies.medium }]}>
            {error}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={handleContinue}
          disabled={completing}
          style={[
            styles.primaryButton,
            completing ? styles.primaryButtonDisabled : null,
          ]}
        >
          {completing ? (
            <ActivityIndicator
              color={colors.text.inverse}
              style={styles.primaryButtonSpinner}
            />
          ) : null}
          <Text
            style={[
              styles.primaryButtonText,
              { fontFamily: fontFamilies.bold },
            ]}
          >
            Continue to Pawsoul
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingTipsScreen;
