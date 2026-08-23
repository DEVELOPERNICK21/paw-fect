import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { trackEvent } from '../../../../infrastructure/analytics/analytics';
import { requestNotificationPermission } from '../../../../infrastructure/notifications/notificationChannels';
import { AppText } from '../../../../shared/components/AppText';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { lineHeights } from '../../../../shared/theme/typography';
import { useAuthStore } from '../../../auth/store/authStore';
import {
  ACTIVATION_STEP_COUNT,
  type PetDraft,
} from '../../domain/onboarding/OnboardingDraft';
import {
  isFirstReminderStepValid,
  isPetBasicsStepValid,
} from '../../domain/onboarding/activationStepValidation';
import {
  setPetDraft,
  setReminderDraft,
} from '../../domain/onboarding/onboardingDraftReducers';
import { useOnboardingDraftStore } from '../../store/onboardingDraftStore';
import { FirstReminderStep } from './steps/FirstReminderStep';
import { PetBasicsStep } from './steps/PetBasicsStep';

const DEFAULT_PET_DRAFT: PetDraft = {
  species: 'dog',
  ageBand: 'adult',
  nickname: '',
};

const ACTIVATION_STEP = {
  petBasics: 0,
  firstReminder: 1,
} as const;

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
    },
    topNav: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: radius.round,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButtonPlaceholder: {
      width: 44,
      height: 44,
    },
    backGlyph: {
      fontSize: fontSizes.lg,
      color: colors.text.heading,
      marginTop: -1,
    },
    progressSection: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    stepLabel: {
      marginBottom: spacing.sm,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    progressTrack: {
      height: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.brandTint10,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: radius.pill,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: spacing.xl,
    },
    actions: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    primaryButton: {
      backgroundColor: colors.accent,
      borderRadius: radius.xl,
      paddingVertical: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 56,
    },
    primaryButtonDisabled: {
      opacity: 0.4,
    },
    primaryButtonText: {
      fontSize: fontSizes.base,
      lineHeight: lineHeights.base,
      color: colors.text.inverse,
    },
  });

export const OnboardingActivationScreen: React.FC = () => {
  const { colors, fontFamilies, fontSizes, spacing, radius, isDarkMode } =
    useTheme();
  const styles = useMemo(
    () => createStyles({ colors, spacing, radius, fontSizes }),
    [colors, spacing, radius, fontSizes],
  );

  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const draft = useOnboardingDraftStore(state => state.draft);
  const update = useOnboardingDraftStore(state => state.update);
  const goNext = useOnboardingDraftStore(state => state.goNext);
  const goBack = useOnboardingDraftStore(state => state.goBack);
  const setPhase = useOnboardingDraftStore(state => state.setPhase);

  const step = draft.step;
  const petDraft = draft.petDraft ?? DEFAULT_PET_DRAFT;
  const reminderDraft = draft.reminderDraft;

  useEffect(() => {
    void trackEvent('onboarding_activation_step_viewed', {
      step: step + 1,
      total_steps: ACTIVATION_STEP_COUNT,
    });
  }, [step]);

  const handlePetDraftChange = useCallback(
    (next: PetDraft) => {
      update(current => setPetDraft(current, next));
    },
    [update],
  );

  const handleReminderDraftChange = useCallback(
    (next: NonNullable<typeof reminderDraft>) => {
      update(current => setReminderDraft(current, next));
    },
    [update],
  );

  const isStepValid = useMemo(() => {
    if (step === ACTIVATION_STEP.petBasics) {
      return isPetBasicsStepValid(petDraft);
    }
    if (step === ACTIVATION_STEP.firstReminder) {
      return isFirstReminderStepValid(reminderDraft);
    }
    return false;
  }, [step, petDraft, reminderDraft]);

  const handleContinue = useCallback(() => {
    if (step === ACTIVATION_STEP.petBasics) {
      goNext();
      return;
    }

    void requestNotificationPermission();
    if (isAuthenticated) {
      setPhase('persist');
    }
  }, [step, goNext, isAuthenticated, setPhase]);

  const handleBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const primaryLabel =
    step === ACTIVATION_STEP.firstReminder ? 'Save & continue' : 'Continue';

  const progressPercent = ((step + 1) / ACTIVATION_STEP_COUNT) * 100;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.backgroundAlt}
      />
      <View style={styles.container}>
        <View style={styles.topNav}>
          {step > 0 ? (
            <Pressable
              onPress={handleBack}
              style={styles.backButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={styles.backGlyph}>‹</Text>
            </Pressable>
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}
        </View>

        <View style={styles.progressSection}>
          <AppText style={styles.stepLabel}>
            Step {step + 1} of {ACTIVATION_STEP_COUNT}
          </AppText>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${progressPercent}%` }]}
            />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View key={step}>
            {step === ACTIVATION_STEP.petBasics ? (
              <PetBasicsStep
                value={petDraft}
                onChange={handlePetDraftChange}
              />
            ) : null}
            {step === ACTIVATION_STEP.firstReminder ? (
              <FirstReminderStep
                nickname={petDraft.nickname}
                value={reminderDraft}
                onChange={handleReminderDraftChange}
              />
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <Pressable
            onPress={handleContinue}
            disabled={!isStepValid}
            style={[
              styles.primaryButton,
              !isStepValid ? styles.primaryButtonDisabled : null,
            ]}
          >
            <Text
              style={[
                styles.primaryButtonText,
                { fontFamily: fontFamilies.bold },
              ]}
            >
              {primaryLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingActivationScreen;
