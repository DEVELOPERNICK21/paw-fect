import React, { useCallback, useMemo, useState } from 'react';
import {
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
import { useTheme } from '../../../../shared/hooks/useTheme';
import { useSettingsStore } from '../../../settings/store/settingsStore';

const ORANGE = '#EE8C2B';

const STEP_1_HERO =
  'https://www.figma.com/api/mcp/asset/ed27eaf5-f3e7-4e93-8868-78c0effb6947';
const STEP_2_CARD_1 =
  'https://www.figma.com/api/mcp/asset/e90d10b1-625c-4fdc-bba5-60de0b6ae438';
const STEP_2_CARD_2 =
  'https://www.figma.com/api/mcp/asset/b9881c0b-3e79-4f82-a40e-5fb136578461';
const STEP_3_PET_1 =
  'https://www.figma.com/api/mcp/asset/77395db3-bb0d-4ea2-a3eb-5ca9a2bcc87b';
const STEP_3_PET_2 =
  'https://www.figma.com/api/mcp/asset/0f0303b4-7047-49c4-a95e-bfe7f36953c9';

export const OnboardingScreen: React.FC = () => {
  const { fontFamilies, colors, isDarkMode } = useTheme();
  const { settings, updateSettings } = useSettingsStore();
  const [step, setStep] = useState(0);
  const { height } = useWindowDimensions();
  const compact = height < 820;
  const scale = Math.max(0.82, Math.min(1, height / 900));
  const sv = (value: number) => Math.round(value * scale * 0.92);

  const completeOnboarding = useCallback(() => {
    const current = settings ?? {
      notificationsEnabled: true,
      emailUpdates: true,
      onboardingCompleted: false,
      themeMode: 'system' as const,
    };
    updateSettings({
      ...current,
      onboardingCompleted: true,
    });
  }, [settings, updateSettings]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const handlePrimaryAction = useCallback(() => {
    if (step < 2) {
      setStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  }, [completeOnboarding, step]);

  const stepLabel = useMemo(() => `Step ${step + 1} of 3`, [step]);

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
            Pawfect
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
                  {step === 1 ? 'Onboarding' : 'Onboarding Progress'}
                </Text>
                <Text
                  style={[
                    styles.progressCount,
                    { fontFamily: fontFamilies.bold },
                  ]}
                >
                  {step === 1 ? '2 OF 3' : stepLabel}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    step === 1
                      ? styles.progressFillTwoThirds
                      : styles.progressFillFull,
                  ]}
                />
              </View>
            </View>
          ) : null}

          {step === 0 ? (
            <>
              <View style={styles.heroSection}>
                <Image
                  source={{ uri: STEP_1_HERO }}
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
                {['Activity', 'Nutrition', 'Vitals'].map(label => (
                  <View key={label} style={styles.step1FeatureItem}>
                    <View
                      style={[styles.step1FeatureThumb, { height: sv(72) }]}
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
                  </View>
                ))}
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
                <View style={styles.reminderCard}>
                  <Image
                    source={{ uri: STEP_2_CARD_1 }}
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
                </View>
                <View style={styles.reminderCard}>
                  <Image
                    source={{ uri: STEP_2_CARD_2 }}
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
                </View>
              </View>

              <View style={[styles.featureList, { marginTop: sv(4) }]}>
                <View style={styles.featureListItem}>
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
                </View>

                <View style={styles.featureListItem}>
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
                </View>
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
                <View
                  style={[
                    styles.petCard,
                    { height: sv(150), marginBottom: sv(10), padding: sv(12) },
                  ]}
                >
                  <Image
                    source={{ uri: STEP_3_PET_1 }}
                    style={styles.petImage}
                  />
                  <View style={styles.petOverlay} />
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

                <View
                  style={[
                    styles.petCard,
                    { height: sv(150), marginBottom: sv(10), padding: sv(12) },
                  ]}
                >
                  <Image
                    source={{ uri: STEP_3_PET_2 }}
                    style={styles.petImage}
                  />
                  <View style={styles.petOverlay} />
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

                <View
                  style={[
                    styles.addPetCard,
                    { height: sv(150), marginBottom: sv(10) },
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
                </View>

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
                    Pawfect Premium Included
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
        </ScrollView>

        <View style={[styles.actions, { paddingTop: sv(10) }]}>
          <Pressable
            onPress={handlePrimaryAction}
            style={[styles.primaryButton, { backgroundColor: colors.accent }]}
          >
            <Text
              style={[
                styles.primaryButtonText,
                { fontFamily: fontFamilies.bold },
              ]}
            >
              {step === 0
                ? 'Get Started →'
                : step === 1
                ? 'Next →'
                : 'Continue to Dashboard →'}
            </Text>
          </Pressable>

          {step === 0 ? (
            <View style={styles.dotsRow}>
              {[0, 1, 2].map(index => (
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

const styles = StyleSheet.create({
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
    color: '#0F172A',
  },
  navTitle: {
    fontSize: 18,
    lineHeight: 22,
    color: '#0F172A',
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
    color: '#0F172A',
  },
  progressCount: {
    fontSize: 13,
    lineHeight: 19,
    color: ORANGE,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(238, 140, 43, 0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ORANGE,
    borderRadius: 999,
  },
  progressFillTwoThirds: {
    width: '66.6%',
  },
  progressFillFull: {
    width: '100%',
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
    color: '#0F172A',
    letterSpacing: -0.9,
    textAlign: 'center',
  },
  step1TitleAccent: {
    color: ORANGE,
  },
  stepDescription: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 24,
    color: '#475569',
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
    backgroundColor: 'rgba(238, 140, 43, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(238, 140, 43, 0.25)',
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
    color: '#0F172A',
  },
  step2Title: {
    fontSize: 28,
    lineHeight: 34,
    color: '#0F172A',
    letterSpacing: -0.75,
    textAlign: 'center',
  },
  step2Description: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
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
    borderWidth: 1,
    borderColor: 'rgba(238, 140, 43, 0.1)',
    backgroundColor: '#FFFFFF',
    padding: 13,
  },
  reminderImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    marginBottom: 12,
  },
  reminderTitle: {
    fontSize: 16,
    lineHeight: 20,
    color: '#0F172A',
  },
  reminderTag: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: ORANGE,
  },
  reminderMeta: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    color: '#64748B',
  },
  featureList: {
    marginTop: 4,
    paddingHorizontal: 16,
  },
  featureListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(238, 140, 43, 0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(238, 140, 43, 0.05)',
    padding: 12,
    marginBottom: 8,
  },
  featureListIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(238, 140, 43, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureListIconText: {
    fontSize: 16,
    color: ORANGE,
  },
  featureListTextWrap: {
    flex: 1,
  },
  featureListTitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#0F172A',
  },
  featureListSubtitle: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },
  step3Title: {
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.8,
    textAlign: 'center',
    color: '#0F172A',
  },
  step3Description: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
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
    height: 171,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'flex-end',
    padding: 16,
  },
  petImage: {
    ...StyleSheet.absoluteFillObject,
  },
  petOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  petName: {
    fontSize: 16,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  petBreed: {
    marginTop: 1,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.85)',
  },
  addPetCard: {
    width: '48%',
    height: 171,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(238, 140, 43, 0.4)',
    backgroundColor: 'rgba(238, 140, 43, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  addPetCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPetPlus: {
    fontSize: 24,
    color: '#FFFFFF',
    marginTop: -2,
  },
  addPetLabel: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 24,
    color: ORANGE,
  },
  emptySlotCard: {
    width: '48%',
    height: 171,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    opacity: 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptySlotPaw: {
    fontSize: 24,
    color: '#94A3B8',
  },
  emptySlotLabel: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#94A3B8',
  },
  premiumCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(238, 140, 43, 0.1)',
    backgroundColor: '#FFFFFF',
    padding: 17,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  premiumIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: 'rgba(238, 140, 43, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  premiumIconText: {
    color: ORANGE,
    fontSize: 16,
  },
  premiumTextWrap: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#0F172A',
  },
  premiumSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: '#64748B',
  },
  actions: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  primaryButton: {
    backgroundColor: ORANGE,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
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
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 32,
    backgroundColor: ORANGE,
  },
  skipText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
  },
});

export default OnboardingScreen;
