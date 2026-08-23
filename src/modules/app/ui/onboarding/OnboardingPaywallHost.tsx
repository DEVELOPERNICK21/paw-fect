import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { trackEvent } from '../../../../infrastructure/analytics/analytics';
import { PaywallScreen } from '../../../subscription/ui/screens/PaywallScreen';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { useAppSession } from '../../../../shared/session/useAppSession';
import { usePetStore } from '../../../pets/store/petStore';
import { useReminderStore } from '../../../reminders/store/reminderStore';
import { buildOnboardingValueHeadline } from '../../domain/onboarding/onboardingPaywallCopy';
import { useOnboardingDraftStore } from '../../store/onboardingDraftStore';
import { refreshPostPersistData } from './refreshPostPersistData';

const SYNC_TIMEOUT_MS = 6000;

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
  const completeFunnel = useOnboardingDraftStore(state => state.completeFunnel);
  const loadPets = usePetStore(state => state.loadPets);
  const loadReminders = useReminderStore(state => state.loadReminders);
  const { entitlementSource, entitlementServerSynced: serverSynced } =
    useAppSession();
  const { colors } = useTheme();

  const headline = useMemo(
    () => buildOnboardingValueHeadline(draft.petDraft),
    [draft.petDraft],
  );

  /** null until first serverSynced; then whether user was free at that moment. */
  const wasFreeAtSyncRef = useRef<boolean | null>(null);
  /** Set when sync wait times out so late serverSynced can still skip entitled users. */
  const armedByTimeoutRef = useRef(false);
  const [syncTimedOut, setSyncTimedOut] = useState(false);

  const finishOnboarding = useCallback((): void => {
    void refreshPostPersistData(loadPets, loadReminders).catch(() => {});
    setPhase('done');
    void completeFunnel();
  }, [completeFunnel, loadPets, loadReminders, setPhase]);

  useEffect(() => {
    if (serverSynced) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setSyncTimedOut(true);
    }, SYNC_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, [serverSynced]);

  useEffect(() => {
    if (!syncTimedOut || serverSynced || wasFreeAtSyncRef.current !== null) {
      return;
    }

    wasFreeAtSyncRef.current = true;
    armedByTimeoutRef.current = true;
  }, [syncTimedOut, serverSynced]);

  useEffect(() => {
    if (!draft.createdPetId) {
      setPhase('persist');
      return;
    }

    if (!serverSynced) {
      if (
        syncTimedOut &&
        wasFreeAtSyncRef.current &&
        isPaidOrTrial(entitlementSource)
      ) {
        wasFreeAtSyncRef.current = false;
        armedByTimeoutRef.current = false;
        update(current => ({
          ...current,
          paywallOutcome: 'entitled_auto_skip',
        }));
        void trackEvent('paywall_skipped_entitled', { source: 'onboarding' });
        finishOnboarding();
      }
      return;
    }

    if (wasFreeAtSyncRef.current === null) {
      if (isPaidOrTrial(entitlementSource)) {
        wasFreeAtSyncRef.current = false;
        update(current => ({
          ...current,
          paywallOutcome: 'entitled_auto_skip',
        }));
        void trackEvent('paywall_skipped_entitled', { source: 'onboarding' });
        finishOnboarding();
      } else {
        wasFreeAtSyncRef.current = true;
      }
      return;
    }

    if (armedByTimeoutRef.current && isPaidOrTrial(entitlementSource)) {
      wasFreeAtSyncRef.current = false;
      armedByTimeoutRef.current = false;
      update(current => ({
        ...current,
        paywallOutcome: 'entitled_auto_skip',
      }));
      void trackEvent('paywall_skipped_entitled', { source: 'onboarding' });
      finishOnboarding();
      return;
    }

    if (
      wasFreeAtSyncRef.current &&
      isPaidOrTrial(entitlementSource)
    ) {
      wasFreeAtSyncRef.current = false;
      update(current => ({
        ...current,
        paywallOutcome: 'purchased',
      }));
      finishOnboarding();
    }
  }, [
    draft.createdPetId,
    serverSynced,
    syncTimedOut,
    entitlementSource,
    setPhase,
    update,
    finishOnboarding,
  ]);

  const handleDismiss = (): void => {
    update(current => ({
      ...current,
      skippedPaywall: true,
      paywallOutcome: 'skipped',
    }));
    finishOnboarding();
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

  if (!draft.createdPetId) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const waitingForSync = !serverSynced && !syncTimedOut;

  if (waitingForSync || (serverSynced && isPaidOrTrial(entitlementSource))) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <PaywallScreen
      sourceOverride="onboarding"
      headlineOverride={headline}
      onboardingDraft={draft}
      onDismiss={handleDismiss}
    />
  );
};

export default OnboardingPaywallHost;
