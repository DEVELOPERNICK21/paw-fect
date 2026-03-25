import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RemindersStackParamList } from '../../../../app/navigation/types';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import type { ReminderType } from '../../domain/models/Reminder';
import { useReminderStore } from '../../store/reminderStore';
import { usePetStore } from '../../../pets/store/petStore';
import { DatePickerField } from '../../../../shared/components/DatePickerField';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function isoDateFromLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

const REMINDER_TYPES: { key: ReminderType; label: string; icon: 'vaccines' | 'pill' | 'content_cut' | 'add_circle' }[] = [
  { key: 'vaccination', label: 'Vaccination', icon: 'vaccines' },
  { key: 'medication', label: 'Medication', icon: 'pill' },
  { key: 'grooming', label: 'Grooming', icon: 'content_cut' },
  { key: 'other', label: 'Custom', icon: 'add_circle' },
];

const PET_FALLBACKS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAhOwoUYNQa0KwPVU1VkWkhx97gMbT8uNMDkqiuTZazUjpZdhmHodWYh8Ama25w5f_CamaBo8g40Ucg_ludbGT_OHczKVp-kwrIdsIdOK0xe4TkV-rAwiJmzqE4EOPxoVx3H3HXRFcM32Eta1IzTkz_0khHKp8R8TOKoC_UGpkTG4HuwwzbXdEvxHf1sU1kwySv70sUCMERrQ7Y6EdXn86wD9I7OGeOiTsY5g59ux5ZfiyUZpxorpPU2lgnlVyj3RbKeHo262K-roAy',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC5celyvxq1gQ3aN8Zr80JcPgEPciJTlstnMROaJ9Yija2r8Er_x-mdJ7S3chw7wSEDd89GqH88pdJkpSNVovRGwaoopAuIYjDpy5q4YYJb99-xjiRKxFxBIhPBSifX-ywlgA_8K35ak0ycswsZwUVXARgML8Ihzr-kPDnM3DVBtII-7wJVH_fBcyRK9oInc0g5LjoLoUeDKmVfQ-rNvG7agjnFAu2Jr3wyUDtLb1l8HzrI37fhY1YLSlQRkR8glV8bdjE1wtKTZui-',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDWfkn3ggG4nEx0oG_vDl3vtTDESuWkYX0D-MuaClvzGrxYz-JKH23MK42UwrHatmb5-bPTWHgb7xeTnWJr6-j84PJKcyhCX6vRnhNv4K6CsfmV9aH1jMFkNn1gOhxLhlAoKn5uIljprQEqmL7AbWyy6K_c-x3Sm8djsm5GjCvFcVpckJYbFUt1goVr0T6Zq2o9l1J2NUbtxlK0qsWQ-Xom7qEU1EPxURAxQdhPzVH1gObTxng5BM9PrELLKu7XGKrLLdTyavJoilRm',
];

