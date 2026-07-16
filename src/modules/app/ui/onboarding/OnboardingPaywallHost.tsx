import React, { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { usePostHog } from 'posthog-react-native';

import { PaywallScreen } from '../../../subscription/ui/screens/PaywallScreen';
import { useSubscriptionStore } from '../../../subscription/store/subscriptionStore';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { buildCarePlanSummary } from '../../domain/onboarding/buildCarePlanSummary';
import { useOnboardingDraftStore } from '../../store/onboardingDraftStore';

const isPaidOrTrial = (source: string): boolean =>
  source === 'paid' || source === 'trial';

/**
 * Composition root that mounts the shared PaywallScreen for the onboarding
 * funnel without a dead navigation stack. Owns the two cross-feature
 * concerns PaywallScreen itself must not know about: watching entitlement
 * for a successful purchase, and advancing the onboarding draft on
 * dismiss/purchase.
 */
export const OnboardingPaywallHost: React.FC = () => {
  const draft = useOnboardingDraftStore(state => state.draft);
  const update = useOnboardingDraftStore(state => state.update);
  const setPhase = useOnboardingDraftStore(state => state.setPhase);
  const entitlementSource = useSubscriptionStore(
    state => state.entitlement.source,
  );
  const serverSynced = useSubscriptionStore(state => state.serverSynced);
  const { colors } = useTheme();
  const posthog = usePostHog();

  const summary = useMemo(() => buildCarePlanSummary(draft), [draft]);

  /** null until first serverSynced; then whether user was free at that moment. */
  const wasFreeAtSyncRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!serverSynced) {
      return;
    }

    if (wasFreeAtSyncRef.current === null) {
      if (isPaidOrTrial(entitlementSource)) {
        wasFreeAtSyncRef.current = false;
        posthog.capture('paywall_skipped_entitled', { source: 'onboarding' });
        setPhase('tips');
      } else {
        wasFreeAtSyncRef.current = true;
      }
      return;
    }

    if (
      wasFreeAtSyncRef.current &&
      isPaidOrTrial(entitlementSource)
    ) {
      wasFreeAtSyncRef.current = false;
      setPhase('tips');
    }
  }, [serverSynced, entitlementSource, setPhase, posthog]);

  const handleDismiss = (): void => {
    update(current => ({ ...current, skippedPaywall: true }));
    setPhase('tips');
  };

  const loadingStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        },
      }),
    [colors.background],
  );

  if (!serverSynced || isPaidOrTrial(entitlementSource)) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <PaywallScreen
      sourceOverride="onboarding"
      headlineOverride={summary.paywallHeadline}
      onDismiss={handleDismiss}
    />
  );
};

export default OnboardingPaywallHost;
