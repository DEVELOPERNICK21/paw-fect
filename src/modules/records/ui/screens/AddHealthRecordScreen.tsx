import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { HealthStackParamList } from '../../../../app/navigation/types';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { useRecordStore } from '../../store/recordStore';
import { usePetStore } from '../../../pets/store/petStore';
import { DatePickerField } from '../../../../shared/components/DatePickerField';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function isoDateFromLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

type CategoryOption = 'Routine' | 'Surgery' | 'Medication' | 'Other';

const CATEGORY_MAP: Record<CategoryOption, string> = {
  Routine: 'Checkup',
  Surgery: 'Surgery',
  Medication: 'Medication',
  Other: 'Other',
};

const OPTIONS: CategoryOption[] = ['Routine', 'Surgery', 'Medication', 'Other'];

export const AddHealthRecordScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<HealthStackParamList, 'AddHealthRecord'>>();
  const { fontFamilies, colors } = useTheme();
  const { createRecordEntry } = useRecordStore();
  const { activePet } = usePetStore();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => isoDateFromLocal(new Date()));
  const [category, setCategory] = useState<CategoryOption>('Routine');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    const result = await createRecordEntry({
      petId: activePet?.id ?? '',
      title,
      category: CATEGORY_MAP[category],
      date,
      notes,
    });
    if (!result.success) {
      setError(result.error ?? 'Unable to save health record.');
      return;
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.backgroundAlt }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcon name="arrow_back" size={20} color={colors.text.body} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: fontFamilies.bold }]}>Add Health Record</Text>
        <View style={styles.rightSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { fontFamily: fontFamilies.extrabold }]}>Record Details</Text>
          <Text style={[styles.heroSubtitle, { fontFamily: fontFamilies.medium }]}>
            Keep track of your pet&apos;s medical history
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { fontFamily: fontFamilies.semibold }]}>Record Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Annual Vaccination, Dental Cleaning"
            placeholderTextColor={colors.input.placeholder}
            style={[styles.input, { fontFamily: fontFamilies.regular }]}
          />

          <Text style={[styles.label, styles.blockTop, { fontFamily: fontFamilies.semibold }]}>Date of Record</Text>
          <DatePickerField value={date} onChange={setDate} />

          <Text style={[styles.label, styles.blockTop, { fontFamily: fontFamilies.semibold }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {OPTIONS.map(option => {
              const selected = category === option;
              return (
                <Pressable key={option} style={[styles.chip, selected && styles.chipSelected]} onPress={() => setCategory(option)}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected, { fontFamily: fontFamilies.medium }]}>{option}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={[styles.label, styles.blockTop, { fontFamily: fontFamilies.semibold }]}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add details about the visit, diagnosis, or instructions..."
            placeholderTextColor={colors.input.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.textArea, { fontFamily: fontFamilies.regular }]}
          />

          <Text style={[styles.label, styles.blockTop, { fontFamily: fontFamilies.semibold }]}>Attachments</Text>
          <Pressable style={styles.uploadCard}>
            <MaterialIcon name="cloud_upload" size={24} color={colors.text.subdued} />
            <Text style={[styles.uploadPrimary, { fontFamily: fontFamilies.medium }]}>
              <Text style={{ fontFamily: fontFamilies.bold }}>Click to upload</Text> or drag and drop
            </Text>
            <Text style={[styles.uploadSecondary, { fontFamily: fontFamilies.regular }]}>PDF, PNG, JPG (MAX. 5MB)</Text>
          </Pressable>
        </View>

        {error ? (
          <Text style={[styles.errorText, { fontFamily: fontFamilies.regular }]}>{error}</Text>
        ) : null}

        <View style={styles.footer}>
          <Pressable style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={handleSave}>
            <Text style={[styles.saveText, { fontFamily: fontFamilies.bold }]}>Save Record</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F7F6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 18, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, lineHeight: 26, color: '#0F172A' },
  rightSpacer: { width: 40, height: 40 },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 30 },
  hero: { marginBottom: 20 },
  heroTitle: { fontSize: 32, lineHeight: 38, color: '#0F172A' },
  heroSubtitle: { marginTop: 4, fontSize: 14, lineHeight: 20, color: '#64748B' },
  form: {},
  label: { marginLeft: 2, marginBottom: 8, fontSize: 13, lineHeight: 18, color: '#334155' },
  blockTop: { marginTop: 14 },
  input: { height: 56, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', paddingHorizontal: 16, fontSize: 16, color: '#0F172A' },
  inputWithIcon: { height: 56, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inlineInput: { flex: 1, fontSize: 16, color: '#0F172A', marginRight: 8, padding: 0 },
  chips: { gap: 8, paddingBottom: 4 },
  chip: { height: 36, borderRadius: 18, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  chipSelected: { backgroundColor: '#EE8C2B', borderColor: '#EE8C2B' },
  chipText: { color: '#64748B', fontSize: 13, lineHeight: 18 },
  chipTextSelected: { color: '#FFFFFF' },
  textArea: { minHeight: 110, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#0F172A' },
  uploadCard: { marginTop: 2, height: 128, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: '#CBD5E1', backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', gap: 4 },
  uploadPrimary: { fontSize: 13, lineHeight: 18, color: '#64748B' },
  uploadSecondary: { fontSize: 11, lineHeight: 16, color: '#94A3B8' },
  errorText: { marginTop: 10, color: '#EF4444', fontSize: 13, lineHeight: 18 },
  footer: { marginTop: 18 },
  saveBtn: { height: 56, borderRadius: 12, backgroundColor: '#EE8C2B', alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 16, lineHeight: 24 },
});

export default AddHealthRecordScreen;
