import React, { useEffect, useMemo, useRef } from 'react';

import { PaywallScreen } from '../../../subscription/ui/screens/PaywallScreen';
import { useSubscriptionStore } from '../../../subscription/store/subscriptionStore';
import { buildCarePlanSummary } from '../../domain/onboarding/buildCarePlanSummary';
import { useOnboardingDraftStore } from '../../store/onboardingDraftStore';

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

  const summary = useMemo(() => buildCarePlanSummary(draft), [draft]);

  const hasPaidAccessRef = useRef(entitlementSource !== 'free');

  useEffect(() => {
    if (hasPaidAccessRef.current) {
      return;
    }
    if (entitlementSource === 'paid' || entitlementSource === 'trial') {
      hasPaidAccessRef.current = true;
      setPhase('tips');
    }
  }, [entitlementSource, setPhase]);

  const handleDismiss = (): void => {
    update(current => ({ ...current, skippedPaywall: true }));
    setPhase('tips');
  };

  return (
    <PaywallScreen
      sourceOverride="onboarding"
      headlineOverride={summary.paywallHeadline}
      onDismiss={handleDismiss}
    />
  );
};

export default OnboardingPaywallHost;
