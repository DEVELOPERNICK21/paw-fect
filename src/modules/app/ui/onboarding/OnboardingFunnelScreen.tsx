import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { trackEvent } from '../../../../infrastructure/analytics/analytics';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { lineHeights } from '../../../../shared/theme/typography';
import { buildCarePlanSummary } from '../../domain/onboarding/buildCarePlanSummary';
import {
  QUIZ_STEP_COUNT,
  type OnboardingGoal,
  type OnboardingProblem,
  type PetDraft,
} from '../../domain/onboarding/OnboardingDraft';
import {
  acceptCommitment,
  setCareInterests,
  setGoal,
  setPetDraft,
  setProblems,
} from '../../domain/onboarding/onboardingDraftReducers';
import { useOnboardingDraftStore } from '../../store/onboardingDraftStore';
import type { CareInterest } from '../../../settings/domain/models/Settings';
import { toggleCareInterest } from './careInterestUtils';
import { CareFocusStep } from './steps/CareFocusStep';
import { CommitmentStep } from './steps/CommitmentStep';
import { GoalStep } from './steps/GoalStep';
import { PetBasicsStep } from './steps/PetBasicsStep';
import { PlanRevealStep } from './steps/PlanRevealStep';
import { ProblemNamingStep } from './steps/ProblemNamingStep';
import { ProcessingStep } from './steps/ProcessingStep';
import { TrustOpenStep } from './steps/TrustOpenStep';

const DEFAULT_PET_DRAFT: PetDraft = {
  species: 'dog',
  ageBand: 'adult',
  nickname: '',
};

