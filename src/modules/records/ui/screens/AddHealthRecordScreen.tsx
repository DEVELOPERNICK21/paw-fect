import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { trackEvent } from '../../../../infrastructure/analytics/analytics';
import type { HealthStackParamList } from '../../../../app/navigation/types';
import { useAppTabBarInset } from '../../../../app/navigation/layout';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme, type Theme } from '../../../../shared/hooks/useTheme';
import { useRecordStore } from '../../store/recordStore';
import { useSmartHealthRecordStore } from '../../store/smartHealthRecordStore';
import { usePetStore } from '../../../pets/store/petStore';
import { DatePickerField } from '../../../../shared/components/DatePickerField';
import { Input } from '../../../../shared/components/Input';

type CategoryOption = 'Vaccination' | 'Deworming' | 'Checkup' | 'Other';

const CATEGORY_MAP: Record<CategoryOption, string> = {
  Vaccination: 'Vaccination',
  Deworming: 'Deworming',
  Checkup: 'Checkup',
  Other: 'Other',
};

const OPTIONS: CategoryOption[] = [
  'Vaccination',
  'Deworming',
  'Checkup',
  'Other',
];

const CATEGORY_ICONS: Record<
  CategoryOption,
  'vaccines' | 'healing' | 'stethoscope' | 'pill'
> = {
  Vaccination: 'vaccines',
  Deworming: 'healing',
  Checkup: 'stethoscope',
  Other: 'pill',
};

