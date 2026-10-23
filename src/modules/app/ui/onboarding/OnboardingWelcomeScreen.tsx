import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { trackEvent } from '../../../../infrastructure/analytics/analytics';
import { images } from '../../../../shared/assets/images';
import { companionLines } from '../../../../shared/components/Companion';
import { Mascot } from '../../../../shared/components/Mascot';
import type { MascotReactionRequest } from '../../../../shared/components/Mascot';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { lineHeights } from '../../../../shared/theme/typography';
import { useOnboardingDraftStore } from '../../store/onboardingDraftStore';
import { OnboardingBlobBackdrop } from './components/OnboardingBlobBackdrop';
import { ScalePressable } from './components/ScalePressable';

const WELCOME_MASCOT_SIZE = 200;
const WELCOME_GREETING: MascotReactionRequest = {
  reaction: 'welcome',
  id: 'onboarding-welcome',
};
const WELCOME_LINES = companionLines({ scene: 'onboarding', step: 'welcome' });

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
      position: 'relative',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing['2xl'],
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing['2xl'],
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    brandIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      overflow: 'hidden',
    },
    brandName: {
      fontSize: fontSizes.lg,
      lineHeight: lineHeights.lg,
      color: colors.text.heading,
      letterSpacing: -0.3,
    },
    heroWrap: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    speech: {
      marginTop: spacing.sm,
      backgroundColor: colors.surface,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: radius.xl,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      maxWidth: 320,
    },
    speechText: {
      fontSize: fontSizes.base,
      lineHeight: lineHeights.base,
      color: colors.text.heading,
      textAlign: 'center',
    },
    headline: {
      fontSize: fontSizes['2xl'],
      lineHeight: lineHeights['2xl'],
      color: colors.text.heading,
      textAlign: 'center',
      letterSpacing: -0.6,
      marginBottom: spacing.md,
    },
    subtitle: {
      fontSize: fontSizes.md,
      lineHeight: lineHeights.base,
      color: colors.text.body,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    costLine: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.sm,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: spacing['2xl'],
    },
    actions: {
      marginTop: 'auto',
      paddingTop: spacing.lg,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.text.heading,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      paddingLeft: spacing.xl,
      paddingRight: spacing.sm,
      minHeight: 56,
    },
    primaryLabel: {
      fontSize: fontSizes.base,
      lineHeight: lineHeights.base,
      color: colors.text.inverse,
      flex: 1,
    },
    chevronCircle: {
      width: 40,
      height: 40,
      borderRadius: radius.round,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chevronGlyph: {
      fontSize: fontSizes.xl,
      lineHeight: lineHeights.xl,
      color: colors.text.inverse,
      marginTop: -2,
    },
    secondaryButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.lg,
      marginTop: spacing.sm,
    },
    secondaryLabel: {
      fontSize: fontSizes.base,
      lineHeight: lineHeights.base,
      color: colors.text.body,
    },
  });

export const OnboardingWelcomeScreen: React.FC = () => {
  const { colors, fontFamilies, fontSizes, spacing, radius, isDarkMode } =
    useTheme();
  const styles = useMemo(
    () => createStyles({ colors, spacing, radius, fontSizes }),
    [colors, spacing, radius, fontSizes],
  );

  const startActivation = useOnboardingDraftStore(state => state.startActivation);
  const setSignInIntent = useOnboardingDraftStore(state => state.setSignInIntent);

  const [lineIndex, setLineIndex] = useState(0);
  const welcomeLine = WELCOME_LINES[lineIndex % WELCOME_LINES.length];
  const handleMascotPress = useCallback(() => {
    setLineIndex(i => i + 1);
  }, []);

  useEffect(() => {
    void trackEvent('onboarding_welcome_viewed');
  }, []);

  const handleGetStarted = useCallback(() => {
    void trackEvent('onboarding_activation_started');
    startActivation();
  }, [startActivation]);

  const handleSignIn = useCallback(() => {
    void trackEvent('onboarding_sign_in_tapped');
    setSignInIntent();
  }, [setSignInIntent]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.backgroundAlt}
      />
      <View style={styles.container}>
        <OnboardingBlobBackdrop />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.brandRow}>
          <Image
            source={images.appIcon}
            style={styles.brandIcon}
            accessibilityIgnoresInvertColors
          />
          <Text style={[styles.brandName, { fontFamily: fontFamilies.bold }]}>
            Pawfect
          </Text>
        </View>

        <View style={styles.heroWrap}>
          <Mascot
            mood="wave"
            size={WELCOME_MASCOT_SIZE}
            interactive
            onPress={handleMascotPress}
            reactionRequest={WELCOME_GREETING}
            accessibilityLabel="Your pet's buddy. Tap to say hi."
          />
          <Pressable
            onPress={handleMascotPress}
            accessibilityRole="text"
            accessibilityLabel={welcomeLine}
            style={styles.speech}
          >
            <Text style={[styles.speechText, { fontFamily: fontFamilies.medium }]}>
              {welcomeLine}
            </Text>
          </Pressable>
        </View>

        <Text
          style={[styles.headline, { fontFamily: fontFamilies.extrabold }]}
          accessibilityRole="header"
        >
          Care for all your pets in one place
        </Text>
        <Text style={[styles.subtitle, { fontFamily: fontFamilies.medium }]}>
          Reminders, health records, and daily care — organized so nothing slips
          through.
        </Text>
        <Text style={[styles.costLine, { fontFamily: fontFamilies.regular }]}>
          About 2 minutes · your pet&apos;s name and one reminder
        </Text>

        <View style={styles.actions}>
          <ScalePressable
            accessibilityRole="button"
            accessibilityLabel="Get Started"
            onPress={handleGetStarted}
            style={styles.primaryButton}
          >
            <Text
              style={[styles.primaryLabel, { fontFamily: fontFamilies.semibold }]}
            >
              Get Started
            </Text>
            <View style={styles.chevronCircle}>
              <Text style={styles.chevronGlyph}>›</Text>
            </View>
          </ScalePressable>

          <ScalePressable
            accessibilityRole="button"
            accessibilityLabel="I already have an account"
            onPress={handleSignIn}
            style={styles.secondaryButton}
            pressedScale={0.98}
          >
            <Text
              style={[styles.secondaryLabel, { fontFamily: fontFamilies.medium }]}
            >
              I already have an account
            </Text>
          </ScalePressable>
        </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingWelcomeScreen;
