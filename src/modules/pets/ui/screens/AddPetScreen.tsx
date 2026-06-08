import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import type { PetsStackParamList } from '../../../../app/navigation/types';
import { validateLastDewormingDate } from '../../../records/domain/utils/DewormingEngine';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { usePetStore } from '../../store/petStore';
import type {
  Pet,
  PetGender,
  PetLifestyleRiskLevel,
  PetLifestyleType,
  PetRegion,
  PetType,
} from '../../domain/models/Pet';
import { isPetPhotoPlaceholderUri } from '../../domain/utils/petPhotoPlaceholder';
import { icons } from '../../../../shared/assets/icons';
import { DatePickerField } from '../../../../shared/components/DatePickerField';
import { spacing } from '../../../../shared/theme/spacing';

type IconKind = 'arrow-back' | 'camera' | 'check' | 'pets';

const ICON_PATHS: Record<IconKind, string> = {
  'arrow-back': 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  camera:
    'M20 5h-3.17L15 3H9L7.17 5H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2zm0 13H4V7h4.05l1.83-2h4.24l1.83 2H20v11zm-8-2.5A4.5 4.5 0 1012 6a4.5 4.5 0 000 9zm0-1.8a2.7 2.7 0 110-5.4 2.7 2.7 0 010 5.4z',
  check: 'M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5z',
  pets: 'M4.5 9C3.12 9 2 7.88 2 6.5S3.12 4 4.5 4 7 5.12 7 6.5 5.88 9 4.5 9zm15 0c-1.38 0-2.5-1.12-2.5-2.5S18.12 4 19.5 4 22 5.12 22 6.5 20.88 9 19.5 9zM12 4c-1.38 0-2.5-1.12-2.5-2.5S10.62-1 12-1s2.5 1.12 2.5 2.5S13.38 4 12 4zm0 20c-3.31 0-6-2.24-6-5 0-1.77 1.03-3.32 2.56-4.21C9.76 13.96 10.84 13.5 12 13.5s2.24.46 3.44 1.29C16.97 15.68 18 17.23 18 19c0 2.76-2.69 5-6 5z',
};

const PROFILE_PLACEHOLDER = '';

export {};

interface IconProps {
  kind: IconKind;
  size?: number;
  color: string;
}

