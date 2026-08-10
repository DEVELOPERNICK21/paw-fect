import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { trackEvent } from '../../../../infrastructure/analytics/analytics';
import { images } from '../../../../shared/assets/images';
import { useTheme } from '../../../../shared/hooks/useTheme';
import type { CareInterest } from '../../../settings/domain/models/Settings';
import { useSettingsStore } from '../../../settings/store/settingsStore';
import { OnboardingCareInterestsStep } from '../components/OnboardingCareInterestsStep';
import { toggleCareInterest } from '../onboarding/careInterestUtils';

const TOTAL_STEPS = 4;

type HealthChip = 'Activity' | 'Nutrition' | 'Vitals';
type ReminderDemo = 'vaccination' | 'grooming' | 'walks' | 'meds' | null;
type PetDemo = 'luna' | 'milo' | 'add' | null;

export const OnboardingScreen: React.FC = () => {
  const { fontFamilies, colors, isDarkMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { settings, updateSettings } = useSettingsStore();
  const [step, setStep] = useState(0);
  const [selectedHealthChip, setSelectedHealthChip] =
    useState<HealthChip | null>(null);
  const [selectedReminder, setSelectedReminder] = useState<ReminderDemo>(null);
  const [selectedPetDemo, setSelectedPetDemo] = useState<PetDemo>(null);
  const [careInterests, setCareInterests] = useState<CareInterest[]>([]);
  const fade = useRef(new Animated.Value(1)).current;
  const { height } = useWindowDimensions();
  const compact = height < 820;
  const scale = Math.max(0.82, Math.min(1, height / 900));
  const sv = (value: number) => Math.round(value * scale * 0.92);

  useEffect(() => {
    void trackEvent('onboarding_step_viewed', {
      step: step + 1,
      total_steps: TOTAL_STEPS,
    });
  }, [step]);

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [fade, step]);

  const completeOnboarding = useCallback(
    (skipped = false) => {
      void trackEvent('onboarding_completed', {
        skipped,
        care_interests: careInterests.join(','),
      });
      const current = settings ?? {
        notificationsEnabled: true,
        emailUpdates: true,
        onboardingCompleted: false,
        themeMode: 'system' as const,
        careInterests: [],
      };
      updateSettings({
        ...current,
        onboardingCompleted: true,
        careInterests,
      });
    },
    [careInterests, settings, updateSettings],
  );

  const handleSkip = useCallback(() => {
    completeOnboarding(true);
  }, [completeOnboarding]);

  const handlePrimaryAction = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      setStep(prev => prev + 1);
      return;
    }
    if (careInterests.length === 0) {
      return;
    }
    completeOnboarding(false);
  }, [careInterests.length, completeOnboarding, step]);

  const primaryDisabled = step === TOTAL_STEPS - 1 && careInterests.length === 0;
  const progressPercent = ((step + 1) / TOTAL_STEPS) * 100;
  const stepLabel = useMemo(
    () => `${step + 1} OF ${TOTAL_STEPS}`,
    [step],
  );
  const primaryLabel =
    step === 0
      ? 'Get Started →'
      : step < TOTAL_STEPS - 1
        ? 'Next →'
        : 'Save & Continue →';

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.backgroundAlt }]}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.backgroundAlt}
      />

      <View style={styles.container}>
        <View style={styles.topNav}>
          <Pressable
            onPress={step === 0 ? handleSkip : () => setStep(prev => prev - 1)}
            style={styles.navIconButton}
            hitSlop={8}
          >
            <Text style={[styles.navIcon, { color: colors.text.heading }]}>
              {step === 0 ? '✕' : '←'}
            </Text>
          </Pressable>

          <Text style={[styles.navTitle, { fontFamily: fontFamilies.bold }]}>
            Pawsoul
          </Text>

          <View style={styles.navIconSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled
          bounces
          alwaysBounceVertical={false}
        >
          {step > 0 ? (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text
                  style={[
                    styles.progressTitle,
                    { fontFamily: fontFamilies.medium },
                  ]}
                >
                  Onboarding Progress
                </Text>
                <Text
                  style={[
                    styles.progressCount,
                    { fontFamily: fontFamilies.bold },
                  ]}
                >
                  {stepLabel}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
              </View>
            </View>
          ) : null}

          <Animated.View style={{ opacity: fade }}>
          {step === 0 ? (            <>
              <View style={styles.heroSection}>
                <Image
                  source={images.petHd1}
                  style={[
                    styles.heroImage,
                    { height: compact ? sv(280) : sv(320) },
                  ]}
                />
              </View>

              <View style={styles.stepHeader}>
                <Text
                  style={[
                    styles.step1Title,
                    {
                      fontFamily: fontFamilies.extrabold,
                      fontSize: sv(34),
                      lineHeight: sv(38),
                    },
                  ]}
                >
                  Health Tracking
                </Text>
                <Text
                  style={[
                    styles.step1Title,
                    styles.step1TitleAccent,
                    {
                      fontFamily: fontFamilies.extrabold,
                      fontSize: sv(34),
                      lineHeight: sv(38),
                    },
                  ]}
                >
                  Made Simple
                </Text>
                <Text
                  style={[
                    styles.stepDescription,
                    {
                      fontFamily: fontFamilies.medium,
                      marginTop: sv(12),
                      fontSize: sv(16),
                      lineHeight: sv(24),
                    },
                  ]}
                >
                  Monitor your pet&apos;s vitals, activity levels, and medical
                  records in one premium dashboard.
                </Text>
              </View>

              <View style={[styles.step1FeaturesRow, { marginTop: sv(22) }]}>
                {(['Activity', 'Nutrition', 'Vitals'] as HealthChip[]).map(
                  label => {
                    const isSelected = selectedHealthChip === label;
                    return (
                      <Pressable
                        key={label}
                        onPress={() => setSelectedHealthChip(label)}
                        style={styles.step1FeatureItem}
                      >
                        <View
                          style={[
                            styles.step1FeatureThumb,
                            { height: sv(72) },
                            isSelected ? styles.selectableSelected : null,
                          ]}
                        >
                          <Text style={styles.step1FeatureEmoji}>
                            {label === 'Activity'
                              ? '🏃'
                              : label === 'Nutrition'
                                ? '🍽️'
                                : '🩺'}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.step1FeatureLabel,
                            { fontFamily: fontFamilies.bold },
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  },
                )}
              </View>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <View style={[styles.stepHeader, { paddingTop: sv(14) }]}>
                <Text
                  style={[
                    styles.step2Title,
                    {
                      fontFamily: fontFamilies.extrabold,
                      fontSize: sv(28),
                      lineHeight: sv(34),
                    },
                  ]}
                >
                  Never miss a moment
                </Text>
                <Text
                  style={[
                    styles.step2Description,
                    {
                      fontFamily: fontFamilies.regular,
                      marginTop: sv(10),
                      fontSize: sv(14),
                      lineHeight: sv(20),
                    },
                  ]}
                >
                  Stay on top of your pet&apos;s health. Schedule vaccinations,
                  grooming sessions, and daily walks effortlessly.
                </Text>
              </View>

              <View style={[styles.remindersRow, { marginTop: sv(12) }]}>
                <Pressable
                  onPress={() => setSelectedReminder('vaccination')}
                  style={[
                    styles.reminderCard,
                    selectedReminder === 'vaccination'
                      ? styles.selectableSelected
                      : null,
                  ]}
                >
                  <Image
                    source={images.petHd2}
                    resizeMode="cover"
                    style={styles.reminderImage}
                  />
                  <Text
                    style={[
                      styles.reminderTitle,
                      { fontFamily: fontFamilies.bold },
                    ]}
                  >
                    Vaccination
                  </Text>
                  <Text
                    style={[
                      styles.reminderTag,
                      { fontFamily: fontFamilies.medium },
                    ]}
                  >
                    ANNUAL BOOSTER
                  </Text>
                  <Text
                    style={[
                      styles.reminderMeta,
                      { fontFamily: fontFamilies.medium },
                    ]}
                  >
                    Tomorrow, 10:00 AM
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelectedReminder('grooming')}
                  style={[
                    styles.reminderCard,
                    selectedReminder === 'grooming'
                      ? styles.selectableSelected
                      : null,
                  ]}
                >
                  <Image
                    source={images.catHd1}
                    resizeMode="cover"
                    style={styles.reminderImage}
                  />
                  <Text
                    style={[
                      styles.reminderTitle,
                      { fontFamily: fontFamilies.bold },
                    ]}
                  >
                    Grooming
                  </Text>
                  <Text
                    style={[
                      styles.reminderTag,
                      { fontFamily: fontFamilies.medium },
                    ]}
                  >
                    FULL SPAW
                  </Text>
                  <Text
                    style={[
                      styles.reminderMeta,
                      { fontFamily: fontFamilies.medium },
                    ]}
                  >
                    Saturday, 2:00 PM
                  </Text>
                </Pressable>
              </View>

              <View style={[styles.featureList, { marginTop: sv(4) }]}>
                <Pressable
                  onPress={() => setSelectedReminder('walks')}
                  style={[
                    styles.featureListItem,
                    selectedReminder === 'walks'
                      ? styles.selectableSelected
                      : null,
                  ]}
                >
                  <View style={styles.featureListIcon}>
                    <Text style={styles.featureListIconText}>◷</Text>
                  </View>
                  <View style={styles.featureListTextWrap}>
                    <Text
                      style={[
                        styles.featureListTitle,
                        { fontFamily: fontFamilies.bold },
                      ]}
                    >
                      Recurring Walks
                    </Text>
                    <Text
                      style={[
                        styles.featureListSubtitle,
                        { fontFamily: fontFamilies.regular },
                      ]}
                    >
                      Automate daily exercise notifications for your pet&apos;s
                      routine.
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setSelectedReminder('meds')}
                  style={[
                    styles.featureListItem,
                    selectedReminder === 'meds'
                      ? styles.selectableSelected
                      : null,
                  ]}
                >
                  <View style={styles.featureListIcon}>
                    <Text style={styles.featureListIconText}>💊</Text>
                  </View>
                  <View style={styles.featureListTextWrap}>
                    <Text
                      style={[
                        styles.featureListTitle,
                        { fontFamily: fontFamilies.bold },
                      ]}
                    >
                      Medication Tracking
                    </Text>
                    <Text
                      style={[
                        styles.featureListSubtitle,
                        { fontFamily: fontFamilies.regular },
                      ]}
                    >
                      Keep track of dosages and schedules with smart alerts.
                    </Text>
                  </View>
                </Pressable>
              </View>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <View style={[styles.stepHeader, { paddingTop: sv(12) }]}>
                <Text
                  style={[
                    styles.step3Title,
                    {
                      fontFamily: fontFamilies.extrabold,
                      fontSize: sv(30),
                      lineHeight: sv(36),
                    },
                  ]}
                >
                  Manage All Your Pets
                </Text>
                <Text
                  style={[
                    styles.step3Description,
                    {
                      fontFamily: fontFamilies.medium,
                      marginTop: sv(10),
                      fontSize: sv(14),
                      lineHeight: sv(20),
                    },
                  ]}
                >
                  Add, switch, and track health records for all your furry
                  friends in one premium dashboard.
                </Text>
              </View>

              <View style={styles.petsGrid}>
                <Pressable
                  onPress={() => setSelectedPetDemo('luna')}
                  style={[
                    styles.petCard,
                    { marginBottom: sv(10) },
                    selectedPetDemo === 'luna'
                      ? styles.selectableSelected
                      : null,
                  ]}
                >
                  <View style={styles.petImageWrap}>
                    <Image
                      source={images.petHd4}
                      resizeMode="contain"
                      style={styles.petImage}
                    />
                  </View>
                  <View style={styles.petLabelWrap}>
                    <Text
                      style={[styles.petName, { fontFamily: fontFamilies.bold }]}
                    >
                      Luna
                    </Text>
                    <Text
                      style={[
                        styles.petBreed,
                        { fontFamily: fontFamilies.regular },
                      ]}
                    >
                      Golden Retriever
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setSelectedPetDemo('milo')}
                  style={[
                    styles.petCard,
                    { marginBottom: sv(10) },
                    selectedPetDemo === 'milo'
                      ? styles.selectableSelected
                      : null,
                  ]}
                >
                  <View style={styles.petImageWrap}>
                    <Image
                      source={images.catHd2}
                      resizeMode="contain"
                      style={styles.petImage}
                    />
                  </View>
                  <View style={styles.petLabelWrap}>
                    <Text
                      style={[styles.petName, { fontFamily: fontFamilies.bold }]}
                    >
                      Milo
                    </Text>
                    <Text
                      style={[
                        styles.petBreed,
                        { fontFamily: fontFamilies.regular },
                      ]}
                    >
                      Tabby Cat
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setSelectedPetDemo('add')}
                  style={[
                    styles.addPetCard,
                    { height: sv(150), marginBottom: sv(10) },
                    selectedPetDemo === 'add'
                      ? styles.selectableSelected
                      : null,
                  ]}
                >
                  <View style={styles.addPetCircle}>
                    <Text style={styles.addPetPlus}>＋</Text>
                  </View>
                  <Text
                    style={[
                      styles.addPetLabel,
                      { fontFamily: fontFamilies.bold },
                    ]}
                  >
                    Add New Pet
                  </Text>
                </Pressable>

                <View
                  style={[
                    styles.emptySlotCard,
                    { height: sv(150), marginBottom: sv(10) },
                  ]}
                >
                  <Text style={styles.emptySlotPaw}>🐾</Text>
                  <Text
                    style={[
                      styles.emptySlotLabel,
                      { fontFamily: fontFamilies.medium },
                    ]}
                  >
                    Empty Slot
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.premiumCard,
                  { padding: sv(12), marginTop: sv(6) },
                ]}
              >
                <View style={styles.premiumIcon}>
                  <Text style={styles.premiumIconText}>✦</Text>
                </View>
                <View style={styles.premiumTextWrap}>
                  <Text
                    style={[
                      styles.premiumTitle,
                      { fontFamily: fontFamilies.bold },
                    ]}
                  >
                    Pawsoul Premium Included
                  </Text>
                  <Text
                    style={[
                      styles.premiumSubtitle,
                      { fontFamily: fontFamilies.regular },
                    ]}
                  >
                    Multi-pet syncing and cloud backup are active for your
                    account.
                  </Text>
                </View>
              </View>
            </>
          ) : null}

          {step === 3 ? (
            <OnboardingCareInterestsStep
              selected={careInterests}
              onToggle={id =>
                setCareInterests(prev => toggleCareInterest(prev, id))
              }
            />
          ) : null}
          </Animated.View>
        </ScrollView>

        <View style={[styles.actions, { paddingTop: sv(10) }]}>
          <Pressable
            onPress={handlePrimaryAction}
            disabled={primaryDisabled}
            style={[
              styles.primaryButton,
              { backgroundColor: colors.accent },
              primaryDisabled ? styles.primaryButtonDisabled : null,
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

          {step === 0 ? (
            <View style={styles.dotsRow}>
              {[0, 1, 2, 3].map(index => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === step
                      ? [styles.dotActive, { backgroundColor: colors.accent }]
                      : { backgroundColor: colors.borderSubtle },
                  ]}
                />
              ))}
            </View>
          ) : (
            <Pressable onPress={handleSkip} hitSlop={8}>
              <Text
                style={[
                  styles.skipText,
                  {
                    fontFamily: fontFamilies.medium,
                    marginTop: sv(10),
                    color: colors.text.secondary,
                  },
                ]}
              >
                Skip for now
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  navIconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 26,
    color: colors.text.heading,
  },
  navTitle: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.text.heading,
    letterSpacing: -0.5,
  },
  navIconSpacer: {
    width: 48,
    height: 48,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  progressSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.text.heading,
  },
  progressCount: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.accent,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.brandTint10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 999,
  },
  selectableSelected: {
    borderColor: colors.accent,
    borderWidth: 2,
    backgroundColor: colors.brandTint5,
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  heroImage: {
    width: '100%',
    height: 320,
    borderRadius: 24,
  },
  stepHeader: {
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingTop: 24,
  },
  step1Title: {
    fontSize: 34,
    lineHeight: 38,
    color: colors.text.heading,
    letterSpacing: -0.9,
    textAlign: 'center',
  },
  step1TitleAccent: {
    color: colors.accent,
  },
  stepDescription: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.body,
    textAlign: 'center',
  },
  step1FeaturesRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 22,
    justifyContent: 'space-between',
  },
  step1FeatureItem: {
    width: '30.5%',
    alignItems: 'center',
  },
  step1FeatureThumb: {
    width: '100%',
    height: 72,
    borderRadius: 16,
    backgroundColor: colors.brandTint12,
    borderWidth: 1,
    borderColor: colors.brandTint20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  step1FeatureEmoji: {
    fontSize: 24,
  },
  step1FeatureLabel: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.heading,
  },
  step2Title: {
    fontSize: 28,
    lineHeight: 34,
    color: colors.text.heading,
    letterSpacing: -0.75,
    textAlign: 'center',
  },
  step2Description: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.body,
    textAlign: 'center',
  },
  remindersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    justifyContent: 'space-between',
  },
  reminderCard: {
    width: '48%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.brandTint10,
    backgroundColor: colors.surface,
    padding: 13,
  },
  reminderImage: {
    width: '100%',
    height: 132,
    borderRadius: 16,
    marginBottom: 12,
  },
  reminderTitle: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.text.heading,
  },
  reminderTag: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: colors.accent,
  },
  reminderMeta: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  featureList: {
    marginTop: 4,
    paddingHorizontal: 16,
  },
  featureListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.brandTint5,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.brandTint5,
    padding: 12,
    marginBottom: 8,
  },
  featureListIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandTint10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureListIconText: {
    fontSize: 16,
    color: colors.accent,
  },
  featureListTextWrap: {
    flex: 1,
  },
  featureListTitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.heading,
  },
  featureListSubtitle: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.body,
  },
  step3Title: {
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.8,
    textAlign: 'center',
    color: colors.text.heading,
  },
  step3Description: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.body,
    textAlign: 'center',
  },
  petsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  petCard: {
    width: '48%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: 16,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  /** Square region matches 1:1 assets so contain fills without side letterboxing. */
  petImageWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  petLabelWrap: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  petName: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.text.heading,
  },
  petBreed: {
    marginTop: 1,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  addPetCard: {
    width: '48%',
    height: 171,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.brandTint20,
    backgroundColor: colors.brandTint5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  addPetCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPetPlus: {
    fontSize: 24,
    color: colors.text.inverse,
    marginTop: -2,
  },
  addPetLabel: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 24,
    color: colors.accent,
  },
  emptySlotCard: {
    width: '48%',
    height: 171,
    borderRadius: 24,
    backgroundColor: colors.surfaceAlt,
    opacity: 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptySlotPaw: {
    fontSize: 24,
    color: colors.text.subdued,
  },
  emptySlotLabel: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.subdued,
  },
  premiumCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.brandTint10,
    backgroundColor: colors.surface,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  premiumIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: colors.brandTint10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  premiumIconText: {
    color: colors.accent,
    fontSize: 16,
  },
  premiumTextWrap: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.heading,
  },
  premiumSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  actions: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 6,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.inverse,
  },
  dotsRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.borderSubtle,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 32,
    backgroundColor: colors.accent,
  },
  skipText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
});

export default OnboardingScreen;
