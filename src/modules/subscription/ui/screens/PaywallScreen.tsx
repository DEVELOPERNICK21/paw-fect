import React, { useEffect, useMemo } from 'react';
import { usePostHog } from 'posthog-react-native';
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

import type { PaywallRouteParams } from '../../../../app/navigation/types';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { PLAN_CATALOG, PLAN_CARE_PLUS, PLAN_FAMILY } from '../../../../shared/subscription/planCatalog';
import { useSubscriptionStore } from '../../store/subscriptionStore';

export const PaywallScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const source =
    (route.params as PaywallRouteParams | undefined)?.source ?? 'settings';
  const { colors, fontFamilies, spacing, radius } = useTheme();
  const entitlement = useSubscriptionStore(s => s.entitlement);
  const checkoutLoading = useSubscriptionStore(s => s.checkoutLoading);
  const checkoutError = useSubscriptionStore(s => s.checkoutError);
  const startPlayStoreCheckout = useSubscriptionStore(
    s => s.startPlayStoreCheckout,
  );
  const posthog = usePostHog();

  useEffect(() => {
    posthog.capture('paywall_viewed', { source });
  }, [posthog, source]);

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
        bannerText: { fontSize: 14, color: colors.text.body },
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
        price: { fontSize: 22, color: colors.text.heading, marginTop: spacing.xs },
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
        current: { fontSize: 13, color: colors.accent, marginBottom: spacing.md },
      }),
    [colors, radius, spacing],
  );

  const care = PLAN_CATALOG[PLAN_CARE_PLUS];
  const family = PLAN_CATALOG[PLAN_FAMILY];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
        >
          <MaterialIcon name="arrow_back" size={22} color={colors.text.heading} />
        </Pressable>
        <Text style={[styles.title, { fontFamily: fontFamilies.bold }]}>
          PawCare plans
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {source === 'pet_limit' ? (
          <View style={styles.banner}>
            <Text style={[styles.bannerText, { fontFamily: fontFamilies.medium }]}>
              You have reached the pet limit on your current plan. Upgrade to add
              another pet profile. Existing pets stay in your account; older pets may
              become view-only if you downgrade.
            </Text>
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
          <Text style={[styles.meta, { fontFamily: fontFamilies.regular }]}>
            Up to {care.maxPets} pets · unlimited history · PDF · offline · sharing
          </Text>
          <Text style={[styles.row, { fontFamily: fontFamilies.regular }]}>
            Annual billing = 10× monthly (2 months free).
          </Text>
          <Pressable
            style={styles.cta}
            disabled={checkoutLoading}
            onPress={() => {
              posthog.capture('subscription_checkout_started', { plan: PLAN_CARE_PLUS, billing: 'monthly', source });
              void startPlayStoreCheckout(PLAN_CARE_PLUS, 'monthly');
            }}
          >
            {checkoutLoading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={[styles.ctaText, { fontFamily: fontFamilies.bold }]}>
                Subscribe Care+ monthly
              </Text>
            )}
          </Pressable>
          <Pressable
            style={[styles.cta, { backgroundColor: colors.text.heading, marginTop: spacing.sm }]}
            disabled={checkoutLoading}
            onPress={() => {
              posthog.capture('subscription_checkout_started', { plan: PLAN_CARE_PLUS, billing: 'annual', source });
              void startPlayStoreCheckout(PLAN_CARE_PLUS, 'annual');
            }}
          >
            <Text style={[styles.ctaText, { fontFamily: fontFamilies.bold }]}>
              Subscribe Care+ annual
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
            Up to {family.maxPets} pets · multi-user · vet portal · priority support
          </Text>
          <Pressable
            style={styles.cta}
            disabled={checkoutLoading}
            onPress={() => {
              posthog.capture('subscription_checkout_started', { plan: PLAN_FAMILY, billing: 'monthly', source });
              void startPlayStoreCheckout(PLAN_FAMILY, 'monthly');
            }}
          >
            <Text style={[styles.ctaText, { fontFamily: fontFamilies.bold }]}>
              Subscribe Family monthly
            </Text>
          </Pressable>
          <Pressable
            style={[styles.cta, { backgroundColor: colors.text.heading, marginTop: spacing.sm }]}
            disabled={checkoutLoading}
            onPress={() => {
              posthog.capture('subscription_checkout_started', { plan: PLAN_FAMILY, billing: 'annual', source });
              void startPlayStoreCheckout(PLAN_FAMILY, 'annual');
            }}
          >
            <Text style={[styles.ctaText, { fontFamily: fontFamilies.bold }]}>
              Subscribe Family annual
            </Text>
          </Pressable>
        </View>

        {checkoutError ? (
          <Text style={[styles.error, { fontFamily: fontFamilies.medium }]}>
            {checkoutError}
          </Text>
        ) : null}

        <Text style={[styles.meta, { fontFamily: fontFamilies.regular, marginTop: spacing.lg }]}>
          On Android, payments are processed securely through Google Play Billing.
          Your plan updates as soon as purchase verification completes.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};
