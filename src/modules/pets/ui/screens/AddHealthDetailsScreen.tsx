import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { PetsStackParamList } from '../../../../app/navigation/types';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { Input } from '../../../../shared/components/Input';
import { useRecordStore } from '../../../records/store/recordStore';
import { usePetStore } from '../../store/petStore';
import { useAppTabBarInset } from '../../../../app/navigation/layout';

type HealthKind = 'weight' | 'vaccines' | 'conditions';

export const AddHealthDetailsScreen: React.FC = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<PetsStackParamList, 'AddHealthDetails'>
    >();
  const route = useRoute<RouteProp<PetsStackParamList, 'AddHealthDetails'>>();

  const { colors, fontFamilies, shadows } = useTheme();
  const tabBarInset = useAppTabBarInset();

  const kind: HealthKind = (route.params?.kind ?? 'weight') as HealthKind;

  const { activePet } = usePetStore();
  const createRecordEntry = useRecordStore(s => s.createRecordEntry);

  const todayYmd = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [date, setDate] = useState(todayYmd);
  const [error, setError] = useState<string | null>(null);

  const [weight, setWeight] = useState<string>('');
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');

  const [name, setName] = useState<string>(''); // vaccine/condition name

  const title =
    kind === 'weight'
      ? 'Add Weight'
      : kind === 'vaccines'
      ? 'Add Vaccines'
      : 'Add Conditions';

  const parseYmd = useCallback((raw: string): Date | null => {
    const v = raw.trim();
    if (!v) {
      return null;
    }
    const d = new Date(v.length === 10 ? `${v}T00:00:00` : v);
    return Number.isNaN(d.getTime()) ? null : d;
  }, []);

  const handleSave = useCallback(async () => {
    setError(null);

    if (!activePet?.id) {
      setError('No active pet found.');
      return;
    }

    const parsedDate = parseYmd(date);
    if (!parsedDate) {
      setError('Please enter a valid date (YYYY-MM-DD).');
      return;
    }

    if (kind === 'weight') {
      const w = weight.trim();
      if (!w) {
        setError('Weight is required.');
        return;
      }
      const num = Number(w);
      if (!Number.isFinite(num) || num <= 0) {
        setError('Enter a valid weight (e.g. 12.5).');
        return;
      }

      const recordTitle = 'Weight';
      const recordCategory = 'Other';
      const notes = `Weight: ${num} ${unit}`;

      const res = await createRecordEntry({
        petId: activePet.id,
        title: recordTitle,
        category: recordCategory,
        date: date.trim(),
        notes,
      });

      if (!res.success) {
        setError(res.error ?? 'Unable to save weight.');
        return;
      }
    }

    if (kind === 'vaccines') {
      const n = name.trim();
      if (!n) {
        setError('Vaccine name is required.');
        return;
      }

      const res = await createRecordEntry({
        petId: activePet.id,
        title: 'Vaccination',
        category: 'Checkup',
        date: date.trim(),
        notes: `Vaccination: ${n}`,
      });

      if (!res.success) {
        setError(res.error ?? 'Unable to save vaccine.');
        return;
      }
    }

    if (kind === 'conditions') {
      const n = name.trim();
      if (!n) {
        setError('Condition name is required.');
        return;
      }

      const res = await createRecordEntry({
        petId: activePet.id,
        title: 'Condition',
        category: 'Other',
        date: date.trim(),
        notes: `Condition: ${n}`,
      });

      if (!res.success) {
        setError(res.error ?? 'Unable to save condition.');
        return;
      }
    }

    navigation.goBack();
  }, [
    activePet?.id,
    createRecordEntry,
    date,
    kind,
    name,
    navigation,
    parseYmd,
    unit,
    weight,
  ]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.backgroundAlt }]}
    >
      <View style={styles.header}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
        >
          <MaterialIcon name="arrow_back" size={20} color={colors.accent} />
        </Pressable>
        <Text
          style={[
            styles.headerTitle,
            { fontFamily: fontFamilies.bold, color: colors.text.heading },
          ]}
        >
          {title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarInset + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
              ...shadows.sm,
            },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              {
                fontFamily: fontFamilies.extrabold,
                color: colors.text.heading,
              },
            ]}
          >
            Details
          </Text>
          <Text
            style={[
              styles.cardSubtitle,
              { fontFamily: fontFamilies.medium, color: colors.text.subdued },
            ]}
          >
            Add this now to improve your pet’s profile accuracy.
          </Text>
        </View>

        <View style={{ gap: 14, marginTop: 18 }}>
          <Text
            style={[
              styles.label,
              { fontFamily: fontFamilies.semibold, color: colors.text.body },
            ]}
          >
            Date
          </Text>
          <Input
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
          />

          {kind === 'weight' ? (
            <>
              <View style={{ gap: 8 }}>
                <Text
                  style={[
                    styles.label,
                    {
                      fontFamily: fontFamilies.semibold,
                      color: colors.text.body,
                    },
                  ]}
                >
                  Weight({unit})
                </Text>
                <Input
                  value={weight}
                  onChangeText={setWeight}
                  placeholder={unit === 'kg' ? 'e.g. 12.5' : 'e.g. 27'}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.unitRow}>
                {(['kg', 'lb'] as const).map(nextUnit => {
                  const selected = unit === nextUnit;
                  return (
                    <Pressable
                      key={nextUnit}
                      onPress={() => setUnit(nextUnit)}
                      style={[
                        styles.unitChip,
                        {
                          backgroundColor: selected
                            ? colors.accent
                            : colors.surface,
                          borderColor: selected
                            ? colors.accent
                            : colors.borderSubtle,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.unitChipText,
                          {
                            color: selected
                              ? colors.text.inverse
                              : colors.text.heading,
                            fontFamily: selected
                              ? fontFamilies.bold
                              : fontFamilies.medium,
                          },
                        ]}
                      >
                        {nextUnit.toUpperCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          {kind === 'vaccines' ? (
            <View style={{ gap: 8 }}>
              <Text
                style={[
                  styles.label,
                  {
                    fontFamily: fontFamilies.semibold,
                    color: colors.text.body,
                  },
                ]}
              >
                Vaccine name
              </Text>
              <Input
                value={name}
                onChangeText={setName}
                placeholder="e.g. Rabies (required) or core shots (DHPP)"
              />
            </View>
          ) : null}

          {kind === 'conditions' ? (
            <View style={{ gap: 8 }}>
              <Text
                style={[
                  styles.label,
                  {
                    fontFamily: fontFamilies.semibold,
                    color: colors.text.body,
                  },
                ]}
              >
                Condition name
              </Text>
              <Input
                value={name}
                onChangeText={setName}
                placeholder="e.g. Allergy, Arthritis"
              />
            </View>
          ) : null}

          {error ? (
            <Text
              style={[
                styles.errorText,
                { fontFamily: fontFamilies.regular, color: colors.danger },
              ]}
            >
              {error}
            </Text>
          ) : null}

          <Pressable
            onPress={() => void handleSave()}
            style={[styles.saveBtn, { backgroundColor: colors.accent }]}
          >
            <MaterialIcon
              name="check_circle"
              size={18}
              color={colors.text.inverse}
            />
            <Text
              style={[
                styles.saveBtnText,
                { fontFamily: fontFamilies.bold, color: colors.text.inverse },
              ]}
            >
              Save
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddHealthDetailsScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, lineHeight: 24 },
  content: { paddingHorizontal: 16, paddingTop: 10 },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  cardTitle: { fontSize: 18, lineHeight: 24 },
  cardSubtitle: { fontSize: 14, lineHeight: 20 },
  label: { fontSize: 14, lineHeight: 20 },
  inputWrap: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12 },
  input: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  unitRow: { flexDirection: 'row', gap: 10, marginTop: 8, flexWrap: 'wrap' },
  unitChip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  unitChipText: { fontSize: 13, lineHeight: 18 },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  saveBtn: {
    marginTop: 10,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  saveBtnText: { fontSize: 16, lineHeight: 24 },
});
