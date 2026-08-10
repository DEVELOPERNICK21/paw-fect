import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import type { PetsStackParamList, PetProfileRootNavigation } from '../../../../app/navigation/types';
import { useAppTabBarInset } from '../../../../app/navigation/layout';
import { AppText } from '../../../../shared/components/AppText';
import { Button } from '../../../../shared/components/Button';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { TimePickerField } from '../../../../shared/components/TimePickerField';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { usePetStore } from '../../../pets/store/petStore';
import { DEFAULT_PET_SCHEDULE_PREFERENCES } from '../../domain/DailyScheduleEngine';
import type { PetCoatType, PetEnergyLevel, PetSchedulePreferences } from '../../domain/models/PetProfile';
import { useScheduleStore } from '../../store/scheduleStore';

type SetupRoute = RouteProp<PetsStackParamList, 'ScheduleSetup'>;

export const ScheduleSetupScreen: React.FC = () => {
  const navigation = useNavigation<PetProfileRootNavigation>();
  const route = useRoute<SetupRoute>();
  const tabBarInset = useAppTabBarInset();
  const { colors, spacing, radius, textStyles, fontFamilies } = useTheme();
  const pets = usePetStore(state => state.pets);
  const loadPreferences = useScheduleStore(state => state.loadPreferences);
  const savePreferences = useScheduleStore(state => state.savePreferences);
  const pet = pets.find(item => item.id === route.params.petId);
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<PetSchedulePreferences>(
    DEFAULT_PET_SCHEDULE_PREFERENCES,
  );
  const [worksAway, setWorksAway] = useState<'yes' | 'no' | 'sometimes'>('no');
  const [coatType, setCoatType] = useState<PetCoatType>('short');
  const [energyLevel, setEnergyLevel] = useState<PetEnergyLevel>('medium');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    void loadPreferences(route.params.petId).then(() => {
      const stored = useScheduleStore.getState().preferences;
      if (stored) {
        setPrefs(stored);
        setWorksAway(stored.ownerWorkHours ? 'yes' : 'no');
      }
    });
  }, [loadPreferences, route.params.petId]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.backgroundAlt },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          gap: spacing.sm,
        },
        content: {
          padding: spacing.lg,
          gap: spacing.lg,
        },
        card: {
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surface,
          padding: spacing.lg,
          gap: spacing.md,
        },
        choiceRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
        },
        choice: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        },
        choiceSelected: {
          borderColor: colors.primary,
          backgroundColor: colors.brandTint10,
        },
      }),
    [colors, radius, spacing],
  );

  const handleFinish = useCallback(async () => {
    const next: PetSchedulePreferences = {
      ...prefs,
      ownerWorkHours:
        worksAway === 'yes'
          ? prefs.ownerWorkHours ?? { start: '09:00', end: '18:00' }
          : worksAway === 'sometimes'
            ? prefs.ownerWorkHours ?? { start: '10:00', end: '16:00' }
            : null,
    };
    setSaveError(null);
    setSaving(true);
    try {
      await savePreferences(route.params.petId, next);
      navigation.getParent()?.navigate('NotificationsTab', {
        screen: 'WellnessHub',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to save schedule preferences.';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }, [navigation, prefs, route.params.petId, savePreferences, worksAway]);

  if (!pet) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <MaterialIcon name="arrow_back" size={22} color={colors.text.heading} />
        </Pressable>
        <AppText
          style={[
            textStyles.title,
            { color: colors.text.heading, fontFamily: fontFamilies.bold, flex: 1 },
          ]}
        >
          Daily schedule setup
        </AppText>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarInset }]}>
        {step === 0 ? (
          <View style={styles.card}>
            <AppText style={[textStyles.body, { color: colors.text.heading }]}>
              Your routine
            </AppText>
            <TimePickerField
              value={prefs.ownerWakeTime}
              onChange={value => setPrefs(current => ({ ...current, ownerWakeTime: value }))}
            />
            <TimePickerField
              value={prefs.ownerSleepTime}
              onChange={value => setPrefs(current => ({ ...current, ownerSleepTime: value }))}
            />
            <View style={styles.choiceRow}>
              {(['yes', 'no', 'sometimes'] as const).map(option => (
                <Pressable
                  key={option}
                  onPress={() => setWorksAway(option)}
                  style={[styles.choice, worksAway === option ? styles.choiceSelected : null]}
                >
                  <AppText>{option}</AppText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.card}>
            <AppText style={[textStyles.body, { color: colors.text.heading }]}>
              Feeding for {pet.name}
            </AppText>
            <View style={styles.choiceRow}>
              {(['dry', 'wet', 'mixed'] as const).map(option => (
                <Pressable
                  key={option}
                  onPress={() => setPrefs(current => ({ ...current, feedingType: option }))}
                  style={[
                    styles.choice,
                    prefs.feedingType === option ? styles.choiceSelected : null,
                  ]}
                >
                  <AppText>{option}</AppText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {step === 2 && pet.type === 'dog' ? (
          <View style={styles.card}>
            <AppText style={[textStyles.body, { color: colors.text.heading }]}>
              Activity for {pet.name}
            </AppText>
            <View style={styles.choiceRow}>
              {(['low', 'medium', 'high'] as const).map(option => (
                <Pressable
                  key={option}
                  onPress={() => setEnergyLevel(option)}
                  style={[styles.choice, energyLevel === option ? styles.choiceSelected : null]}
                >
                  <AppText>{option}</AppText>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() =>
                setPrefs(current => ({ ...current, hasDogWalker: !current.hasDogWalker }))
              }
              style={styles.choice}
            >
              <AppText>
                Dog walker midday: {prefs.hasDogWalker ? 'Yes' : 'No'}
              </AppText>
            </Pressable>
          </View>
        ) : null}

        {step === (pet.type === 'dog' ? 3 : 2) ? (
          <View style={styles.card}>
            <AppText style={[textStyles.body, { color: colors.text.heading }]}>
              Coat type
            </AppText>
            <View style={styles.choiceRow}>
              {(['short', 'medium', 'long', 'double'] as const).map(option => (
                <Pressable
                  key={option}
                  onPress={() => setCoatType(option)}
                  style={[styles.choice, coatType === option ? styles.choiceSelected : null]}
                >
                  <AppText>{option}</AppText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {saveError ? (
          <AppText style={[textStyles.caption, { color: colors.danger }]}>
            {saveError}
          </AppText>
        ) : null}

        {step < (pet.type === 'dog' ? 3 : 2) ? (
          <Button
            title="Continue"
            disabled={saving}
            onPress={() => setStep(current => current + 1)}
          />
        ) : (
          <Button
            title="Looks good"
            loading={saving}
            disabled={saving}
            onPress={() => void handleFinish()}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ScheduleSetupScreen;
