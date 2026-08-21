import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ActionSheetIOS,
  Alert,
  InteractionManager,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { useAppTabBarInset } from '../../../../app/navigation/layout';
import type { PetsStackParamList } from '../../../../app/navigation/types';
import { trackEvent } from '../../../../infrastructure/analytics/analytics';
import { validateLastDewormingDate } from '../../../records/domain/utils/DewormingEngine';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { useAppSession } from '../../../../shared/session/useAppSession';
import { useSettingsStore } from '../../../settings/store/settingsStore';
import { petComposition } from '../../petComposition';
import { usePetStore } from '../../store/petStore';
import { pickPetPhoto } from '../../data/photos/pickPetPhoto';
import type {
  Pet,
  PetGender,
  PetLifestyleRiskLevel,
  PetLifestyleType,
  PetRegion,
  PetType,
} from '../../domain/models/Pet';
import type { PetPhotoEncodeRequest } from '../../domain/ports/PetPhotoEncoder';
import { isPetPhotoPlaceholderUri } from '../../domain/utils/petPhotoPlaceholder';
import { prefillFromOnboardingProfile } from '../../domain/utils/prefillFromOnboardingProfile';
import { icons } from '../../../../shared/assets/icons';
import { AppText } from '../../../../shared/components/AppText';
import { DatePickerField } from '../../../../shared/components/DatePickerField';
import {
  PetFieldLabel,
  PetFilledTextInput,
  PetFormSection,
  PetPhotoHero,
  PetPrimaryCta,
  PetSpeciesCards,
  type PetSpeciesOption,
} from '../../../../shared/components/petForm';
import { ScalePressable } from '../../../../shared/components/ScalePressable';
import { spacing } from '../../../../shared/theme/spacing';
import { lineHeights } from '../../../../shared/theme/typography';
import { inferDefaultPetRegion } from '../../../../shared/utils/inferDefaultPetRegion';
import { resolvePetAvatarSource } from '../../../../shared/utils/petDisplayPhoto';
import {
  computePetFormProgress,
} from '../../domain/utils/computePetFormProgress';
import {
  createPetFormSnapshot,
  petFormPhotoKey,
  petFormSnapshotsEqual,
  snapshotFromPetAndMilestones,
  type PetFormSnapshot,
} from '../../domain/utils/petFormSnapshot';
import { PetFormPsychologyChrome } from '../components/PetFormPsychologyChrome';

const suggestRiskFromLifestyle = (
  type: PetLifestyleType,
): PetLifestyleRiskLevel => {
  if (type === 'outdoor') return 'high';
  if (type === 'mixed') return 'medium';
  return 'low';
};

const planDisplayLabel = (plan: string): string => {
  if (plan === 'care_plus') return 'Care+';
  if (plan === 'family') return 'Family';
  return 'Free';
};

const SPECIES_OPTIONS: PetSpeciesOption[] = [
  { id: 'dog', label: 'Dog', kind: 'dog' },
  { id: 'cat', label: 'Cat', kind: 'cat' },
];

const ICON_PATH_BACK =
  'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z';

const PROFILE_PLACEHOLDER = '';

export {};

interface BackIconProps {
  size?: number;
  color: string;
}

const BackIcon: React.FC<BackIconProps> = ({ size = 24, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d={ICON_PATH_BACK} fill={color} />
  </Svg>
);

type SelectionChipOption = {
  id: string;
  label: string;
};

interface PetSelectionChipsProps {
  options: readonly SelectionChipOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  equalWidth?: boolean;
}

const PetSelectionChips: React.FC<PetSelectionChipsProps> = ({
  options,
  selectedId,
  onSelect,
  equalWidth = false,
}) => {
  const { colors, spacing, radius, textStyles, fontFamilies } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
          width: '100%',
        },
        chip: {
          borderRadius: radius.lg,
          borderWidth: 1,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
        },
        chipEqual: {
          flex: 1,
          minWidth: 0,
        },
        chipSelected: {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
        },
        chipIdle: {
          backgroundColor: colors.background,
          borderColor: colors.borderSubtle,
        },
        chipLabel: {
          fontFamily: fontFamilies.semibold,
          textAlign: 'center',
        },
        chipLabelSelected: {
          color: colors.text.inverse,
        },
        chipLabelIdle: {
          color: colors.text.heading,
        },
      }),
    [
      colors.accent,
      colors.background,
      colors.borderSubtle,
      colors.text.heading,
      colors.text.inverse,
      fontFamilies.semibold,
      radius.lg,
      spacing.lg,
      spacing.md,
      spacing.sm,
    ],
  );

  return (
    <View style={styles.row}>
      {options.map(option => {
        const isSelected = selectedId === option.id;

        return (
          <ScalePressable
            key={option.id}
            onPress={() => onSelect(option.id)}
            style={[
              styles.chip,
              equalWidth ? styles.chipEqual : undefined,
              isSelected ? styles.chipSelected : styles.chipIdle,
            ]}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={option.label}
          >
            <AppText
              style={[
                textStyles.control,
                styles.chipLabel,
                isSelected ? styles.chipLabelSelected : styles.chipLabelIdle,
              ]}
            >
              {option.label}
            </AppText>
          </ScalePressable>
        );
      })}
    </View>
  );
};