const STEP_INDEX = {
  trustOpen: 0,
  problemNaming: 1,
  petBasics: 2,
  goal: 3,
  careFocus: 4,
  processing: 5,
  planReveal: 6,
  commitment: 7,
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
      backgroundColor: colors.text.heading,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButtonPlaceholder: {
      width: 44,
      height: 44,
    },
    backGlyph: {
      fontSize: fontSizes.lg,
      color: colors.text.inverse,
      marginTop: -1,
    },
    progressSection: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
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
      backgroundColor: colors.text.heading,
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

export const OnboardingFunnelScreen: React.FC = () => {
  const { colors, fontFamilies, fontSizes, spacing, radius, isDarkMode } =
    useTheme();
  const styles = useMemo(
    () => createStyles({ colors, spacing, radius, fontSizes }),
    [colors, spacing, radius, fontSizes],
  );

  const draft = useOnboardingDraftStore(state => state.draft);
  const update = useOnboardingDraftStore(state => state.update);
  const goNext = useOnboardingDraftStore(state => state.goNext);
  const goBack = useOnboardingDraftStore(state => state.goBack);
  const setPhase = useOnboardingDraftStore(state => state.setPhase);

  const [commitmentGesture, setCommitmentGesture] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const slideX = useRef(new Animated.Value(0)).current;
  const stepDirectionRef = useRef<1 | -1>(1);
  const previousStepRef = useRef(draft.step);

  const step = draft.step;
  const petDraft = draft.petDraft ?? DEFAULT_PET_DRAFT;
  const summary = useMemo(() => buildCarePlanSummary(draft), [draft]);

  useEffect(() => {
    void trackEvent('onboarding_step_viewed', {
      step: step + 1,
      total_steps: QUIZ_STEP_COUNT,
      phase: draft.phase,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires on STEP change only; `phase` is intentionally excluded to avoid re-firing this event when the commitment step flips phase without changing step.
  }, [step]);

  useEffect(() => {
    if (step === STEP_INDEX.planReveal) {
      void trackEvent('onboarding_plan_revealed', {
        bullets_count: summary.bullets.length,
      });
    }
  }, [step, summary.bullets.length]);

  useEffect(() => {
    const previous = previousStepRef.current;
    stepDirectionRef.current = step >= previous ? 1 : -1;
    previousStepRef.current = step;

    fade.setValue(0);
    slideX.setValue(18 * stepDirectionRef.current);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(slideX, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slideX, step]);

  useEffect(() => {
    if (step !== STEP_INDEX.commitment) {
      setCommitmentGesture(false);
    }
  }, [step]);

  const handleToggleProblem = useCallback(
    (problem: OnboardingProblem) => {
      update(current => {
        const nextProblems = current.problems.includes(problem)
          ? current.problems.filter(item => item !== problem)
          : [...current.problems, problem];
        return setProblems(current, nextProblems);
      });
    },
    [update],
  );

  const handlePetDraftChange = useCallback(
    (next: PetDraft) => {
      update(current => setPetDraft(current, next));
    },
    [update],
  );

  const handleSelectGoal = useCallback(
    (goal: OnboardingGoal) => {
      update(current => setGoal(current, goal));
    },
    [update],
  );

  const handleToggleCareInterest = useCallback(
    (interest: CareInterest) => {
      update(current =>
        setCareInterests(
          current,
          toggleCareInterest(current.careInterests, interest),
        ),
      );
    },
    [update],
  );

  const handleCommitmentToggle = useCallback(() => {
    setCommitmentGesture(prev => !prev);
  }, []);

  const isStepValid = useMemo(() => {
    switch (step) {
      case STEP_INDEX.problemNaming:
        return draft.problems.length > 0;
      case STEP_INDEX.petBasics:
        return petDraft.nickname.trim().length > 0;
      case STEP_INDEX.goal:
        return draft.goal !== null;
      case STEP_INDEX.careFocus:
        return draft.careInterests.length > 0;
      case STEP_INDEX.commitment:
        return commitmentGesture;
      default:
        return true;
    }
  }, [
    step,
    draft.problems,
    petDraft.nickname,
    draft.goal,
    draft.careInterests,
    commitmentGesture,
  ]);

  const handleContinue = useCallback(() => {
    if (step === STEP_INDEX.problemNaming) {
      void trackEvent('onboarding_problem_selected', {
        problems: draft.problems.join(','),
      });
    }

    if (step === STEP_INDEX.commitment) {
      void trackEvent('onboarding_commitment_completed', {
        goal: draft.goal ?? '',
        care_interests: draft.careInterests.join(','),
      });
      update(acceptCommitment);
      setPhase('paywall');
      return;
    }

    goNext();
  }, [
    step,
    draft.problems,
    draft.goal,
    draft.careInterests,
    update,
    setPhase,
    goNext,
  ]);

  const handleBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const primaryLabel = useMemo(() => {
    switch (step) {
      case STEP_INDEX.trustOpen:
        return 'Continue';
      case STEP_INDEX.careFocus:
        return 'Show my plan';
      case STEP_INDEX.commitment:
        return "I'm ready";
      default:
        return 'Next';
    }
  }, [step]);

  const progressPercent = ((step + 1) / QUIZ_STEP_COUNT) * 100;
  const showPrimaryButton = step !== STEP_INDEX.processing;

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
          <Animated.View
            style={{
              opacity: fade,
              transform: [{ translateX: slideX }],
            }}
          >
            {step === STEP_INDEX.trustOpen ? <TrustOpenStep /> : null}
            {step === STEP_INDEX.problemNaming ? (
              <ProblemNamingStep
                selected={draft.problems}
                onToggle={handleToggleProblem}
              />
            ) : null}
            {step === STEP_INDEX.petBasics ? (
              <PetBasicsStep value={petDraft} onChange={handlePetDraftChange} />
            ) : null}
            {step === STEP_INDEX.goal ? (
              <GoalStep selected={draft.goal} onSelect={handleSelectGoal} />
            ) : null}
            {step === STEP_INDEX.careFocus ? (
              <CareFocusStep
                selected={draft.careInterests}
                onToggle={handleToggleCareInterest}
              />
            ) : null}
            {step === STEP_INDEX.processing ? (
              <ProcessingStep
                nickname={petDraft.nickname}
                species={petDraft.species}
                onDone={goNext}
              />
            ) : null}
            {step === STEP_INDEX.planReveal ? (
              <PlanRevealStep summary={summary} />
            ) : null}
            {step === STEP_INDEX.commitment ? (
              <CommitmentStep
                nickname={petDraft.nickname}
                accepted={commitmentGesture}
                onToggle={handleCommitmentToggle}
              />
            ) : null}
          </Animated.View>
        </ScrollView>

        {showPrimaryButton ? (
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
        ) : null}
      </View>
    </SafeAreaView>
  );
};

export default OnboardingFunnelScreen;
