import React, { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
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
  buildOnboardingCtaLabel,
  buildOnboardingLossLine,
  buildOnboardingSocialProofLine,
  orderPlanFeaturesForOnboarding,
  petDisplayName,
  PLAN_FEATURE_COPY,
} from '../../../app/domain/onboarding/onboardingPaywallCopy';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import {
  PLAN_CATALOG,
  PLAN_CARE_PLUS,
  PLAN_FAMILY,
} from '../../../../shared/subscription/planCatalog';
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
  const startPlayStoreCheckout = useSubscriptionStore(
    s => s.startPlayStoreCheckout,
  );

  const isOnboarding = source === 'onboarding';
  const nickname = petDisplayName(onboardingDraft?.petDraft);
  const lossLine = useMemo(() => {
    if (!isOnboarding) {
      return null;
    }
    return buildOnboardingLossLine(
      onboardingDraft
        ? {
            problems: onboardingDraft.problems,
            goal: onboardingDraft.goal,
            pet: onboardingDraft.petDraft ?? {
              species: 'dog',
              ageBand: 'adult',
              nickname: '',
            },
          }
        : null,
    );
  }, [isOnboarding, onboardingDraft]);

  const socialProofLine = isOnboarding
    ? buildOnboardingSocialProofLine()
    : null;

  const featureOrder = useMemo(
    () =>
      isOnboarding
        ? orderPlanFeaturesForOnboarding({
            goal: onboardingDraft?.goal ?? null,
            careInterests: onboardingDraft?.careInterests ?? [],
          })
        : null,
    [isOnboarding, onboardingDraft],
  );

  useEffect(() => {
    void trackEvent('paywall_viewed', { source });
    if (isOnboarding) {
      void trackEvent('onboarding_paywall_variant_shown', {
        source: 'onboarding',
        has_loss_line: Boolean(lossLine),
      });
    }
  }, [source, isOnboarding, lossLine]);

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
        title: {
          flex: 1,
          fontSize: 18,
          color: colors.text.heading,
          textAlign: 'center',
        },
        content: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
        banner: {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        },
        bannerThreat: {
          borderColor: colors.danger,
          backgroundColor: colors.surface,
        },
        bannerText: { fontSize: 14, color: colors.text.body, lineHeight: 20 },
        bannerHeadline: {
          fontSize: fontSizes.lg,
          color: colors.text.heading,
          marginBottom: spacing.xs,
        },
        bannerLoss: {
          fontSize: 14,
          color: colors.text.body,
          lineHeight: 20,
          marginTop: spacing.sm,
        },
        lossItem: {
          fontSize: 13,
          color: colors.text.body,
          marginTop: spacing.xs,
          lineHeight: 18,
        },
        anchorLine: {
          fontSize: 15,
          color: colors.primary,
          marginBottom: spacing.sm,
        },
        bannerOnboarding: { borderColor: colors.accent, borderWidth: 1 },
        skipButton: {
          paddingHorizontal: spacing.xs,
          paddingVertical: spacing.xs,
        },
        skipText: { fontSize: fontSizes.sm, color: colors.text.subdued },
        card: {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          padding: spacing.lg,
          marginBottom: spacing.md,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        },
        cardPopular: { borderColor: colors.primary, borderWidth: 2 },
        planName: { fontSize: 17, color: colors.text.heading },
        price: {
          fontSize: 22,
          color: colors.text.heading,
          marginTop: spacing.xs,
        },
        meta: { fontSize: 13, color: colors.text.subdued, marginTop: spacing.xs },
        row: { fontSize: 14, color: colors.text.body, marginTop: spacing.sm },
        cta: {
          marginTop: spacing.md,
          backgroundColor: colors.primary,
          borderRadius: radius.md,
          paddingVertical: spacing.sm,
          alignItems: 'center',
        },
        ctaText: { color: colors.surface, fontSize: 15 },
        error: { color: colors.danger, marginTop: spacing.md, fontSize: 14 },
        current: {
          fontSize: 13,
          color: colors.accent,
          marginBottom: spacing.md,
        },
      }),
    [colors, radius, spacing, fontSizes],
  );

  const care = PLAN_CATALOG[PLAN_CARE_PLUS];
  const family = PLAN_CATALOG[PLAN_FAMILY];
  const upgradePlan = maxPets < care.maxPets ? care : family;
  const upgradeLabel =
    upgradePlan.key === PLAN_CARE_PLUS ? 'Care+' : 'Family';

  const careFeatureLines = featureOrder
    ? featureOrder.map(id => PLAN_FEATURE_COPY[id])
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleDismiss}
          hitSlop={12}
          accessibilityRole="button"
        >
          <MaterialIcon
            name="arrow_back"
            size={22}
            color={colors.text.heading}
          />
        </Pressable>
        <Text style={[styles.title, { fontFamily: fontFamilies.bold }]}>
          PawCare plans
        </Text>
        {source === 'onboarding' ? (
          <Pressable
            onPress={handleDismiss}
            style={styles.skipButton}
            hitSlop={12}
            accessibilityRole="button"
          >
            <Text style={[styles.skipText, { fontFamily: fontFamilies.medium }]}>
              Skip for now
            </Text>
          </Pressable>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {source === 'pet_limit' ? (
          <View style={[styles.banner, styles.bannerThreat]}>
            <Text style={[styles.anchorLine, { fontFamily: fontFamilies.bold }]}>
              Slot {nextSlot} of {upgradePlan.maxPets} opens on {upgradeLabel} ·
              you have {maxPets} on your current plan
            </Text>
            <Text
              style={[styles.bannerHeadline, { fontFamily: fontFamilies.bold }]}
            >
              {draftName
                ? `${draftName}'s profile cannot be saved yet`
                : 'Another pet profile cannot be saved yet'}
            </Text>
            <Text
              style={[styles.bannerText, { fontFamily: fontFamilies.medium }]}
            >
              Without an upgrade you keep your current pet
              {maxPets === 1 ? '' : 's'}, but you lose the ability to add{' '}
              {draftName || 'this pet'} and unlock their care timeline.
            </Text>
            <Text
              style={[
                styles.bannerLoss,
                { fontFamily: fontFamilies.semibold },
              ]}
            >
              If you stay on your current plan you miss out on:
            </Text>
            <Text style={[styles.lossItem, { fontFamily: fontFamilies.regular }]}>
              · A dedicated profile and vaccine plan for{' '}
              {draftName || 'your next pet'}
            </Text>
            <Text style={[styles.lossItem, { fontFamily: fontFamilies.regular }]}>
              · Up to {upgradePlan.maxPets} pets on {upgradeLabel} (vs {maxPets}{' '}
              now)
            </Text>
            <Text style={[styles.lossItem, { fontFamily: fontFamilies.regular }]}>
              · Unlimited history, week view, Pro care tasks, and wellness score
            </Text>
          </View>
        ) : null}

        {isOnboarding && (headlineOverride || lossLine) ? (
          <View style={[styles.banner, styles.bannerOnboarding]}>
            {headlineOverride ? (
              <Text
                style={[
                  styles.bannerHeadline,
                  { fontFamily: fontFamilies.bold },
                ]}
              >
                {headlineOverride}
              </Text>
            ) : null}
            {lossLine ? (
              <Text
                style={[styles.bannerText, { fontFamily: fontFamilies.medium }]}
              >
                {lossLine}
              </Text>
            ) : null}
            {socialProofLine ? (
              <Text
                style={[styles.bannerLoss, { fontFamily: fontFamilies.medium }]}
              >
                {socialProofLine}
              </Text>
            ) : null}
          </View>
        ) : null}

        <Text style={[styles.current, { fontFamily: fontFamilies.medium }]}>
          Current access: {entitlement.plan.replace('_', ' ')} · up to{' '}
          {entitlement.maxPets} pets
          {entitlement.trialActive ? ' · trial active' : ''}
          {entitlement.graceActive ? ' · grace period' : ''}
        </Text>

        <View style={[styles.card, styles.cardPopular]}>
          <Text style={[styles.planName, { fontFamily: fontFamilies.bold }]}>
            Care+
          </Text>
          <Text style={[styles.price, { fontFamily: fontFamilies.bold }]}>
            ₹{care.priceMonthlyInr}/mo · ₹{care.priceAnnualInr}/yr
          </Text>
          {careFeatureLines ? (
            careFeatureLines.map(line => (
              <Text
                key={line}
                style={[styles.row, { fontFamily: fontFamilies.regular }]}
              >
                · {line}
              </Text>
            ))
          ) : (
            <Text style={[styles.meta, { fontFamily: fontFamilies.regular }]}>
              Up to {care.maxPets} pets · unlimited history · week view · Pro
              care tasks · wellness score
            </Text>
          )}
          <Text style={[styles.row, { fontFamily: fontFamilies.regular }]}>
            Annual billing = 10× monthly (2 months free).
          </Text>
          <Pressable
            style={styles.cta}
            disabled={checkoutLoading}
            onPress={() => {
              void trackEvent('subscription_checkout_started', {
                plan: PLAN_CARE_PLUS,
                billing: 'monthly',
                source,
              });
              void startPlayStoreCheckout(PLAN_CARE_PLUS, 'monthly');
            }}
          >
            {checkoutLoading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={[styles.ctaText, { fontFamily: fontFamilies.bold }]}>
                {isOnboarding
                  ? buildOnboardingCtaLabel(nickname, 'Care+', 'monthly')
                  : 'Subscribe Care+ monthly'}
              </Text>
            )}
          </Pressable>
          <Pressable
            style={[
              styles.cta,
              {
                backgroundColor: colors.text.heading,
                marginTop: spacing.sm,
              },
            ]}
            disabled={checkoutLoading}
            onPress={() => {
              void trackEvent('subscription_checkout_started', {
                plan: PLAN_CARE_PLUS,
                billing: 'annual',
                source,
              });
              void startPlayStoreCheckout(PLAN_CARE_PLUS, 'annual');
            }}
          >
            <Text style={[styles.ctaText, { fontFamily: fontFamilies.bold }]}>
              {isOnboarding
                ? buildOnboardingCtaLabel(nickname, 'Care+', 'annual')
                : 'Subscribe Care+ annual'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={[styles.planName, { fontFamily: fontFamilies.bold }]}>
            Family
          </Text>
          <Text style={[styles.price, { fontFamily: fontFamilies.bold }]}>
            ₹{family.priceMonthlyInr}/mo · ₹{family.priceAnnualInr}/yr
          </Text>
          <Text style={[styles.meta, { fontFamily: fontFamilies.regular }]}>
            Up to {family.maxPets} pets · everything in Care+ · priority support
          </Text>
          <Pressable
            style={styles.cta}
            disabled={checkoutLoading}
            onPress={() => {
              void trackEvent('subscription_checkout_started', {
                plan: PLAN_FAMILY,
                billing: 'monthly',
                source,
              });
              void startPlayStoreCheckout(PLAN_FAMILY, 'monthly');
            }}
          >
            <Text style={[styles.ctaText, { fontFamily: fontFamilies.bold }]}>
              {isOnboarding
                ? buildOnboardingCtaLabel(nickname, 'Family', 'monthly')
                : 'Subscribe Family monthly'}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.cta,
              {
                backgroundColor: colors.text.heading,
                marginTop: spacing.sm,
              },
            ]}
            disabled={checkoutLoading}
            onPress={() => {
              void trackEvent('subscription_checkout_started', {
                plan: PLAN_FAMILY,
                billing: 'annual',
                source,
              });
              void startPlayStoreCheckout(PLAN_FAMILY, 'annual');
            }}
          >
            <Text style={[styles.ctaText, { fontFamily: fontFamilies.bold }]}>
              {isOnboarding
                ? buildOnboardingCtaLabel(nickname, 'Family', 'annual')
                : 'Subscribe Family annual'}
            </Text>
          </Pressable>
        </View>

        {checkoutError ? (
          <Text style={[styles.error, { fontFamily: fontFamilies.medium }]}>
            {checkoutError}
          </Text>
        ) : null}

        <Text
          style={[
            styles.meta,
            { fontFamily: fontFamilies.regular, marginTop: spacing.lg },
          ]}
        >
          On Android, payments are processed securely through Google Play
          Billing. Your plan updates as soon as purchase verification completes.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PaywallScreen;
