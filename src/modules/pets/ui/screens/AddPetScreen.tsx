import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ActionSheetIOS,
  Alert,
  Linking,
  Platform,
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

import { trackEvent } from '../../../../infrastructure/analytics/analytics';
import type { PetsStackParamList } from '../../../../app/navigation/types';
import { validateLastDewormingDate } from '../../../records/domain/utils/DewormingEngine';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { useSubscriptionStore } from '../../../subscription/store/subscriptionStore';
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
  PetPhotoHero,
  PetPrimaryCta,
  PetSpeciesCards,
  type PetSpeciesOption,
} from '../../../../shared/components/petForm';
import { spacing } from '../../../../shared/theme/spacing';
import { lineHeights } from '../../../../shared/theme/typography';
import { inferDefaultPetRegion } from '../../../../shared/utils/inferDefaultPetRegion';
import { resolvePetAvatarSource } from '../../../../shared/utils/petDisplayPhoto';
import {
  computePetFormProgress,
} from '../../domain/utils/computePetFormProgress';
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
  const createPetProfile = usePetStore(s => s.createPetProfile);
  const updatePet = usePetStore(s => s.updatePet);
  const petsUsed = usePetStore(s => s.pets.length);
  const entitlement = useSubscriptionStore(s => s.entitlement);
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
      setShowHealthHistory(false);
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
        setPendingPhoto(null);
        setPhotoCleared(false);
        setDob(pet.dob ?? '');
        setGender((pet.gender as PetGender | undefined) ?? '');
        setLifestyleType(pet.lifestyle?.type ?? 'indoor');
        setLifestyleRiskLevel(pet.lifestyle?.riskLevel ?? 'low');
        setRiskTouched(true);
        setRegion(pet.region ?? 'OTHER');
        void usePetStore
          .getState()
          .getLastHealthMilestones(pet.id)
          .then(milestones => {
            if (cancelled) return;
            let hasAny = false;
            if (milestones.lastDewormingDate) {
              hasAny = true;
              setHasPreviousDeworming(true);
              setLastDewormingUnknown(false);
              setLastDewormingDate(milestones.lastDewormingDate);
            }
            if (milestones.lastVaccinationDate) {
              hasAny = true;
              setHasPreviousVaccination(true);
              setLastVaccinationUnknown(false);
              setLastVaccinationDate(milestones.lastVaccinationDate);
            }
            if (milestones.lastRabiesDate) {
              hasAny = true;
              setHasPreviousRabies(true);
              setLastRabiesUnknown(false);
              setLastRabiesDate(milestones.lastRabiesDate);
            }
            if (hasAny) {
              setShowHealthHistory(true);
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
          'Photo access needed',
          'Allow photo access in Settings to add a pet photo.',
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
            handlePick('camera').catch(() => undefined);
          } else if (selectedIndex === 1) {
            handlePick('library').catch(() => undefined);
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
                handlePick('camera').catch(() => undefined);
              },
            },
            {
              text: 'Choose from library',
              onPress: () => {
                handlePick('library').catch(() => undefined);
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
                handlePick('camera').catch(() => undefined);
              },
            },
            {
              text: 'Choose from library',
              onPress: () => {
                handlePick('library').catch(() => undefined);
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
            maxPets: entitlement.maxPets,
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
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BackIcon size={24} color={colors.text.heading} />
          </Pressable>
        </View>

        <View style={styles.foldSection}>
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

          <View style={styles.entitlementWrap}>
            <PetFormPsychologyChrome
              isEditMode={isEditMode}
              petsUsed={petsUsed}
              maxPets={entitlement.maxPets}
              planLabel={planDisplayLabel(entitlement.plan)}
              progress={formProgress}
              lockedInCount={lockedInCount}
              petDisplayName={trimmedName}
            />
          </View>

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
            />
          </View>
        </View>

        <View style={styles.formSection}>
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

          <View style={styles.healthHistoryBlock}>
            <Pressable
              onPress={() => setShowHealthHistory(v => !v)}
              style={styles.healthHistoryToggle}
              accessibilityRole="button"
              accessibilityState={{ expanded: showHealthHistory }}
              accessibilityLabel="Add vaccine and deworming history (optional)"
            >
              <Text
                style={[
                  styles.healthHistoryToggleText,
                  { fontFamily: fontFamilies.semibold, color: colors.accent },
                ]}
              >
                {showHealthHistory
                  ? 'Hide vaccine & deworming history'
                  : 'Add vaccine & deworming history (optional)'}
              </Text>
              <Text
                style={{
                  fontFamily: fontFamilies.medium,
                  color: colors.text.subdued,
                  fontSize: 12,
                }}
              >
                {showHealthHistory ? '▲' : '▼'}
              </Text>
            </Pressable>
            {!showHealthHistory && !isEditMode ? (
              <Text
                style={[
                  styles.fieldHint,
                  {
                    color: colors.text.subdued,
                    fontFamily: fontFamilies.regular,
                    marginBottom: 0,
                  },
                ]}
              >
                You can add this later from the pet profile. We&apos;ll still set
                up a smart care schedule.
              </Text>
            ) : null}

            {showHealthHistory ? (
              <View style={styles.healthHistoryFields}>
                <View>
                  <Text
                    style={[
                      styles.fieldLabelSm,
                      { fontFamily: fontFamilies.semibold },
                    ]}
                  >
                    Has your pet been dewormed before?
                  </Text>
                  <Text
                    style={[
                      styles.fieldHint,
                      {
                        color: colors.text.subdued,
                        fontFamily: fontFamilies.regular,
                      },
                    ]}
                  >
                    Deworming clears intestinal worms that can cause weight loss
                    or diarrhoea. Most pets need it every 1–3 months.
                  </Text>
                  <View style={styles.genderRow}>
                    <Pressable
                      style={[
                        styles.genderChip,
                        !hasPreviousDeworming
                          ? styles.genderChipSelected
                          : undefined,
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
                        hasPreviousDeworming
                          ? styles.genderChipSelected
                          : undefined,
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
                    style={[
                      styles.fieldLabelSm,
                      { fontFamily: fontFamilies.semibold },
                    ]}
                  >
                    Has your pet received vaccinations before?
                  </Text>
                  <Text
                    style={[
                      styles.fieldHint,
                      {
                        color: colors.text.subdued,
                        fontFamily: fontFamilies.regular,
                      },
                    ]}
                  >
                    Core vaccines (DHPP for dogs, FVRCP for cats) protect against
                    serious illnesses. Enter the last dose date if you know it.
                  </Text>
                  <View style={styles.genderRow}>
                    <Pressable
                      style={[
                        styles.genderChip,
                        !hasPreviousVaccination
                          ? styles.genderChipSelected
                          : undefined,
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
                      accessibilityState={{
                        selected: !hasPreviousVaccination,
                      }}
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
                        hasPreviousVaccination
                          ? styles.genderChipSelected
                          : undefined,
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
                    style={[
                      styles.fieldLabelSm,
                      { fontFamily: fontFamilies.semibold },
                    ]}
                  >
                    Has your pet received rabies vaccine?
                  </Text>
                  <Text
                    style={[
                      styles.fieldHint,
                      {
                        color: colors.text.subdued,
                        fontFamily: fontFamilies.regular,
                      },
                    ]}
                  >
                    Rabies vaccine is required in India. It protects against a
                    fatal disease that can spread to humans.
                  </Text>
                  <View style={styles.genderRow}>
                    <Pressable
                      style={[
                        styles.genderChip,
                        !hasPreviousRabies
                          ? styles.genderChipSelected
                          : undefined,
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
                          !hasPreviousRabies
                            ? styles.genderChipTextSelected
                            : undefined,
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
                        hasPreviousRabies
                          ? styles.genderChipSelected
                          : undefined,
                      ]}
                      onPress={() => setHasPreviousRabies(true)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: hasPreviousRabies }}
                    >
                      <Text
                        style={[
                          styles.genderChipText,
                          hasPreviousRabies
                            ? styles.genderChipTextSelected
                            : undefined,
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
                            color: lastRabiesUnknown
                              ? colors.accent
                              : colors.text.subdued,
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
              </View>
            ) : null}
          </View>

          <View style={{ gap: 14 }}>
            <View>
              <Text
                style={[styles.sectionLabel, { fontFamily: fontFamilies.bold }]}
              >
                Lifestyle & region
              </Text>
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
                      onPress={() => applyLifestyle(next)}
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
              {!riskTouched ? (
                <Text
                  style={{
                    marginTop: spacing.xs,
                    fontSize: 12,
                    color: colors.text.subdued,
                    fontFamily: fontFamilies.medium,
                  }}
                >
                  Risk suggested from lifestyle. Change it anytime.
                </Text>
              ) : null}
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
                      onPress={() => {
                        setRiskTouched(true);
                        setLifestyleRiskLevel(next);
                      }}
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
          <PetPrimaryCta
            title={isEditMode ? 'Save Changes' : 'Complete Profile'}
            onPress={() => {
              handleSave().catch(() => undefined);
            }}
            loading={isSaving}
            disabled={!canSave}
          />
        </View>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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
  foldSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.xl,
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
    marginTop: -spacing.md,
    color: colors.text.body,
    textAlign: 'center',
  },
  entitlementWrap: {
    marginTop: -spacing.sm,
  },
  heroSection: {
    alignItems: 'center',
  },
  foldField: {
    gap: spacing.sm,
  },
  formSection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xl,
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
  fieldHint: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
    marginTop: -4,
  },
  healthHistoryBlock: {
    gap: 10,
  },
  healthHistoryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  healthHistoryToggleText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
    paddingRight: 8,
  },
  healthHistoryFields: {
    gap: 24,
    paddingTop: 4,
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
  errorText: {
    marginTop: 10,
    color: colors.danger,
    fontSize: 14,
    lineHeight: 18,
  },
  ctaContainer: {
    marginTop: 'auto',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing['3xl'],
    gap: spacing.sm,
  },
});

export default AddPetScreen;
