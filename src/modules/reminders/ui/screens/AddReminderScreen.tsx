import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePostHog } from 'posthog-react-native';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { NotificationsStackParamList } from '../../../../app/navigation/types';
import { useAppTabBarInset } from '../../../../app/navigation/layout';
import { AppText } from '../../../../shared/components/AppText';
import { DatePickerField } from '../../../../shared/components/DatePickerField';
import { TimePickerField } from '../../../../shared/components/TimePickerField';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme, type Theme } from '../../../../shared/hooks/useTheme';
import { useReminderStore } from '../../store/reminderStore';
import { usePetStore } from '../../../pets/store/petStore';
import { resolvePetAvatarSource } from '../../../../shared/utils/petDisplayPhoto';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function isoDateFromLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

const createStyles = ({
  colors,
  spacing,
  radius,
}: Pick<Theme, 'colors' | 'spacing' | 'radius'>) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.backgroundAlt },
    scrollContent: {},
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
    },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: radius.round,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fieldLabel: {
      marginBottom: spacing.xs,
    },
    input: {
      minHeight: 48,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      fontSize: 16,
      color: colors.text.heading,
    },
    inputMultiline: {
      minHeight: 88,
      paddingTop: spacing.md,
      textAlignVertical: 'top',
    },
    scheduleCard: {
      marginTop: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.md,
    },
    scheduleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    scheduleIconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.round,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.brandTint10,
    },
    petRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    petChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
    },
    petChipSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.brandTint10,
    },
    petAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
    },
    hint: {
      marginTop: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceAlt,
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'flex-start',
    },
    error: {
      marginTop: spacing.md,
      color: colors.danger,
    },
    primaryBtn: {
      marginTop: spacing.xl,
      height: 52,
      borderRadius: radius.md,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

/** MVP: one short screen — title, optional note, date/time, pet. No types grid or repeat UI. */
export const AddReminderScreen: React.FC = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<NotificationsStackParamList, 'AddReminder'>
    >();
  const posthog = usePostHog();
  const theme = useTheme();
  const { colors, spacing, textStyles, fontFamilies, radius } = theme;
  const tabBarInset = useAppTabBarInset();
  const createReminderEntry = useReminderStore(s => s.createReminderEntry);
  const loading = useReminderStore(s => s.loading);
  const pets = usePetStore(s => s.pets);
  const activePet = usePetStore(s => s.activePet);
  const loadPets = usePetStore(s => s.loadPets);

  const styles = useMemo(
    () => createStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(() => isoDateFromLocal(new Date()));
  const [time, setTime] = useState('09:00');
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadPets();
  }, [loadPets]);

  useEffect(() => {
    if (pets.length === 1) {
      if (selectedPetId !== pets[0].id) {
        setSelectedPetId(pets[0].id);
      }
      return;
    }
    if (!selectedPetId && activePet) {
      setSelectedPetId(activePet.id);
    }
  }, [activePet, pets, selectedPetId]);

  const handleSave = useCallback(async () => {
    setError(null);
    const petId = selectedPetId ?? activePet?.id ?? '';
    const result = await createReminderEntry({
      petId,
      title,
      type: 'other',
      date,
      time,
      repeatEnabled: false,
      notes: notes.trim() ? notes : undefined,
    });
    if (!result.success) {
      setError(result.error ?? 'Unable to save reminder.');
      return;
    }
    posthog.capture('reminder_created', { has_notes: Boolean(notes.trim()) });
    navigation.navigate('ReminderList');
  }, [
    activePet?.id,
    createReminderEntry,
    date,
    navigation,
    notes,
    posthog,
    selectedPetId,
    time,
    title,
  ]);

  const hasPets = pets.length > 0;
  const singlePet = pets.length === 1 ? pets[0] : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: tabBarInset + spacing.lg,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcon
              name="arrow_back"
              size={22}
              color={colors.text.heading}
            />
          </Pressable>
          <View style={{ flex: 1 }}>
            <AppText style={[textStyles.title, { color: colors.text.heading }]}>
              Quick reminder
            </AppText>
            <AppText
              style={[
                textStyles.caption,
                { color: colors.text.secondary, marginTop: 4 },
              ]}
            >
              Add something we don&apos;t track automatically — one tap, done.
            </AppText>
          </View>
        </View>

        {!hasPets ? (
          <AppText
            style={[textStyles.body, { color: colors.text.secondary, marginTop: spacing.lg }]}
          >
            Add a pet profile first, then you can set reminders for them.
          </AppText>
        ) : (
          <>
            <View style={{ marginTop: spacing.xl }}>
              <AppText
                style={[
                  textStyles.footer,
                  styles.fieldLabel,
                  { color: colors.text.body, fontFamily: fontFamilies.semibold },
                ]}
              >
                What to remember
              </AppText>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Nail trim, groomer, medication refill"
                placeholderTextColor={colors.input.placeholder}
                style={[styles.input, { fontFamily: fontFamilies.regular }]}
                accessibilityLabel="Reminder title"
              />
            </View>

            <View style={{ marginTop: spacing.md }}>
              <AppText
                style={[
                  textStyles.footer,
                  styles.fieldLabel,
                  { color: colors.text.body, fontFamily: fontFamilies.semibold },
                ]}
              >
                Notes (optional)
              </AppText>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Anything helpful for later"
                placeholderTextColor={colors.input.placeholder}
                style={[
                  styles.input,
                  styles.inputMultiline,
                  { fontFamily: fontFamilies.regular },
                ]}
                multiline
                accessibilityLabel="Optional notes"
              />
            </View>

            <View style={styles.scheduleCard}>
              <View style={styles.scheduleHeader}>
                <View style={styles.scheduleIconWrap}>
                  <MaterialIcon name="event" size={18} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText
                    style={[
                      textStyles.body,
                      { color: colors.text.heading, fontFamily: fontFamilies.bold },
                    ]}
                  >
                    When
                  </AppText>
                  <AppText
                    style={[
                      textStyles.caption,
                      { color: colors.text.secondary, marginTop: 2 },
                    ]}
                  >
                    Pick the day and time for this reminder.
                  </AppText>
                </View>
              </View>

              <View>
                <AppText
                  style={[
                    textStyles.footer,
                    styles.fieldLabel,
                    { color: colors.text.body, fontFamily: fontFamilies.semibold },
                  ]}
                >
                  Date
                </AppText>
                <DatePickerField value={date} onChange={setDate} />
              </View>

              <View>
                <AppText
                  style={[
                    textStyles.footer,
                    styles.fieldLabel,
                    { color: colors.text.body, fontFamily: fontFamilies.semibold },
                  ]}
                >
                  Time
                </AppText>
                <TimePickerField value={time} onChange={setTime} />
              </View>
            </View>

            <View style={{ marginTop: spacing.lg }}>
              <AppText
                style={[
                  textStyles.footer,
                  styles.fieldLabel,
                  { color: colors.text.body, fontFamily: fontFamilies.semibold },
                ]}
              >
                Pet
              </AppText>
              {singlePet ? (
                <AppText
                  style={[textStyles.body, { color: colors.text.secondary }]}
                >
                  For{' '}
                  <AppText
                    style={{ color: colors.accent, fontFamily: fontFamilies.semibold }}
                  >
                    {singlePet.name}
                  </AppText>
                </AppText>
              ) : (
                <View style={styles.petRow}>
                  {pets.map(pet => {
                    const selected = pet.id === selectedPetId;
                    return (
                      <Pressable
                        key={pet.id}
                        onPress={() => setSelectedPetId(pet.id)}
                        style={[
                          styles.petChip,
                          selected ? styles.petChipSelected : undefined,
                        ]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                      >
                        <Image
                          source={resolvePetAvatarSource(pet)}
                          style={styles.petAvatar}
                        />
                        <AppText
                          style={[
                            textStyles.footer,
                            {
                              color: selected ? colors.accent : colors.text.heading,
                              fontFamily: fontFamilies.semibold,
                            },
                          ]}
                        >
                          {pet.name}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.hint}>
              <MaterialIcon name="notifications" size={18} color={colors.text.subdued} />
              <AppText
                style={[textStyles.caption, { color: colors.text.secondary, flex: 1 }]}
              >
                We&apos;ll notify you the day before, an hour before, and at the
                scheduled time.
              </AppText>
            </View>

            {error ? (
              <AppText style={[textStyles.caption, styles.error]}>{error}</AppText>
            ) : null}

            <Pressable
              style={[styles.primaryBtn, !hasPets || loading ? { opacity: 0.5 } : undefined]}
              onPress={handleSave}
              disabled={!hasPets || loading}
              accessibilityRole="button"
              accessibilityLabel="Save reminder"
            >
              <AppText
                style={[
                  textStyles.body,
                  {
                    color: colors.text.inverse,
                    fontFamily: fontFamilies.bold,
                  },
                ]}
              >
                Save reminder
              </AppText>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddReminderScreen;