const YES_NO_OPTIONS: readonly SelectionChipOption[] = [
  { id: 'no', label: 'No' },
  { id: 'yes', label: 'Yes' },
];

const GENDER_OPTIONS: readonly SelectionChipOption[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
];

const LIFESTYLE_OPTIONS: readonly SelectionChipOption[] = [
  { id: 'indoor', label: 'Indoor' },
  { id: 'mixed', label: 'Mixed' },
  { id: 'outdoor', label: 'Outdoor' },
];

const RISK_OPTIONS: readonly SelectionChipOption[] = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];

const REGION_OPTIONS: readonly SelectionChipOption[] = [
  { id: 'OTHER', label: 'OTHER' },
  { id: 'IN', label: 'IN' },
  { id: 'US', label: 'US' },
  { id: 'EU', label: 'EU' },
];

export const AddPetScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<PetsStackParamList, 'AddPet'>>();
  const route = useRoute<RouteProp<PetsStackParamList, 'AddPet'>>();
  const petId = route.params?.petId;
  const isEditMode = petId != null && petId.length > 0;

  const { colors, fontFamilies, fontSizes, textStyles } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fontSizes),
    [colors, fontSizes],
  );
  const tabBarInset = useAppTabBarInset();
  const safeInsets = useSafeAreaInsets();
  const scrollBottomPad = isEditMode
    ? Math.max(safeInsets.bottom, spacing.md) + spacing.xl
    : tabBarInset + spacing.xl;
  const createPetProfile = usePetStore(s => s.createPetProfile);
  const updatePet = usePetStore(s => s.updatePet);
  const petsUsed = usePetStore(s => s.pets.length);
  const { maxPets, plan } = useAppSession();
  const onboardingProfile = useSettingsStore(
    s => s.settings?.onboardingProfile,
  );

  const initialPrefill = useMemo(
    () =>
      !isEditMode ? prefillFromOnboardingProfile(onboardingProfile) : null,
    // Only seed once from the profile present at first mount of create mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot defaults
    [isEditMode],
  );
  const prefilledFieldsRef = useRef(initialPrefill?.fieldsPrefilled ?? []);

  const [name, setName] = useState(initialPrefill?.name ?? '');
  const [petType, setPetType] = useState<PetType>(
    initialPrefill?.petType ?? 'dog',
  );
  const [breed, setBreed] = useState('');
  const [photoUri, setPhotoUri] = useState<string>(PROFILE_PLACEHOLDER);
  /** Pending compressed pick; encode on save. Null = no new pick this session. */
  const [pendingPhoto, setPendingPhoto] =
    useState<PetPhotoEncodeRequest | null>(null);
  /** True when the user removes a photo, including an existing edit photo. */
  const [photoCleared, setPhotoCleared] = useState(false);
  const [dob, setDob] = useState<string>('');
  const [gender, setGender] = useState<PetGender | ''>('');
  const [lifestyleType, setLifestyleType] =
    useState<PetLifestyleType>('indoor');
  const [lifestyleRiskLevel, setLifestyleRiskLevel] =
    useState<PetLifestyleRiskLevel>('low');
  /** When true, lifestyle changes no longer auto-adjust risk (IKEA: honor user choice). */
  const [riskTouched, setRiskTouched] = useState(false);
  const [region, setRegion] = useState<PetRegion>(() => inferDefaultPetRegion());
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [initLoading, setInitLoading] = useState(isEditMode);
  const [editBase, setEditBase] = useState<Pet | null>(null);
  const [baseline, setBaseline] = useState<PetFormSnapshot | null>(null);
  const allowLeaveRef = useRef(false);
  const createBaselineCapturedRef = useRef(false);
  /** Create: collapsed by default. Edit: opens when gender or breed exists. */
  const [showAboutSection, setShowAboutSection] = useState(false);
  /** Create: collapsed by default. Edit: opens when milestone data exists. */
  const [showHealthHistory, setShowHealthHistory] = useState(false);
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
      setShowAboutSection(false);
      setShowHealthHistory(false);
      return;
    }

    let cancelled = false;
    setInitLoading(true);

    void (async () => {
      const pet = await usePetStore.getState().getPetById(petId);
      if (cancelled) {
        return;
      }
      if (!pet) {
        setError('This pet could not be found.');
        setInitLoading(false);
        allowLeaveRef.current = true;
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
        return;
      }

      const milestones = await usePetStore
        .getState()
        .getLastHealthMilestones(pet.id);
      if (cancelled) {
        return;
      }

      setEditBase(pet);
      setName(pet.name);
      setPetType(pet.type);
      setBreed(pet.breed ?? '');
      setPhotoUri(pet.photo?.trim() ? pet.photo : PROFILE_PLACEHOLDER);
      setPendingPhoto(null);
      setPhotoCleared(false);
      setDob(pet.dob ?? '');
      setGender((pet.gender as PetGender | undefined) ?? '');
      setShowAboutSection(Boolean(pet.gender) || Boolean(pet.breed?.trim()));
      setLifestyleType(pet.lifestyle?.type ?? 'indoor');
      setLifestyleRiskLevel(pet.lifestyle?.riskLevel ?? 'low');
      setRiskTouched(true);
      setRegion(pet.region ?? 'OTHER');

      let hasAnyHealth = false;
      if (milestones.lastDewormingDate) {
        hasAnyHealth = true;
        setHasPreviousDeworming(true);
        setLastDewormingUnknown(false);
        setLastDewormingDate(milestones.lastDewormingDate);
      } else {
        setHasPreviousDeworming(false);
        setLastDewormingUnknown(false);
        setLastDewormingDate('');
      }
      if (milestones.lastVaccinationDate) {
        hasAnyHealth = true;
        setHasPreviousVaccination(true);
        setLastVaccinationUnknown(false);
        setLastVaccinationDate(milestones.lastVaccinationDate);
      } else {
        setHasPreviousVaccination(false);
        setLastVaccinationUnknown(false);
        setLastVaccinationDate('');
      }
      if (milestones.lastRabiesDate) {
        hasAnyHealth = true;
        setHasPreviousRabies(true);
        setLastRabiesUnknown(false);
        setLastRabiesDate(milestones.lastRabiesDate);
      } else {
        setHasPreviousRabies(false);
        setLastRabiesUnknown(false);
        setLastRabiesDate('');
      }
      setShowHealthHistory(hasAnyHealth);
      setBaseline(snapshotFromPetAndMilestones(pet, milestones));
      setInitLoading(false);
    })();

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

  const currentSnapshot = useMemo(
    () =>
      createPetFormSnapshot({
        name,
        petType,
        breed,
        dob,
        gender,
        lifestyleType,
        lifestyleRiskLevel,
        region,
        photoKey: petFormPhotoKey({
          pendingLocalUri: pendingPhoto?.localUri ?? null,
          photoCleared,
          photoUri,
        }),
        hasPreviousDeworming,
        lastDewormingDate,
        lastDewormingUnknown,
        hasPreviousVaccination,
        lastVaccinationDate,
        lastVaccinationUnknown,
        hasPreviousRabies,
        lastRabiesDate,
        lastRabiesUnknown,
      }),
    [
      breed,
      dob,
      gender,
      hasPreviousDeworming,
      hasPreviousRabies,
      hasPreviousVaccination,
      lastDewormingDate,
      lastDewormingUnknown,
      lastRabiesDate,
      lastRabiesUnknown,
      lastVaccinationDate,
      lastVaccinationUnknown,
      lifestyleRiskLevel,
      lifestyleType,
      name,
      pendingPhoto?.localUri,
      petType,
      photoCleared,
      photoUri,
      region,
    ],
  );

  const isDirty =
    baseline !== null && !petFormSnapshotsEqual(currentSnapshot, baseline);
  const isValid =
    trimmedName.length > 0 &&
    (isEditMode || (dob.trim().length > 0 && dobCheck.ok));
  const canSave = isValid && (isEditMode ? isDirty : true);
  const saveDisabledHint = isSaving
    ? 'Saving'
    : isEditMode && !isDirty
      ? 'No changes to save'
      : !trimmedName
        ? 'Name is required'
        : !isEditMode && (!dob.trim() || !dobCheck.ok)
          ? 'Date of birth is required'
          : undefined;

  useEffect(() => {
    if (isEditMode || createBaselineCapturedRef.current) {
      return;
    }
    createBaselineCapturedRef.current = true;
    setBaseline(currentSnapshot);
  }, [currentSnapshot, isEditMode]);

  const previousSnapshotRef = useRef(currentSnapshot);
  useEffect(() => {
    if (previousSnapshotRef.current !== currentSnapshot && error !== null) {
      setError(null);
    }
    previousSnapshotRef.current = currentSnapshot;
  }, [currentSnapshot, error]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      if (allowLeaveRef.current) {
        return;
      }
      if (isSaving) {
        e.preventDefault();
        return;
      }
      if (!isDirty) {
        return;
      }
      e.preventDefault();
      Alert.alert(
        'Discard changes?',
        'Your pet profile is not saved yet.',
        [
          { text: 'Keep editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              allowLeaveRef.current = true;
              navigation.dispatch(e.data.action);
            },
          },
        ],
      );
    });
    return unsubscribe;
  }, [isDirty, isSaving, navigation]);

  const applyLifestyle = (next: PetLifestyleType): void => {
    setLifestyleType(next);
    if (!riskTouched) {
      setLifestyleRiskLevel(suggestRiskFromLifestyle(next));
    }
  };

  const healthAnswered =
    hasPreviousDeworming ||
    hasPreviousVaccination ||
    hasPreviousRabies ||
    lastDewormingUnknown ||
    lastVaccinationUnknown ||
    lastRabiesUnknown;

  const photoFilled =
    !photoCleared &&
    (pendingPhoto !== null ||
      (!isPetPhotoPlaceholderUri(photoUri) && photoUri.length > 0));

  const formProgress = useMemo(
    () =>
      computePetFormProgress({
        nameFilled: trimmedName.length > 0,
        dobFilled: dob.trim().length > 0 && dobCheck.ok,
        genderFilled: gender !== '',
        breedFilled: breed.trim().length > 0,
        photoFilled,
        healthAnswered,
        // Smart defaults already applied: species, lifestyle, risk, region.
        defaultsApplied: 4,
      }),
    [
      breed,
      dob,
      dobCheck.ok,
      gender,
      healthAnswered,
      photoFilled,
      trimmedName.length,
    ],
  );

  const lockedInCount = useMemo(() => {
    let n = 0;
    if (trimmedName.length > 0) n += 1;
    if (dob.trim().length > 0 && dobCheck.ok) n += 1;
    if (gender !== '') n += 1;
    if (breed.trim().length > 0) n += 1;
    if (photoFilled) n += 1;
    if (healthAnswered) n += 1;
    return n;
  }, [
    breed,
    dob,
    dobCheck.ok,
    gender,
    healthAnswered,
    photoFilled,
    trimmedName.length,
  ]);

  const handlePick = async (source: 'camera' | 'library'): Promise<void> => {
    try {
      const picked = await pickPetPhoto(source);
      if (!picked) {
        return;
      }
      setPendingPhoto(picked);
      setPhotoUri(picked.localUri);
      setPhotoCleared(false);
      setError(null);
    } catch (pickError) {
      const message =
        pickError instanceof Error
          ? pickError.message
          : 'Could not open the photo picker.';
      if (message === 'PERMISSION_DENIED') {
        Alert.alert(
          source === 'camera' ? 'Camera access needed' : 'Photo access needed',
          source === 'camera'
            ? 'Allow camera access in Settings so you can take a pet photo.'
            : 'Allow photo access in Settings to add a pet photo.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                Linking.openSettings().catch(() => undefined);
              },
            },
          ],
        );
        return;
      }
      setError(message);
    }
  };

  /**
   * Android crashes / fails if we start Camera / Photo Picker (or a second
   * permission dialog) in the same tick as Alert/ActionSheet dismissal.
   * Wait for interactions + a short delay so the host Activity is stable.
   */
  const enqueuePhotoPick = (source: 'camera' | 'library'): void => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        handlePick(source).catch(() => undefined);
      }, Platform.OS === 'android' ? 350 : 0);
    });
  };

  const removePhoto = (): void => {
    setPhotoUri(PROFILE_PLACEHOLDER);
    setPendingPhoto(null);
    setPhotoCleared(true);
    setError(null);
  };

  const openPhotoOptions = (): void => {
    if (Platform.OS === 'ios') {
      const options = photoFilled
        ? ['Take photo', 'Choose from library', 'Remove photo', 'Cancel']
        : ['Take photo', 'Choose from library', 'Cancel'];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: photoFilled ? 2 : undefined,
          title: 'Pet photo',
        },
        selectedIndex => {
          if (selectedIndex === 0) {
            enqueuePhotoPick('camera');
          } else if (selectedIndex === 1) {
            enqueuePhotoPick('library');
          } else if (photoFilled && selectedIndex === 2) {
            removePhoto();
          }
        },
      );
      return;
    }

    Alert.alert(
      'Pet photo',
      'Choose a photo option',
      photoFilled
        ? [
            {
              text: 'Take photo',
              onPress: () => {
                enqueuePhotoPick('camera');
              },
            },
            {
              text: 'Choose from library',
              onPress: () => {
                enqueuePhotoPick('library');
              },
            },
            {
              text: 'More…',
              onPress: () => {
                Alert.alert('More photo options', undefined, [
                  {
                    text: 'Remove photo',
                    style: 'destructive',
                    onPress: removePhoto,
                  },
                  { text: 'Cancel', style: 'cancel' },
                ]);
              },
            },
          ]
        : [
            {
              text: 'Take photo',
              onPress: () => {
                enqueuePhotoPick('camera');
              },
            },
            {
              text: 'Choose from library',
              onPress: () => {
                enqueuePhotoPick('library');
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ],
    );
  };

  const resolvePhotoForSave = async (): Promise<
    | { ok: true; photo: string | undefined }
    | { ok: false; errorMessage: string }
  > => {
    if (photoCleared) {
      return { ok: true, photo: undefined };
    }
    if (pendingPhoto) {
      const prepared = await petComposition.preparePetPhoto.execute(pendingPhoto);
      if (!prepared.ok) {
        return { ok: false, errorMessage: prepared.errorMessage };
      }
      return { ok: true, photo: prepared.photo };
    }
    if (!isPetPhotoPlaceholderUri(photoUri) && photoUri.length > 0) {
      return { ok: true, photo: photoUri };
    }
    return { ok: true, photo: undefined };
  };

  const performEditSave = async (): Promise<void> => {
    if (!editBase) {
      return;
    }
    setIsSaving(true);
    setError(null);
    const resolvedPhoto = await resolvePhotoForSave();
    if (!resolvedPhoto.ok) {
      setIsSaving(false);
      setError(resolvedPhoto.errorMessage);
      return;
    }
    const result = await updatePet({
      ...editBase,
      name: trimmedName,
      type: petType,
      breed: breed.trim() || undefined,
      photo: resolvedPhoto.photo,
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
      setIsSaving(false);
      setError(result.error ?? 'Unable to save changes.');
      return;
    }
    void trackEvent('pet_profile_updated', { pet_type: petType });
    setIsSaving(false);
    allowLeaveRef.current = true;
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleSave = async () => {
    setError(null);
    if (!canSave) {
      if (isEditMode && !isDirty) {
        return;
      }
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

    setIsSaving(true);

    if (isEditMode && editBase) {
      if (dob.trim().length > 0) {
        const check = parseAndValidateDob(dob);
        if (!check.ok) {
          setIsSaving(false);
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
            setIsSaving(false);
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
            setIsSaving(false);
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
            setIsSaving(false);
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
      // isSaving is handled inside performEditSave
      return;
    }

    const resolvedPhoto = await resolvePhotoForSave();
    if (!resolvedPhoto.ok) {
      setIsSaving(false);
      setError(resolvedPhoto.errorMessage);
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
      photo: resolvedPhoto.photo,
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
      setIsSaving(false);
      if (result.error === 'PET_LIMIT') {
        navigation.navigate('Paywall', {
          source: 'pet_limit',
          lossContext: {
            draftPetName: trimmedName || undefined,
            petsUsed,
            maxPets,
          },
        });
        return;
      }
      setError(toFriendlyAddPetError(result.error));
      return;
    }
    void trackEvent('pet_profile_created', {
      pet_type: petType,
      has_breed: Boolean(breed.trim()),
      lifestyle_type: lifestyleType,
      region,
    });
    if (prefilledFieldsRef.current.length > 0) {
      const fieldsEdited: string[] = [];
      if (
        prefilledFieldsRef.current.includes('name') &&
        name.trim() !== (initialPrefill?.name ?? '')
      ) {
        fieldsEdited.push('name');
      }
      if (
        prefilledFieldsRef.current.includes('petType') &&
        petType !== (initialPrefill?.petType ?? 'dog')
      ) {
        fieldsEdited.push('petType');
      }
      void trackEvent('post_onboarding_prefill_used', {
        fields_prefilled: prefilledFieldsRef.current.join(','),
        fields_edited: fieldsEdited.join(','),
      });
    }
    setIsSaving(false);
    allowLeaveRef.current = true;
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const photoCaption = trimmedName
    ? `We can't wait to meet ${trimmedName}!`
    : undefined;

  const photoHeroPlaceholder =
    petType === 'dog' ? (
      <icons.dogIcon width={80} height={80} />
    ) : (
      <icons.catIcon width={80} height={80} />
    );

  const photoHeroSource = photoFilled
    ? resolvePetAvatarSource({
        type: petType,
        photo: photoUri,
      })
    : undefined;

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
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: colors.backgroundAlt }]}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.headerIconButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <BackIcon size={24} color={colors.text.heading} />
        </Pressable>
        {isEditMode ? (
          <Pressable
            style={styles.headerSaveButton}
            onPress={() => {
              handleSave().catch(() => undefined);
            }}
            disabled={!canSave || isSaving}
            accessibilityRole="button"
            accessibilityLabel="Save"
            accessibilityHint={saveDisabledHint}
            accessibilityState={{
              disabled: !canSave || isSaving,
              busy: isSaving,
            }}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <AppText
                style={[
                  textStyles.control,
                  styles.headerSaveText,
                  {
                    color: canSave ? colors.accent : colors.text.subdued,
                    fontFamily: fontFamilies.semibold,
                  },
                ]}
              >
                Save
              </AppText>
            )}
          </Pressable>
        ) : (
          <View style={styles.headerSaveButton} />
        )}
      </View>

      {error && isEditMode ? (
        <Text
          style={[
            styles.errorText,
            styles.errorBanner,
            { fontFamily: fontFamilies.regular },
          ]}
        >
          {error}
        </Text>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: scrollBottomPad },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.foldSection}>
          <View style={styles.titleBlock}>
            <Text
              style={[
                styles.foldTitle,
                { fontFamily: fontFamilies.extrabold },
              ]}
              accessibilityRole="header"
              accessibilityLabel={
                isEditMode ? 'Edit your pet.' : 'Tell us about your pet.'
              }
            >
              {isEditMode ? (
                <>
                  Edit{' '}
                  <Text
                    style={[
                      styles.foldTitleAccent,
                      { fontFamily: fontFamilies.extrabold },
                    ]}
                  >
                    your pet.
                  </Text>
                </>
              ) : (
                <>
                  Tell us about{' '}
                  <Text
                    style={[
                      styles.foldTitleAccent,
                      { fontFamily: fontFamilies.extrabold },
                    ]}
                  >
                    your pet.
                  </Text>
                </>
              )}
            </Text>
            <AppText style={[textStyles.marketingLead, styles.foldSubtitle]}>
              Let&apos;s get the basics down so we can tailor their experience.
            </AppText>
          </View>

          <PetFormPsychologyChrome
            variant="compact"
            isEditMode={isEditMode}
            petsUsed={petsUsed}
            maxPets={maxPets}
            planLabel={planDisplayLabel(plan)}
            progress={formProgress}
            lockedInCount={lockedInCount}
            petDisplayName={trimmedName}
          />

          <View style={styles.heroSection}>
            <PetPhotoHero
              photoSource={photoHeroSource}
              placeholder={photoHeroPlaceholder}
              caption={photoCaption}
              onPressCamera={openPhotoOptions}
              accessibilityLabel={
                photoFilled ? 'Change pet photo' : 'Add pet photo'
              }
            />
          </View>
        </View>

        <View style={styles.formColumn}>
          <PetFormSection title="Basics">
            <View style={styles.sectionBody}>
              <View style={styles.foldField}>
                <PetFieldLabel>PET NAME</PetFieldLabel>
                <PetFilledTextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your pet's name"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.foldField}>
                <PetFieldLabel>SPECIES</PetFieldLabel>
                <PetSpeciesCards
                  options={SPECIES_OPTIONS}
                  value={petType}
                  onChange={next => setPetType(next as PetType)}
                />
              </View>

              <View style={styles.foldField}>
                <PetFieldLabel>DATE OF BIRTH</PetFieldLabel>
                <DatePickerField
                  value={dob}
                  onChange={setDob}
                  placeholder="YYYY-MM-DD"
                  maximumDate={today}
                  inset
                />
              </View>
            </View>
          </PetFormSection>

          <PetFormSection
            title="About"
            optional
            collapsible
            expanded={showAboutSection}
            collapsedSummary="Gender and breed"
            onToggle={() => setShowAboutSection(v => !v)}
          >
            <View style={styles.sectionBody}>
              <View style={styles.advancedField}>
                <PetFieldLabel>GENDER</PetFieldLabel>
                <PetSelectionChips
                  options={GENDER_OPTIONS}
                  selectedId={gender}
                  onSelect={next => setGender(next as PetGender)}
                  equalWidth
                />
                {gender !== '' ? (
                  <ScalePressable
                    onPress={() => setGender('')}
                    style={styles.linkAction}
                    accessibilityRole="button"
                    accessibilityLabel="Clear gender selection"
                  >
                    <AppText
                      style={[
                        textStyles.caption,
                        styles.linkActionText,
                        { color: colors.text.subdued },
                      ]}
                    >
                      Clear
                    </AppText>
                  </ScalePressable>
                ) : null}
              </View>

              <View style={styles.advancedField}>
                <PetFieldLabel>BREED</PetFieldLabel>
                <PetFilledTextInput
                  value={breed}
                  onChangeText={setBreed}
                  placeholder="e.g. Golden Retriever"
                  autoCapitalize="words"
                />
              </View>
            </View>
          </PetFormSection>

          <PetFormSection title="Lifestyle">
            <View style={styles.sectionBody}>
            <View style={styles.advancedField}>
              <PetFieldLabel>LIFESTYLE</PetFieldLabel>
              <PetSelectionChips
                options={LIFESTYLE_OPTIONS}
                selectedId={lifestyleType}
                onSelect={next => applyLifestyle(next as PetLifestyleType)}
                equalWidth
              />
              {!riskTouched ? (
                <AppText
                  style={[
                    textStyles.caption,
                    styles.fieldHint,
                    { color: colors.text.subdued, marginBottom: 0 },
                  ]}
                >
                  Risk suggested from lifestyle. Change it anytime.
                </AppText>
              ) : null}
            </View>
            <View style={styles.advancedField}>
              <PetFieldLabel>RISK LEVEL</PetFieldLabel>
              <PetSelectionChips
                options={RISK_OPTIONS}
                selectedId={lifestyleRiskLevel}
                onSelect={next => {
                  setRiskTouched(true);
                  setLifestyleRiskLevel(next as PetLifestyleRiskLevel);
                }}
                equalWidth
              />
            </View>
            <View style={styles.advancedField}>
              <PetFieldLabel>REGION</PetFieldLabel>
              <PetSelectionChips
                options={REGION_OPTIONS}
                selectedId={region}
                onSelect={next => setRegion(next as PetRegion)}
              />
            </View>
            </View>
          </PetFormSection>

          <PetFormSection
            title="Health"
            optional
            collapsible
            expanded={showHealthHistory}
            collapsedSummary={
              isEditMode
                ? 'Vaccine and deworming dates'
                : 'Add later. We still set up a smart care schedule.'
            }
            onToggle={() => setShowHealthHistory(v => !v)}
          >
            <View style={styles.healthHistoryFields}>
                <View style={styles.advancedField}>
                  <PetFieldLabel>PREVIOUS DEWORMING?</PetFieldLabel>
                  <AppText
                    style={[
                      styles.fieldHint,
                      textStyles.caption,
                      { color: colors.text.subdued },
                    ]}
                  >
                    Deworming clears intestinal worms that can cause weight loss
                    or diarrhoea. Most pets need it every 1–3 months.
                  </AppText>
                  <PetSelectionChips
                    options={YES_NO_OPTIONS}
                    selectedId={hasPreviousDeworming ? 'yes' : 'no'}
                    onSelect={next => {
                      if (next === 'yes') {
                        setHasPreviousDeworming(true);
                        return;
                      }
                      setHasPreviousDeworming(false);
                      setLastDewormingDate('');
                      setLastDewormingUnknown(false);
                    }}
                    equalWidth
                  />
                  {hasPreviousDeworming ? (
                    <View style={styles.nestedFieldGroup}>
                      <ScalePressable
                        onPress={() => {
                          setLastDewormingUnknown(v => {
                            const next = !v;
                            if (next) {
                              setLastDewormingDate('');
                            }
                            return next;
                          });
                        }}
                        style={styles.linkAction}
                        accessibilityRole="button"
                        accessibilityState={{ selected: lastDewormingUnknown }}
                        accessibilityLabel="I don't know the deworming date"
                      >
                        <AppText
                          style={[
                            textStyles.caption,
                            styles.linkActionText,
                            {
                              color: lastDewormingUnknown
                                ? colors.accent
                                : colors.text.subdued,
                            },
                          ]}
                        >
                          I don&apos;t know the date
                        </AppText>
                      </ScalePressable>
                      {!lastDewormingUnknown ? (
                        <View style={styles.advancedField}>
                          <PetFieldLabel>LAST DEWORMING DATE</PetFieldLabel>
                          <DatePickerField
                            value={lastDewormingDate}
                            onChange={setLastDewormingDate}
                            placeholder="YYYY-MM-DD"
                            maximumDate={today}
                            inset
                          />
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>

                <View style={styles.advancedField}>
                  <PetFieldLabel>PREVIOUS VACCINATIONS?</PetFieldLabel>
                  <AppText
                    style={[
                      styles.fieldHint,
                      textStyles.caption,
                      { color: colors.text.subdued },
                    ]}
                  >
                    Core vaccines (DHPP for dogs, FVRCP for cats) protect against
                    serious illnesses. Enter the last dose date if you know it.
                  </AppText>
                  <PetSelectionChips
                    options={YES_NO_OPTIONS}
                    selectedId={hasPreviousVaccination ? 'yes' : 'no'}
                    onSelect={next => {
                      if (next === 'yes') {
                        setHasPreviousVaccination(true);
                        return;
                      }
                      setHasPreviousVaccination(false);
                      setLastVaccinationDate('');
                      setLastVaccinationUnknown(false);
                      setHasPreviousRabies(false);
                      setLastRabiesDate('');
                      setLastRabiesUnknown(false);
                    }}
                    equalWidth
                  />
                  {hasPreviousVaccination ? (
                    <View style={styles.nestedFieldGroup}>
                      <ScalePressable
                        onPress={() => {
                          setLastVaccinationUnknown(v => {
                            const next = !v;
                            if (next) {
                              setLastVaccinationDate('');
                            }
                            return next;
                          });
                        }}
                        style={styles.linkAction}
                        accessibilityRole="button"
                        accessibilityState={{
                          selected: lastVaccinationUnknown,
                        }}
                        accessibilityLabel="I don't know the vaccination date"
                      >
                        <AppText
                          style={[
                            textStyles.caption,
                            styles.linkActionText,
                            {
                              color: lastVaccinationUnknown
                                ? colors.accent
                                : colors.text.subdued,
                            },
                          ]}
                        >
                          I don&apos;t know the date
                        </AppText>
                      </ScalePressable>
                      {!lastVaccinationUnknown ? (
                        <View style={styles.advancedField}>
                          <PetFieldLabel>LAST VACCINATION DATE</PetFieldLabel>
                          <DatePickerField
                            value={lastVaccinationDate}
                            onChange={setLastVaccinationDate}
                            placeholder="YYYY-MM-DD"
                            maximumDate={today}
                            inset
                          />
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>

                <View style={styles.advancedField}>
                  <PetFieldLabel>PREVIOUS RABIES VACCINE?</PetFieldLabel>
                  <AppText
                    style={[
                      styles.fieldHint,
                      textStyles.caption,
                      { color: colors.text.subdued },
                    ]}
                  >
                    Rabies vaccine is required in India. It protects against a
                    fatal disease that can spread to humans.
                  </AppText>
                  <PetSelectionChips
                    options={YES_NO_OPTIONS}
                    selectedId={hasPreviousRabies ? 'yes' : 'no'}
                    onSelect={next => {
                      if (next === 'yes') {
                        setHasPreviousRabies(true);
                        return;
                      }
                      setHasPreviousRabies(false);
                      setLastRabiesDate('');
                      setLastRabiesUnknown(false);
                    }}
                    equalWidth
                  />
                  {hasPreviousRabies ? (
                    <View style={styles.nestedFieldGroup}>
                      <ScalePressable
                        onPress={() => {
                          setLastRabiesUnknown(v => {
                            const next = !v;
                            if (next) {
                              setLastRabiesDate('');
                            }
                            return next;
                          });
                        }}
                        style={styles.linkAction}
                        accessibilityRole="button"
                        accessibilityState={{ selected: lastRabiesUnknown }}
                        accessibilityLabel="I don't know the rabies vaccine date"
                      >
                        <AppText
                          style={[
                            textStyles.caption,
                            styles.linkActionText,
                            {
                              color: lastRabiesUnknown
                                ? colors.accent
                                : colors.text.subdued,
                            },
                          ]}
                        >
                          I don&apos;t know the date
                        </AppText>
                      </ScalePressable>
                      {!lastRabiesUnknown ? (
                        <View style={styles.advancedField}>
                          <PetFieldLabel>LAST RABIES VACCINE DATE</PetFieldLabel>
                          <DatePickerField
                            value={lastRabiesDate}
                            onChange={setLastRabiesDate}
                            placeholder="YYYY-MM-DD"
                            maximumDate={today}
                            inset
                          />
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
          </PetFormSection>
        </View>

        {!isEditMode ? (
          <View style={styles.ctaContainer}>
            {error ? (
              <Text
                style={[styles.errorText, { fontFamily: fontFamilies.regular }]}
              >
                {error}
              </Text>
            ) : null}
            <PetPrimaryCta
              title="Complete Profile"
              onPress={() => {
                handleSave().catch(() => undefined);
              }}
              loading={isSaving}
              disabled={!canSave}
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (
  colors: ReturnType<typeof useTheme>['colors'],
  fontSizes: ReturnType<typeof useTheme>['fontSizes'],
) =>
  StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
  },
  initCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.backgroundAlt,
  },
  headerIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSaveButton: {
    minHeight: 48,
    minWidth: 64,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSaveText: {
    textAlign: 'right',
  },
  errorBanner: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    marginTop: 0,
  },
  foldSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  titleBlock: {
    gap: spacing.xs,
  },
  foldTitle: {
    fontSize: fontSizes['2xl'],
    lineHeight: lineHeights['2xl'],
    color: colors.text.heading,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  foldTitleAccent: {
    color: colors.accent,
  },
  foldSubtitle: {
    color: colors.text.body,
    textAlign: 'center',
  },
  heroSection: {
    alignItems: 'center',
  },
  foldField: {
    gap: spacing.sm,
  },
  formColumn: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  sectionBody: {
    gap: spacing.lg,
  },
  advancedField: {
    gap: spacing.sm,
  },
  nestedFieldGroup: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  linkAction: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  linkActionText: {
    fontFamily: undefined,
  },
  fieldHint: {
    marginTop: -spacing.xs,
    marginBottom: spacing.xs,
  },
  healthHistoryFields: {
    gap: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 18,
  },
  ctaContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
});

export default AddPetScreen;