export const AddHealthRecordScreen: React.FC = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<HealthStackParamList, 'AddHealthRecord'>
    >();
  const tabBarInset = useAppTabBarInset();
  const { fontFamilies, colors } = useTheme();
  const { createRecordEntry } = useRecordStore();
  const { activePet } = usePetStore();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [category, setCategory] = useState<CategoryOption>('Vaccination');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const styles = useMemo(() => createStyles({ colors }), [colors]);

  const handleSave = async () => {
    setError(null);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    if (!activePet) {
      setError('No pet selected.');
      return;
    }

    const result = await createRecordEntry({
      petId: activePet.id,
      title: title.trim(),
      category: CATEGORY_MAP[category],
      date,
      notes,
    });

    if (!result.success) {
      setError(result.error ?? 'Unable to save health record.');
      return;
    }
    void trackEvent('health_record_added', { category, has_notes: Boolean(notes.trim()) });
    if (activePet) {
      await useSmartHealthRecordStore.getState().loadPetRecords(activePet.id);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.backgroundAlt }]}
    >
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcon name="arrow_back" size={20} color={colors.text.body} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: fontFamilies.bold }]}>
          Add Health Record
        </Text>
        <View style={styles.rightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text
            style={[styles.heroTitle, { fontFamily: fontFamilies.extrabold }]}
          >
            Record Details
          </Text>
          <Text
            style={[styles.heroSubtitle, { fontFamily: fontFamilies.medium }]}
          >
            Keep track of your pet&apos;s medical history
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { fontFamily: fontFamilies.semibold }]}>
            Record Title
          </Text>
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder={getPlaceholderForCategory(category)}
            placeholderTextColor={colors.input.placeholder}
          />

          <Text
            style={[
              styles.label,
              styles.blockTop,
              { fontFamily: fontFamilies.semibold },
            ]}
          >
            Date of Record
          </Text>
          <DatePickerField value={date} onChange={setDate} />

          <Text
            style={[
              styles.label,
              styles.blockTop,
              { fontFamily: fontFamilies.semibold },
            ]}
          >
            Category
          </Text>
          <View style={styles.categoryGrid}>
            {OPTIONS.map(option => {
              const selected = category === option;
              return (
                <Pressable
                  key={option}
                  style={[
                    styles.categoryCard,
                    selected && styles.categoryCardSelected,
                  ]}
                  onPress={() => setCategory(option)}
                >
                  <View
                    style={[
                      styles.categoryIconWrapper,
                      {
                        backgroundColor: selected
                          ? 'rgba(238, 140, 43, 0.1)'
                          : colors.surface,
                      },
                    ]}
                  >
                    <MaterialIcon
                      name={CATEGORY_ICONS[option]}
                      size={24}
                      color={selected ? colors.accent : colors.text.subdued}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryLabel,
                      {
                        fontFamily: selected
                          ? fontFamilies.bold
                          : fontFamilies.medium,
                      },
                      { color: selected ? colors.accent : colors.text.body },
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text
            style={[
              styles.label,
              styles.blockTop,
              { fontFamily: fontFamilies.semibold },
            ]}
          >
            Notes
          </Text>
          <View style={styles.textAreaWrapper}>
            <Input
              value={notes}
              onChangeText={setNotes}
              placeholder="Add details about the visit, diagnosis, or instructions..."
              multiline
            />
          </View>

          <Text
            style={[
              styles.label,
              styles.blockTop,
              { fontFamily: fontFamilies.semibold },
            ]}
          >
            Attachments
          </Text>
          <Pressable style={styles.uploadCard}>
            <MaterialIcon
              name="cloud_upload"
              size={24}
              color={colors.text.subdued}
            />
            <Text
              style={[
                styles.uploadPrimary,
                { fontFamily: fontFamilies.medium },
              ]}
            >
              <Text style={{ fontFamily: fontFamilies.bold }}>
                Click to upload
              </Text>{' '}
              or drag and drop
            </Text>
            <Text
              style={[
                styles.uploadSecondary,
                { fontFamily: fontFamilies.regular },
              ]}
            >
              PDF, PNG, JPG (MAX. 5MB)
            </Text>
          </Pressable>
        </View>

        {error ? (
          <Text
            style={[styles.errorText, { fontFamily: fontFamilies.regular }]}
          >
            {error}
          </Text>
        ) : null}

        <View style={[styles.footer, { paddingBottom: tabBarInset + 12 }]}>
          <Pressable
            style={[styles.saveBtn, { backgroundColor: colors.accent }]}
            onPress={handleSave}
          >
            <Text style={[styles.saveText, { fontFamily: fontFamilies.bold }]}>
              Save Record
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

function getPlaceholderForCategory(category: CategoryOption): string {
  switch (category) {
    case 'Vaccination':
      return 'e.g. Rabies (required), core puppy shots (DHPP), cat core (FVRCP)';
    case 'Deworming':
      return 'e.g. Monthly dewormer — clears intestinal worms';
    case 'Checkup':
      return 'e.g. Annual checkup, Dental cleaning';
    case 'Other':
      return 'e.g. X-ray, Blood test';
    default:
      return 'Enter record title';
  }
}

const createStyles = ({ colors }: Pick<Theme, 'colors'>) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.backgroundAlt },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 18,
      paddingBottom: 8,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: { fontSize: 20, lineHeight: 26, color: colors.text.heading },
    rightSpacer: { width: 40, height: 40 },
    content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 30 },
    hero: { marginBottom: 20 },
    heroTitle: { fontSize: 32, lineHeight: 38, color: colors.text.heading },
    heroSubtitle: {
      marginTop: 4,
      fontSize: 14,
      lineHeight: 20,
      color: colors.text.secondary,
    },
    form: {},
    label: {
      marginLeft: 2,
      marginBottom: 8,
      fontSize: 13,
      lineHeight: 18,
      color: colors.text.body,
    },
    blockTop: { marginTop: 14 },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    categoryCard: {
      width: '47%',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    categoryCardSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accent + '0D',
    },
    categoryIconWrapper: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    categoryLabel: {
      fontSize: 14,
      textAlign: 'center',
    },
    textAreaWrapper: {
      minHeight: 110,
    },
    uploadCard: {
      marginTop: 2,
      height: 128,
      borderRadius: 12,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    uploadPrimary: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.text.secondary,
    },
    uploadSecondary: {
      fontSize: 11,
      lineHeight: 16,
      color: colors.text.subdued,
    },
    errorText: {
      marginTop: 10,
      color: colors.danger,
      fontSize: 13,
      lineHeight: 18,
    },
    footer: { marginTop: 18 },
    saveBtn: {
      height: 56,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveText: { color: colors.text.inverse, fontSize: 16, lineHeight: 24 },
  });

export default AddHealthRecordScreen;