const MaterialIcon: React.FC<IconProps> = ({
  kind,
  size = 20,
  color,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d={ICON_PATHS[kind]} fill={color} />
  </Svg>
);

export const AddPetScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<PetsStackParamList, 'AddPet'>>();
  const route = useRoute<RouteProp<PetsStackParamList, 'AddPet'>>();
  const petId = route.params?.petId;
  const isEditMode = petId != null && petId.length > 0;

  const { colors, fontFamilies } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createPetProfile = usePetStore(s => s.createPetProfile);
  const updatePet = usePetStore(s => s.updatePet);

  const [name, setName] = useState('');
  const [petType, setPetType] = useState<PetType>('dog');
  const [breed, setBreed] = useState('');
  const [photoUri, setPhotoUri] = useState<string>(PROFILE_PLACEHOLDER);
  const [dob, setDob] = useState<string>('');
  const [gender, setGender] = useState<PetGender | ''>('');
  const [lifestyleType, setLifestyleType] =
    useState<PetLifestyleType>('indoor');
  const [lifestyleRiskLevel, setLifestyleRiskLevel] =
    useState<PetLifestyleRiskLevel>('low');
  const [region, setRegion] = useState<PetRegion>('OTHER');
  const [error, setError] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(isEditMode);
  const [editBase, setEditBase] = useState<Pet | null>(null);
  const [hasPreviousDeworming, setHasPreviousDeworming] = useState(false);
  const [lastDewormingDate, setLastDewormingDate] = useState('');
  const [lastDewormingUnknown, setLastDewormingUnknown] = useState(false);
  const [hasPreviousVaccination, setHasPreviousVaccination] = useState(false);
  const [lastVaccinationDate, setLastVaccinationDate] = useState('');
  const [lastVaccinationUnknown, setLastVaccinationUnknown] = useState(false);
  const [hasPreviousRabies, setHasPreviousRabies] = useState(false);
  const [lastRabiesDate, setLastRabiesDate] = useState('');
  const [lastRabiesUnknown, setLastRabiesUnknown] = useState(false);

  const toFriendlyAddPetError = (rawError?: string): string => {
    if (!rawError) {
      return 'Unable to save pet profile right now. Please try again.';
    }
    if (rawError === 'PET_LIMIT') {
      return 'You have reached your current plan pet limit. Upgrade your plan to add more pets.';
    }
    return rawError;
  };

  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => today.toISOString().slice(0, 10), [today]);

  useEffect(() => {
    if (!isEditMode || !petId) {
      setInitLoading(false);
      setEditBase(null);
      return;
    }

    let cancelled = false;
    setInitLoading(true);

    void usePetStore
      .getState()
      .getPetById(petId)
      .then(pet => {
        if (cancelled) {
          return;
        }
        if (!pet) {
          setError('This pet could not be found.');
          setInitLoading(false);
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            // We're likely in the "pet required" gate. RootNavigator will swap screens after save.
          }
          return;
        }
        setEditBase(pet);
        setName(pet.name);
        setPetType(pet.type);
        setBreed(pet.breed ?? '');
        setPhotoUri(pet.photo?.trim() ? pet.photo : PROFILE_PLACEHOLDER);
        setDob(pet.dob ?? '');
        setGender((pet.gender as PetGender | undefined) ?? '');
        setLifestyleType(pet.lifestyle?.type ?? 'indoor');
        setLifestyleRiskLevel(pet.lifestyle?.riskLevel ?? 'low');
        setRegion(pet.region ?? 'OTHER');
        void usePetStore
          .getState()
          .getLastHealthMilestones(pet.id)
          .then(milestones => {
            if (cancelled) return;
            if (milestones.lastDewormingDate) {
              setHasPreviousDeworming(true);
              setLastDewormingUnknown(false);
              setLastDewormingDate(milestones.lastDewormingDate);
            }
            if (milestones.lastVaccinationDate) {
              setHasPreviousVaccination(true);
              setLastVaccinationUnknown(false);
              setLastVaccinationDate(milestones.lastVaccinationDate);
            }
            if (milestones.lastRabiesDate) {
              setHasPreviousRabies(true);
              setLastRabiesUnknown(false);
              setLastRabiesDate(milestones.lastRabiesDate);
            }
          });
        setInitLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEditMode, navigation, petId]);

  const parseAndValidateDob = (
    raw: string,
  ): { ok: true; value: string } | { ok: false; error: string } => {
    const v = raw.trim();
    if (!v) {
      return { ok: true, value: '' };
    }
    const d = new Date(v.length === 10 ? `${v}T00:00:00` : v);
    if (Number.isNaN(d.getTime())) {
      return {
        ok: false,
        error: 'Please enter a valid date of birth (YYYY-MM-DD).',
      };
    }
    if (d.getTime() > Date.now()) {
      return { ok: false, error: 'Date of birth cannot be in the future.' };
    }
    return { ok: true, value: v };
  };

  const trimmedName = name.trim();
  const dobCheck = parseAndValidateDob(dob);
  const canSave =
    trimmedName.length > 0 &&
    (isEditMode || (dob.trim().length > 0 && dobCheck.ok));

  const performEditSave = async (): Promise<void> => {
    if (!editBase) {
      return;
    }
    setError(null);
    const nextPhoto = isPetPhotoPlaceholderUri(photoUri)
      ? undefined
      : photoUri;
    const result = await updatePet({
      ...editBase,
      name: trimmedName,
      type: petType,
      breed: breed.trim() || undefined,
      photo: nextPhoto,
      dob: dob.trim() || undefined,
      gender: gender || undefined,
      lifestyle: { type: lifestyleType, riskLevel: lifestyleRiskLevel },
      region,
    },
    {
      lastDewormingDate:
        hasPreviousDeworming && !lastDewormingUnknown
          ? lastDewormingDate.trim() || undefined
          : undefined,
      lastVaccinationDate:
        hasPreviousVaccination && !lastVaccinationUnknown
          ? lastVaccinationDate.trim() || undefined
          : undefined,
      lastRabiesDate:
        hasPreviousRabies && !lastRabiesUnknown
          ? lastRabiesDate.trim() || undefined
          : undefined,
    });
    if (!result.success) {
      setError(result.error ?? 'Unable to save changes.');
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleSave = async () => {
    setError(null);
    if (!canSave) {
      setError('Pet name and date of birth are required.');
      return;
    }
    if (!isEditMode) {
      const checkDob = parseAndValidateDob(dob);
      if (!checkDob.ok || !checkDob.value) {
        setError(
          checkDob.ok ? 'Date of birth is required.' : checkDob.error,
        );
        return;
      }
      if (hasPreviousDeworming && !lastDewormingUnknown) {
        if (!lastDewormingDate.trim()) {
          setError(
            'Enter the last deworming date or choose “I don’t know the date”.',
          );
          return;
        }
        const v = validateLastDewormingDate(
          checkDob.value,
          lastDewormingDate.trim(),
          todayIso,
        );
        if (!v.ok) {
          setError(
            v.code === 'before_dob'
              ? 'Last deworming cannot be before date of birth.'
              : 'Last deworming cannot be in the future.',
          );
          return;
        }
      }
      if (hasPreviousVaccination && !lastVaccinationUnknown) {
        if (!lastVaccinationDate.trim()) {
          setError(
            'Enter the last vaccination date or choose “I don’t know the date”.',
          );
          return;
        }
        const v = validateLastDewormingDate(
          checkDob.value,
          lastVaccinationDate.trim(),
          todayIso,
        );
        if (!v.ok) {
          setError(
            v.code === 'before_dob'
              ? 'Last vaccination cannot be before date of birth.'
              : 'Last vaccination cannot be in the future.',
          );
          return;
        }
      }
      if (hasPreviousRabies && !lastRabiesUnknown) {
        if (!lastRabiesDate.trim()) {
          setError('Enter the last rabies date or choose “I don’t know the date”.');
          return;
        }
        const v = validateLastDewormingDate(
          checkDob.value,
          lastRabiesDate.trim(),
          todayIso,
        );
        if (!v.ok) {
          setError(
            v.code === 'before_dob'
              ? 'Last rabies shot cannot be before date of birth.'
              : 'Last rabies shot cannot be in the future.',
          );
          return;
        }
      }
    }

    if (isEditMode && editBase) {
      if (dob.trim().length > 0) {
        const check = parseAndValidateDob(dob);
        if (!check.ok) {
          setError(check.error);
          return;
        }
      }

      if (hasPreviousDeworming && !lastDewormingUnknown && dob.trim()) {
        const check = parseAndValidateDob(dob);
        if (check.ok && check.value && lastDewormingDate.trim()) {
          const v = validateLastDewormingDate(
            check.value,
            lastDewormingDate.trim(),
            todayIso,
          );
          if (!v.ok) {
            setError(
              v.code === 'before_dob'
                ? 'Last deworming cannot be before date of birth.'
                : 'Last deworming cannot be in the future.',
            );
            return;
          }
        }
      }
      if (hasPreviousVaccination && !lastVaccinationUnknown && dob.trim()) {
        const check = parseAndValidateDob(dob);
        if (check.ok && check.value && lastVaccinationDate.trim()) {
          const v = validateLastDewormingDate(
            check.value,
            lastVaccinationDate.trim(),
            todayIso,
          );
          if (!v.ok) {
            setError(
              v.code === 'before_dob'
                ? 'Last vaccination cannot be before date of birth.'
                : 'Last vaccination cannot be in the future.',
            );
            return;
          }
        }
      }
      if (hasPreviousRabies && !lastRabiesUnknown && dob.trim()) {
        const check = parseAndValidateDob(dob);
        if (check.ok && check.value && lastRabiesDate.trim()) {
          const v = validateLastDewormingDate(
            check.value,
            lastRabiesDate.trim(),
            todayIso,
          );
          if (!v.ok) {
            setError(
              v.code === 'before_dob'
                ? 'Last rabies shot cannot be before date of birth.'
                : 'Last rabies shot cannot be in the future.',
            );
            return;
          }
        }
      }

      await performEditSave();
      return;
    }

    const result = await createPetProfile({
      name,
      type: petType,
      breed,
      dob: dob.trim() || undefined,
      gender: gender || undefined,
      lifestyle: { type: lifestyleType, riskLevel: lifestyleRiskLevel },
      region,
      photo: isPetPhotoPlaceholderUri(photoUri) ? undefined : photoUri,
      lastDewormingDate:
        hasPreviousDeworming && !lastDewormingUnknown
          ? lastDewormingDate.trim() || undefined
          : undefined,
      lastVaccinationDate:
        hasPreviousVaccination && !lastVaccinationUnknown
          ? lastVaccinationDate.trim() || undefined
          : undefined,
      lastRabiesDate:
        hasPreviousRabies && !lastRabiesUnknown
          ? lastRabiesDate.trim() || undefined
          : undefined,
    });
    if (!result.success) {
      if (result.error === 'PET_LIMIT') {
        navigation.navigate('Paywall', { source: 'pet_limit' });
        return;
      }
      setError(toFriendlyAddPetError(result.error));
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const petTypes = useMemo(
    () =>
      [
        { key: 'dog', label: 'Dog' },
        { key: 'cat', label: 'Cat' },
      ] as const,
    [],
  );

  if (initLoading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          styles.initCenter,
          { backgroundColor: colors.backgroundAlt },
        ]}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.backgroundAlt }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.headerIconButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                // Gate mode: no back route available.
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcon
              kind="arrow-back"
              size={24}
              color={colors.text.heading}
            />
          </Pressable>
          <Text style={[styles.headerTitle, { fontFamily: fontFamilies.bold }]}>
            {isEditMode ? 'Edit pet' : 'Add Pet to Pawfect'}
          </Text>
          <View style={styles.headerRightSpacer} />
        </View>

        <View style={styles.avatarSection}>
          <View
            style={[
              styles.profileImageWrap,
              { backgroundColor: colors.brandTint5 },
            ]}
          >
            {petType === 'dog' ? (
              <icons.dogIcon width={80} height={80} />
            ) : (
              <icons.catIcon width={80} height={80} />
            )}
          </View>
        </View>

        <View style={styles.formSection}>
          <View>
            <Text
              style={[styles.sectionLabel, { fontFamily: fontFamilies.bold }]}
            >
              Health onboarding
            </Text>
            <Text
              style={[styles.fieldLabelSm, { fontFamily: fontFamilies.semibold }]}
            >
              Date of birth {!isEditMode ? '(required)' : '(optional)'}
            </Text>
            <DatePickerField
              value={dob}
              onChange={setDob}
              placeholder="YYYY-MM-DD"
              maximumDate={today}
            />
          </View>

          <View>
            <Text
              style={[styles.fieldLabelSm, { fontFamily: fontFamilies.semibold }]}
            >
              Has your pet been dewormed before?
            </Text>
            <View style={styles.genderRow}>
              <Pressable
                style={[
                  styles.genderChip,
                  !hasPreviousDeworming ? styles.genderChipSelected : undefined,
                ]}
                onPress={() => {
                  setHasPreviousDeworming(false);
                  setLastDewormingDate('');
                  setLastDewormingUnknown(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: !hasPreviousDeworming }}
              >
                <Text
                  style={[
                    styles.genderChipText,
                    !hasPreviousDeworming
                      ? styles.genderChipTextSelected
                      : undefined,
                    {
                      fontFamily: !hasPreviousDeworming
                        ? fontFamilies.bold
                        : fontFamilies.medium,
                    },
                  ]}
                >
                  No
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.genderChip,
                  hasPreviousDeworming ? styles.genderChipSelected : undefined,
                ]}
                onPress={() => setHasPreviousDeworming(true)}
                accessibilityRole="button"
                accessibilityState={{ selected: hasPreviousDeworming }}
              >
                <Text
                  style={[
                    styles.genderChipText,
                    hasPreviousDeworming
                      ? styles.genderChipTextSelected
                      : undefined,
                    {
                      fontFamily: hasPreviousDeworming
                        ? fontFamilies.bold
                        : fontFamilies.medium,
                    },
                  ]}
                >
                  Yes
                </Text>
              </Pressable>
            </View>
            {hasPreviousDeworming ? (
              <View style={{ marginTop: 12, gap: 10 }}>
                <Pressable
                  onPress={() => {
                    setLastDewormingUnknown(v => {
                      const next = !v;
                      if (next) {
                        setLastDewormingDate('');
                      }
                      return next;
                    });
                  }}
                  style={styles.genderClear}
                >
                  <Text
                    style={{
                      fontFamily: fontFamilies.medium,
                      color: lastDewormingUnknown
                        ? colors.accent
                        : colors.text.subdued,
                    }}
                  >
                    I don&apos;t know the date
                  </Text>
                </Pressable>
                {!lastDewormingUnknown ? (
                  <>
                    <Text
                      style={[
                        styles.fieldLabelSm,
                        { fontFamily: fontFamilies.semibold },
                      ]}
                    >
                      Last deworming date
                    </Text>
                    <DatePickerField
                      value={lastDewormingDate}
                      onChange={setLastDewormingDate}
                      placeholder="YYYY-MM-DD"
                      maximumDate={today}
                    />
                  </>
                ) : null}
              </View>
            ) : null}
          </View>

          <View>
            <Text
              style={[styles.fieldLabelSm, { fontFamily: fontFamilies.semibold }]}
            >
              Has your pet received vaccinations before?
            </Text>
            <View style={styles.genderRow}>
              <Pressable
                style={[
                  styles.genderChip,
                  !hasPreviousVaccination ? styles.genderChipSelected : undefined,
                ]}
                onPress={() => {
                  setHasPreviousVaccination(false);
                  setLastVaccinationDate('');
                  setLastVaccinationUnknown(false);
                  setHasPreviousRabies(false);
                  setLastRabiesDate('');
                  setLastRabiesUnknown(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: !hasPreviousVaccination }}
              >
                <Text
                  style={[
                    styles.genderChipText,
                    !hasPreviousVaccination
                      ? styles.genderChipTextSelected
                      : undefined,
                    {
                      fontFamily: !hasPreviousVaccination
                        ? fontFamilies.bold
                        : fontFamilies.medium,
                    },
                  ]}
                >
                  No
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.genderChip,
                  hasPreviousVaccination ? styles.genderChipSelected : undefined,
                ]}
                onPress={() => setHasPreviousVaccination(true)}
                accessibilityRole="button"
                accessibilityState={{ selected: hasPreviousVaccination }}
              >
                <Text
                  style={[
                    styles.genderChipText,
                    hasPreviousVaccination
                      ? styles.genderChipTextSelected
                      : undefined,
                    {
                      fontFamily: hasPreviousVaccination
                        ? fontFamilies.bold
                        : fontFamilies.medium,
                    },
                  ]}
                >
                  Yes
                </Text>
              </Pressable>
            </View>
            {hasPreviousVaccination ? (
              <View style={{ marginTop: 12, gap: 10 }}>
                <Pressable
                  onPress={() => {
                    setLastVaccinationUnknown(v => {
                      const next = !v;
                      if (next) {
                        setLastVaccinationDate('');
                      }
                      return next;
                    });
                  }}
                  style={styles.genderClear}
                >
                  <Text
                    style={{
                      fontFamily: fontFamilies.medium,
                      color: lastVaccinationUnknown
                        ? colors.accent
                        : colors.text.subdued,
                    }}
                  >
                    I don&apos;t know the date
                  </Text>
                </Pressable>
                {!lastVaccinationUnknown ? (
                  <>
                    <Text
                      style={[
                        styles.fieldLabelSm,
                        { fontFamily: fontFamilies.semibold },
                      ]}
                    >
                      Last vaccination date
                    </Text>
                    <DatePickerField
                      value={lastVaccinationDate}
                      onChange={setLastVaccinationDate}
                      placeholder="YYYY-MM-DD"
                      maximumDate={today}
                    />
                  </>
                ) : null}
              </View>
            ) : null}
          </View>

          <View>
            <Text
              style={[styles.fieldLabelSm, { fontFamily: fontFamilies.semibold }]}
            >
              Has your pet received rabies vaccine?
            </Text>
            <View style={styles.genderRow}>
              <Pressable
                style={[
                  styles.genderChip,
                  !hasPreviousRabies ? styles.genderChipSelected : undefined,
                ]}
                onPress={() => {
                  setHasPreviousRabies(false);
                  setLastRabiesDate('');
                  setLastRabiesUnknown(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: !hasPreviousRabies }}
              >
                <Text
                  style={[
                    styles.genderChipText,
                    !hasPreviousRabies ? styles.genderChipTextSelected : undefined,
                    {
                      fontFamily: !hasPreviousRabies
                        ? fontFamilies.bold
                        : fontFamilies.medium,
                    },
                  ]}
                >
                  No
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.genderChip,
                  hasPreviousRabies ? styles.genderChipSelected : undefined,
                ]}
                onPress={() => setHasPreviousRabies(true)}
                accessibilityRole="button"
                accessibilityState={{ selected: hasPreviousRabies }}
              >
                <Text
                  style={[
                    styles.genderChipText,
                    hasPreviousRabies ? styles.genderChipTextSelected : undefined,
                    {
                      fontFamily: hasPreviousRabies
                        ? fontFamilies.bold
                        : fontFamilies.medium,
                    },
                  ]}
                >
                  Yes
                </Text>
              </Pressable>
            </View>
            {hasPreviousRabies ? (
              <View style={{ marginTop: 12, gap: 10 }}>
                <Pressable
                  onPress={() => {
                    setLastRabiesUnknown(v => {
                      const next = !v;
                      if (next) {
                        setLastRabiesDate('');
                      }
                      return next;
                    });
                  }}
                  style={styles.genderClear}
                >
                  <Text
                    style={{
                      fontFamily: fontFamilies.medium,
                      color: lastRabiesUnknown ? colors.accent : colors.text.subdued,
                    }}
                  >
                    I don&apos;t know the date
                  </Text>
                </Pressable>
                {!lastRabiesUnknown ? (
                  <>
                    <Text
                      style={[
                        styles.fieldLabelSm,
                        { fontFamily: fontFamilies.semibold },
                      ]}
                    >
                      Last rabies vaccine date
                    </Text>
                    <DatePickerField
                      value={lastRabiesDate}
                      onChange={setLastRabiesDate}
                      placeholder="YYYY-MM-DD"
                      maximumDate={today}
                    />
                  </>
                ) : null}
              </View>
            ) : null}
          </View>

          <View>
            <Text
              style={[styles.fieldLabel, { fontFamily: fontFamilies.semibold }]}
            >
              Pet Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your pet's name"
              placeholderTextColor={colors.input.placeholder}
              style={[styles.textInput, { fontFamily: fontFamilies.regular }]}
            />
          </View>

          <View>
            <Text
              style={[styles.sectionLabel, { fontFamily: fontFamilies.bold }]}
            >
              Pet Type
            </Text>
            <View style={styles.petTypeGrid}>
              {petTypes.map(type => {
                const selected = petType === type.key;
                return (
                  <Pressable
                    key={type.key}
                    style={[
                      styles.petTypeCard,
                      selected ? styles.petTypeCardSelected : undefined,
                    ]}
                    onPress={() => setPetType(type.key)}
                  >
                    <Text
                      style={[
                        styles.petTypeLabel,
                        { fontFamily: fontFamilies.bold },
                      ]}
                    >
                      {type.label}
                    </Text>
                    {selected ? (
                      <View style={styles.checkBadge}>
                        <MaterialIcon
                          kind="check"
                          size={12}
                          color={colors.text.inverse}
                        />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <Text
              style={[styles.fieldLabel, { fontFamily: fontFamilies.semibold }]}
            >
              Breed (Optional)
            </Text>
            <TextInput
              value={breed}
              onChangeText={setBreed}
              placeholder="e.g. Golden Retriever"
              placeholderTextColor={colors.input.placeholder}
              style={[styles.textInput, { fontFamily: fontFamilies.regular }]}
            />
          </View>
          <View style={{ gap: 14 }}>
            <View>
              <Text
                style={[styles.sectionLabel, { fontFamily: fontFamilies.bold }]}
              >
                Core Identity
              </Text>
            </View>

            <View>
              <Text
                style={[
                  styles.fieldLabelSm,
                  { fontFamily: fontFamilies.semibold },
                ]}
              >
                Gender (optional)
              </Text>
              <View style={styles.genderRow}>
                {(['male', 'female'] as const).map(next => {
                  const selected = gender === next;
                  const label =
                    next === 'male'
                      ? 'Male'
                      : next === 'female'
                      ? 'Female'
                      : '';
                  if (!label) {
                    return null;
                  }
                  return (
                    <Pressable
                      key={next}
                      style={[
                        styles.genderChip,
                        selected ? styles.genderChipSelected : undefined,
                      ]}
                      onPress={() => setGender(next)}
                    >
                      <Text
                        style={[
                          styles.genderChipText,
                          selected ? styles.genderChipTextSelected : undefined,
                          {
                            fontFamily: selected
                              ? fontFamilies.bold
                              : fontFamilies.medium,
                          },
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                onPress={() => setGender('')}
                style={styles.genderClear}
              >
                <Text
                  style={{
                    fontFamily: fontFamilies.medium,
                    color: colors.text.subdued,
                  }}
                >
                  Clear
                </Text>
              </Pressable>
            </View>
            <View>
              <Text
                style={[
                  styles.fieldLabelSm,
                  { fontFamily: fontFamilies.semibold },
                ]}
              >
                Lifestyle
              </Text>
              <View style={styles.genderRow}>
                {(['indoor', 'mixed', 'outdoor'] as const).map(next => {
                  const selected = lifestyleType === next;
                  return (
                    <Pressable
                      key={next}
                      style={[
                        styles.genderChip,
                        selected ? styles.genderChipSelected : undefined,
                      ]}
                      onPress={() => setLifestyleType(next)}
                    >
                      <Text
                        style={[
                          styles.genderChipText,
                          selected ? styles.genderChipTextSelected : undefined,
                          {
                            fontFamily: selected
                              ? fontFamilies.bold
                              : fontFamilies.medium,
                          },
                        ]}
                      >
                        {next[0].toUpperCase() + next.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View>
              <Text
                style={[
                  styles.fieldLabelSm,
                  { fontFamily: fontFamilies.semibold },
                ]}
              >
                Risk level
              </Text>
              <View style={styles.genderRow}>
                {(['low', 'medium', 'high'] as const).map(next => {
                  const selected = lifestyleRiskLevel === next;
                  return (
                    <Pressable
                      key={next}
                      style={[
                        styles.genderChip,
                        selected ? styles.genderChipSelected : undefined,
                      ]}
                      onPress={() => setLifestyleRiskLevel(next)}
                    >
                      <Text
                        style={[
                          styles.genderChipText,
                          selected ? styles.genderChipTextSelected : undefined,
                          {
                            fontFamily: selected
                              ? fontFamilies.bold
                              : fontFamilies.medium,
                          },
                        ]}
                      >
                        {next[0].toUpperCase() + next.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View>
              <Text
                style={[
                  styles.fieldLabelSm,
                  { fontFamily: fontFamilies.semibold },
                ]}
              >
                Region
              </Text>
              <View style={styles.genderRow}>
                {(['OTHER', 'IN', 'US', 'EU'] as const).map(next => {
                  const selected = region === next;
                  return (
                    <Pressable
                      key={next}
                      style={[
                        styles.genderChip,
                        selected ? styles.genderChipSelected : undefined,
                      ]}
                      onPress={() => setRegion(next)}
                    >
                      <Text
                        style={[
                          styles.genderChipText,
                          selected ? styles.genderChipTextSelected : undefined,
                          {
                            fontFamily: selected
                              ? fontFamilies.bold
                              : fontFamilies.medium,
                          },
                        ]}
                      >
                        {next}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.ctaContainer}>
          {error ? (
            <Text
              style={[styles.errorText, { fontFamily: fontFamilies.regular }]}
            >
              {error}
            </Text>
          ) : null}
          <Pressable
            style={[
              styles.ctaButton,
              { backgroundColor: colors.accent },
              !canSave ? styles.ctaButtonDisabled : undefined,
            ]}
            onPress={handleSave}
            disabled={!canSave}
            accessibilityRole="button"
          >
            <icons.paws width={18} height={18} />
            <Text style={[styles.ctaText, { fontFamily: fontFamilies.bold }]}>
              {isEditMode ? 'Save changes' : 'Save Pet Profile'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    marginBottom: spacing['6xl'],
  },
  initCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    minHeight: 884,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: colors.backgroundAlt,
  },
  headerIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.27,
    color: colors.text.heading,
    paddingRight: 48,
  },
  headerRightSpacer: {
    width: 0,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
    gap: 24,
  },
  profileImageWrap: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: colors.brandTint20,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petTypeDisplayText: {
    fontSize: 36,
    color: colors.accent,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    margin: 0,
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.backgroundAlt,
    backgroundColor: colors.accent,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadTitle: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.33,
    color: colors.text.heading,
  },
  uploadSubtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  formSection: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 24,
  },
  fieldLabel: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.heading,
    marginBottom: 8,
  },
  fieldLabelSm: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.heading,
    marginBottom: 8,
  },
  textInput: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    paddingHorizontal: 15,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.heading,
  },
  sectionLabel: {
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.27,
    color: colors.text.heading,
    marginBottom: 16,
  },
  genderRow: { flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' },
  genderChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  genderChipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  genderChipText: { fontSize: 14, lineHeight: 18, color: colors.text.secondary },
  genderChipTextSelected: { color: colors.text.inverse },
  genderClear: { paddingTop: 10, alignSelf: 'flex-start' },
  petTypeGrid: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  petTypeCard: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    overflow: 'visible',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  petTypeCardSelected: {
    borderColor: colors.accent,
  },
  petTypeImage: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  petTypeImageInner: {
    borderRadius: 12,
  },
  petTypeOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  petTypeLabel: {
    zIndex: 2,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.heading,
  },
  checkBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  errorText: {
    marginTop: 10,
    color: colors.danger,
    fontSize: 14,
    lineHeight: 18,
  },
  ctaContainer: {
    marginTop: 'auto',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
  },
  ctaButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaButtonDisabled: {
    opacity: 0.45,
  },
  ctaText: {
    color: colors.text.inverse,
    fontSize: 16,
    lineHeight: 24,
  },
});

export default AddPetScreen;
