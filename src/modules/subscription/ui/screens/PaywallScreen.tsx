import React, { useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import { trackEvent } from '../../../../infrastructure/analytics/analytics';
import type { PaywallRouteParams } from '../../../../app/navigation/types';
import type { OnboardingDraft } from '../../../app/domain/onboarding/OnboardingDraft';
import {
  buildOnboardingSocialProofLine,
  buildOnboardingValueSubline,
  petDisplayName,
} from '../../../app/domain/onboarding/onboardingPaywallCopy';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { formatSubscriptionStatusLine } from '../../../../shared/subscription/formatPlanLabel';
import { useSubscriptionStore } from '../../store/subscriptionStore';

export type PaywallScreenProps = {
  sourceOverride?: PaywallRouteParams['source'];
  onDismiss?: () => void;
  headlineOverride?: string;
  onboardingDraft?: OnboardingDraft | null;
};

export const PaywallScreen: React.FC<PaywallScreenProps> = ({
  sourceOverride,
  onDismiss,
  headlineOverride,
  onboardingDraft,
}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const source =
    sourceOverride ??
    (route.params as PaywallRouteParams | undefined)?.source ??
    'settings';
  const lossContext = (route.params as PaywallRouteParams | undefined)
    ?.lossContext;
  const { colors, fontFamilies, fontSizes, spacing, radius } = useTheme();
  const entitlement = useSubscriptionStore(s => s.entitlement);
  const checkoutLoading = useSubscriptionStore(s => s.checkoutLoading);
  const checkoutError = useSubscriptionStore(s => s.checkoutError);
  const restorePurchases = useSubscriptionStore(s => s.restorePurchases);
  const presentRcPaywall = useSubscriptionStore(s => s.presentRcPaywall);
  const openCustomerCenter = useSubscriptionStore(s => s.openCustomerCenter);

  const storeCheckoutEnabled = Platform.OS === 'android';
  const didAutoPresentRef = useRef(false);

  const isOnboarding = source === 'onboarding';
  const nickname = petDisplayName(onboardingDraft?.petDraft);
  const valueSubline = isOnboarding
    ? buildOnboardingValueSubline(onboardingDraft?.petDraft)
    : null;
  const socialProofLine = isOnboarding
    ? buildOnboardingSocialProofLine()
    : null;

  useEffect(() => {
    void trackEvent('paywall_viewed', { source });
    if (isOnboarding) {
      void trackEvent('onboarding_paywall_variant_shown', {
        source: 'onboarding',
        has_loss_line: false,
      });
    }
  }, [source, isOnboarding]);

  // Present RevenueCat Paywall UI once (dashboard-designed) instead of custom plan cards.
  useEffect(() => {
    if (!storeCheckoutEnabled || didAutoPresentRef.current) {
      return;
    }
    didAutoPresentRef.current = true;
    void trackEvent('subscription_rc_paywall_opened', {
      source,
      auto: true,
    });
    void presentRcPaywall();
  }, [storeCheckoutEnabled, source, presentRcPaywall]);

  const handleDismiss = (): void => {
    if (source === 'onboarding') {
      void trackEvent('paywall_dismissed', { source });
    }
    if (onDismiss) {
      onDismiss();
    } else {
      navigation.goBack();
    }
  };

  const petsUsed = lossContext?.petsUsed ?? null;
  const maxPets = lossContext?.maxPets ?? entitlement.maxPets;
  const draftName = lossContext?.draftPetName?.trim();
  const nextSlot = petsUsed != null ? petsUsed + 1 : maxPets + 1;
  const statusLine = formatSubscriptionStatusLine(entitlement);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.backgroundAlt },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
        headerTitle: {
          flex: 1,
          textAlign: 'center',
          fontSize: fontSizes.lg,
          color: colors.text.heading,
        },
        closeHit: { padding: spacing.sm },
        scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
        banner: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          marginBottom: spacing.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        bannerOnboarding: {
          borderColor: colors.primary,
        },
        bannerHeadline: {
          fontSize: fontSizes.xl,
          color: colors.text.heading,
          marginBottom: spacing.xs,
        },
        bannerText: {
          fontSize: fontSizes.md,
          color: colors.text.body,
          marginBottom: spacing.xs,
        },
        bannerLoss: {
          fontSize: fontSizes.sm,
          color: colors.text.subdued,
        },
        current: {
          fontSize: fontSizes.md,
          color: colors.text.body,
          marginBottom: spacing.lg,
        },
        storeCaption: {
          fontSize: fontSizes.sm,
          color: colors.text.subdued,
          marginBottom: spacing.md,
        },
        cta: {
          backgroundColor: colors.primary,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          alignItems: 'center',
          marginBottom: spacing.sm,
          minHeight: 48,
          justifyContent: 'center',
        },
        ctaSecondary: {
          backgroundColor: colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        ctaText: {
          color: colors.surface,
          fontSize: fontSizes.md,
        },
        ctaTextSecondary: {
          color: colors.text.heading,
          fontSize: fontSizes.md,
        },
        error: {
          color: colors.danger,
          fontSize: fontSizes.sm,
          marginVertical: spacing.sm,
        },
        restoreButton: {
          alignItems: 'center',
          paddingVertical: spacing.md,
        },
        restoreText: {
          color: colors.primary,
          fontSize: fontSizes.sm,
        },
        meta: {
          fontSize: fontSizes.sm,
          color: colors.text.subdued,
        },
        opening: {
          alignItems: 'center',
          paddingVertical: spacing.xl,
          gap: spacing.sm,
        },
        openingText: {
          fontSize: fontSizes.sm,
          color: colors.text.subdued,
        },
      }),
    [colors, fontSizes, radius, spacing],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          style={styles.closeHit}
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <MaterialIcon name="close" size={24} color={colors.text.heading} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: fontFamilies.bold }]}>
          PawCare plans
        </Text>
        <View style={styles.closeHit} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {source === 'pet_limit' ? (
          <View style={styles.banner}>
            <Text
              style={[styles.bannerHeadline, { fontFamily: fontFamilies.bold }]}
            >
              {draftName
                ? `Add ${draftName} with a paid plan`
                : 'Pet limit reached'}
            </Text>
            <Text
              style={[styles.bannerText, { fontFamily: fontFamilies.medium }]}
            >
              Free includes {maxPets} pet
              {maxPets === 1 ? '' : 's'}. Slot {nextSlot} needs Care+ or Family.
              {petsUsed != null ? ` You’re using ${petsUsed} now.` : ''}
            </Text>
          </View>
        ) : null}

        {isOnboarding && headlineOverride ? (
          <View style={[styles.banner, styles.bannerOnboarding]}>
            <Text
              style={[
                styles.bannerHeadline,
                { fontFamily: fontFamilies.bold },
              ]}
            >
              {headlineOverride}
            </Text>
            {valueSubline ? (
              <Text
                style={[styles.bannerText, { fontFamily: fontFamilies.medium }]}
              >
                {valueSubline}
              </Text>
            ) : null}
            {socialProofLine ? (
              <Text
                style={[styles.bannerLoss, { fontFamily: fontFamilies.medium }]}
              >
                {socialProofLine}
              </Text>
            ) : null}
            {nickname ? (
              <Text
                style={[styles.bannerLoss, { fontFamily: fontFamilies.medium }]}
              >
                Keep {nickname}’s care on track with PawCare Pro.
              </Text>
            ) : null}
          </View>
        ) : null}

        <Text style={[styles.current, { fontFamily: fontFamilies.medium }]}>
          Current plan: {statusLine}
        </Text>

        {!storeCheckoutEnabled ? (
          <Text
            style={[styles.storeCaption, { fontFamily: fontFamilies.medium }]}
          >
            App Store billing is coming soon. You can still continue on Free /
            trial.
          </Text>
        ) : null}

        {storeCheckoutEnabled && checkoutLoading ? (
          <View style={styles.opening}>
            <ActivityIndicator color={colors.primary} />
            <Text
              style={[styles.openingText, { fontFamily: fontFamilies.medium }]}
            >
              Opening subscription plans…
            </Text>
          </View>
        ) : null}

        {storeCheckoutEnabled ? (
          <>
            <Pressable
              style={styles.cta}
              disabled={checkoutLoading}
              onPress={() => {
                void trackEvent('subscription_rc_paywall_opened', {
                  source,
                  auto: false,
                });
                void presentRcPaywall();
              }}
            >
              {checkoutLoading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text
                  style={[styles.ctaText, { fontFamily: fontFamilies.bold }]}
                >
                  View plans & subscribe
                </Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.cta, styles.ctaSecondary]}
              disabled={checkoutLoading}
              onPress={() => {
                void trackEvent('subscription_customer_center_opened', {
                  source,
                });
                void openCustomerCenter();
              }}
            >
              <Text
                style={[
                  styles.ctaTextSecondary,
                  { fontFamily: fontFamilies.bold },
                ]}
              >
                Manage subscription
              </Text>
            </Pressable>
          </>
        ) : null}

        {checkoutError ? (
          <Text style={[styles.error, { fontFamily: fontFamilies.medium }]}>
            {checkoutError}
          </Text>
        ) : null}

        <Pressable
          style={styles.restoreButton}
          disabled={checkoutLoading}
          accessibilityRole="button"
          onPress={() => {
            void trackEvent('subscription_restore_started', { source });
            void restorePurchases();
          }}
        >
          <Text style={[styles.restoreText, { fontFamily: fontFamilies.medium }]}>
            Restore purchases
          </Text>
        </Pressable>

        <Text
          style={[
            styles.meta,
            { fontFamily: fontFamilies.regular, marginTop: spacing.lg },
          ]}
        >
          Plans and prices come from RevenueCat / Google Play. Your access
          updates after purchase confirmation.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PaywallScreen;