export const AddReminderScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RemindersStackParamList, 'AddReminder'>>();
  const { fontFamilies, colors } = useTheme();
  const { createReminderEntry, loading } = useReminderStore();
  const { pets, activePet, loadPets } = usePetStore();

  const [type, setType] = useState<ReminderType>('vaccination');
  const [title, setTitle] = useState('Annual Rabies Shot');
  const [date, setDate] = useState(() => isoDateFromLocal(new Date()));
  const [time, setTime] = useState('09:00 AM');
  const [repeatEnabled, setRepeatEnabled] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPets().catch(() => {});
  }, [loadPets]);

  useEffect(() => {
    if (!selectedPetId && activePet) {
      setSelectedPetId(activePet.id);
    }
  }, [activePet, selectedPetId]);

  const visiblePets = useMemo(() => {
    if (pets.length > 0) {
      return pets;
    }
    return [
      { id: 'sample-1', name: 'Cooper', photo: PET_FALLBACKS[0] },
      { id: 'sample-2', name: 'Luna', photo: PET_FALLBACKS[1] },
      { id: 'sample-3', name: 'Bella', photo: PET_FALLBACKS[2] },
    ];
  }, [pets]);

  const handleSave = async () => {
    setError(null);
    const petId = selectedPetId ?? activePet?.id ?? '';
    const result = await createReminderEntry({
      petId,
      title,
      type,
      date,
      time,
      repeatEnabled,
    });
    if (!result.success) {
      setError(result.error ?? 'Unable to save reminder.');
      return;
    }
    navigation.navigate('ReminderList');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.backgroundAlt }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.headerIcon} onPress={() => navigation.goBack()}>
            <MaterialIcon name="arrow_back" size={22} color={colors.text.heading} />
          </Pressable>
          <Text style={[styles.headerTitle, { fontFamily: fontFamilies.bold }]}>Add Reminder</Text>
          <Pressable
            style={[styles.headerConfirm, { backgroundColor: colors.accent }]}
            onPress={handleSave}
            disabled={loading}
          >
            <MaterialIcon name="check" size={20} color={colors.text.inverse} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fontFamilies.bold }]}>Reminder Type</Text>
          <View style={styles.typeGrid}>
            {REMINDER_TYPES.map(item => {
              const selected = item.key === type;
              return (
                <Pressable
                  key={item.key}
                  style={[styles.typeCard, selected ? styles.typeCardSelected : undefined]}
                  onPress={() => setType(item.key)}
                >
                  <MaterialIcon
                    name={item.icon}
                    size={28}
                    color={selected ? colors.accent : colors.text.body}
                  />
                  <Text style={[styles.typeLabel, { fontFamily: fontFamilies.bold }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fontFamilies.bold }]}>Details</Text>

          <Text style={[styles.label, { fontFamily: fontFamilies.semibold }]}>Reminder Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Annual Rabies Shot"
            placeholderTextColor="#94A3B8"
            style={[styles.input, { fontFamily: fontFamilies.regular }]}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={[styles.label, { fontFamily: fontFamilies.semibold }]}>Date</Text>
              <DatePickerField value={date} onChange={setDate} />
            </View>
            <View style={styles.half}>
              <Text style={[styles.label, { fontFamily: fontFamilies.semibold }]}>Time</Text>
              <View style={styles.inputWithIcon}>
                <TextInput value={time} onChangeText={setTime} style={[styles.inputInline, { fontFamily: fontFamilies.regular }]} />
                <MaterialIcon name="schedule" size={18} color={colors.accent} />
              </View>
            </View>
          </View>

          <View style={styles.repeatCard}>
            <View style={styles.repeatLeft}>
              <View style={styles.repeatIconWrap}>
                <MaterialIcon name="repeat" size={18} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.repeatTitle, { fontFamily: fontFamilies.bold }]}>Repeat Reminder</Text>
                <Text style={[styles.repeatCaption, { fontFamily: fontFamilies.medium }]}>Every year</Text>
              </View>
            </View>
            <Switch
              value={repeatEnabled}
              onValueChange={setRepeatEnabled}
              thumbColor="#FFFFFF"
              trackColor={{ true: '#EE8C2B', false: '#CBD5E1' }}
            />
          </View>

          <Text style={[styles.label, styles.petLabel, { fontFamily: fontFamilies.semibold }]}>Assign to Pet</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petRow}>
            {visiblePets.map((pet, index) => {
              const selected = pet.id === selectedPetId || (!selectedPetId && index === 0);
              return (
                <Pressable key={pet.id} style={styles.petItem} onPress={() => setSelectedPetId(pet.id)}>
                  <View style={[styles.petAvatarWrap, selected ? styles.petAvatarSelected : undefined]}>
                    <Image source={{ uri: pet.photo ?? PET_FALLBACKS[index % PET_FALLBACKS.length] }} style={styles.petAvatar} />
                  </View>
                  <Text style={[styles.petName, selected ? styles.petNameSelected : undefined, { fontFamily: fontFamilies.bold }]}>
                    {pet.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.noteCard}>
          <MaterialIcon name="info" size={18} color={colors.text.subdued} />
          <Text style={[styles.noteText, { fontFamily: fontFamilies.regular }]}>
            We&apos;ll send you a notification 24 hours before and 1 hour before the scheduled time.
          </Text>
        </View>

        {error ? (
          <Text style={[styles.errorText, { fontFamily: fontFamilies.regular }]}>{error}</Text>
        ) : null}

        <View style={styles.footer}>
          <Pressable
            style={[styles.ctaButton, { backgroundColor: colors.accent }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={[styles.ctaText, { fontFamily: fontFamilies.bold }]}>Set Reminder</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F7F6' },
  content: { minHeight: 884, paddingBottom: 24 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F7F6',
  },
  headerIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, lineHeight: 24, letterSpacing: -0.27, color: '#0F172A' },
  headerConfirm: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EE8C2B' },
  section: { paddingHorizontal: 16, paddingTop: 18 },
  sectionTitle: { fontSize: 18, lineHeight: 24, letterSpacing: -0.27, color: '#0F172A', marginBottom: 16 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  typeCard: {
    width: '48.5%',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(238,140,43,0.12)',
    backgroundColor: '#F8F7F6',
    paddingVertical: 20,
    alignItems: 'center',
    gap: 10,
  },
  typeCardSelected: { backgroundColor: 'rgba(238,140,43,0.1)', borderColor: '#EE8C2B' },
  typeLabel: { fontSize: 14, lineHeight: 20, color: '#0F172A' },
  label: { fontSize: 13, lineHeight: 18, color: '#334155', marginBottom: 8, paddingLeft: 2 },
  input: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(238,140,43,0.2)',
    backgroundColor: '#F8F7F6',
    paddingHorizontal: 16,
    fontSize: 16,
    lineHeight: 24,
    color: '#0F172A',
  },
  row: { flexDirection: 'row', gap: 12, marginTop: 12 },
  half: { flex: 1 },
  inputWithIcon: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(238,140,43,0.2)',
    backgroundColor: '#F8F7F6',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputInline: { flex: 1, fontSize: 16, lineHeight: 24, color: '#0F172A', padding: 0, marginRight: 8 },
  repeatCard: {
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(238,140,43,0.12)',
    backgroundColor: 'rgba(238,140,43,0.05)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  repeatLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  repeatIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(238,140,43,0.2)', alignItems: 'center', justifyContent: 'center' },
  repeatTitle: { fontSize: 14, lineHeight: 20, color: '#0F172A' },
  repeatCaption: { fontSize: 12, lineHeight: 16, color: '#64748B' },
  petLabel: { marginTop: 14 },
  petRow: { gap: 12, paddingBottom: 2 },
  petItem: { alignItems: 'center' },
  petAvatarWrap: { width: 66, height: 66, borderRadius: 33, borderWidth: 2, borderColor: 'transparent', padding: 2 },
  petAvatarSelected: { borderColor: '#EE8C2B' },
  petAvatar: { width: '100%', height: '100%', borderRadius: 33 },
  petName: { marginTop: 6, fontSize: 12, lineHeight: 16, color: '#0F172A', opacity: 0.6 },
  petNameSelected: { color: '#EE8C2B', opacity: 1 },
  noteCard: { marginHorizontal: 16, marginTop: 24, borderRadius: 12, backgroundColor: '#F1F5F9', padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#64748B' },
  errorText: { marginTop: 10, marginHorizontal: 16, color: '#EF4444', fontSize: 13, lineHeight: 18 },
  footer: { marginTop: 16, paddingHorizontal: 16, paddingBottom: 12 },
  ctaButton: { height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EE8C2B' },
  ctaText: { color: '#FFFFFF', fontSize: 16, lineHeight: 24 },
});

export default AddReminderScreen;
