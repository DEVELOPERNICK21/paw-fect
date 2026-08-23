import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { trackEvent } from '../../../../infrastructure/analytics/analytics';
import { images } from '../../../../shared/assets/images';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { lineHeights } from '../../../../shared/theme/typography';
import { useOnboardingDraftStore } from '../../store/onboardingDraftStore';
import { OnboardingBlobBackdrop } from './components/OnboardingBlobBackdrop';
import { ScalePressable } from './components/ScalePressable';

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
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing['2xl'],
    },
    backdropWrap: {
      opacity: 0.35,
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
    heroImage: {
      width: '100%',
      maxWidth: 320,
      height: 280,
      resizeMode: 'contain',
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
      <View style={styles.backdropWrap}>
        <OnboardingBlobBackdrop />
      </View>
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
            Pawsoul
          </Text>
        </View>

        <View style={styles.heroWrap}>
          <Image
            source={images.petHd1}
            style={styles.heroImage}
            accessibilityIgnoresInvertColors
            accessibilityLabel="Happy pet"
          />
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
    </SafeAreaView>
  );
};

export default OnboardingWelcomeScreen;
