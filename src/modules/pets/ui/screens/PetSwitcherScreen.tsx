import React, { useCallback, useMemo } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import type { PetProfileRootNavigation } from '../../../../app/navigation/types';
import { useAppTabBarInset } from '../../../../app/navigation/layout';
import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { resolvePetAvatarSource } from '../../../../shared/utils/petDisplayPhoto';
import type { Pet } from '../../domain/models/Pet';
import { formatPetAgeLabel } from '../../domain/utils/petDobDisplay';
import { usePetStore } from '../../store/petStore';

function petTypeLabel(type: Pet['type'] | undefined): string {
  if (type === 'cat') return 'Cat';
  if (type === 'dog') return 'Dog';
  return 'Pet';
}

export const PetSwitcherScreen: React.FC = () => {
  const navigation = useNavigation<PetProfileRootNavigation>();
  const theme = useTheme();
  const {
    colors,
    textStyles,
    fontFamilies,
    spacing,
    radius,
    shadows,
  } = theme;
  const tabBarInset = useAppTabBarInset();
  const pets = usePetStore(s => s.pets);
  const activePet = usePetStore(s => s.activePet);
  const setActivePet = usePetStore(s => s.setActivePet);
  const deletePet = usePetStore(s => s.deletePet);

  const handleDelete = useCallback(
    (pet: Pet): void => {
      Alert.alert('Delete pet?', `Delete ${pet.name} and related records?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deletePet(pet.id).then(result => {
              if (!result.success) {
                Alert.alert(
                  'Could not delete',
                  result.error ??
                    'Try again when you have a stable connection.',
                );
              }
            });
          },
        },
      ]);
    },
    [deletePet],
  );

  const handleSelect = useCallback(
    (petId: string): void => {
      void setActivePet(petId);
      navigation.goBack();
    },
    [navigation, setActivePet],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1 },
        body: { flex: 1 },
        well: {
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
        topRow: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        iconBtn: {
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
        },
        titleBlock: {
          flex: 1,
          minWidth: 0,
        },
        listContent: {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
        },
        card: {
          borderWidth: 1,
          flexDirection: 'column',
        },
        cardTop: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        avatar: {
          width: 56,
          height: 56,
          resizeMode: 'cover',
        },
        cardCopy: {
          flex: 1,
          minWidth: 0,
        },
        nameRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        activePill: {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xxs,
        },
        rule: {
          height: StyleSheet.hairlineWidth,
        },
        foot: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
        },
        ghostBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          minHeight: 44,
          paddingHorizontal: spacing.sm,
        },
        primaryCta: {
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 44,
          paddingHorizontal: spacing.md,
        },
        addCard: {
          borderWidth: 1,
          borderStyle: 'dashed',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          minHeight: 88,
        },
        emptyCard: {
          borderWidth: 1,
          alignItems: 'center',
          gap: spacing.md,
        },
      }),
    [spacing],
  );

  const renderPetCard = useCallback(
    ({ item }: { item: Pet }) => {
      const isActive = activePet?.id === item.id;
      const ageLabel = formatPetAgeLabel(item.dob);
      const metaParts = [
        petTypeLabel(item.type),
        item.breed?.trim() || null,
        ageLabel !== 'Not set' ? ageLabel : null,
      ].filter(Boolean);

      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Switch to ${item.name}`}
          accessibilityState={{ selected: isActive }}
          onPress={() => handleSelect(item.id)}
          style={({ pressed }) => [
            styles.card,
            isActive ? shadows.md : shadows.sm,
            {
              borderRadius: radius.xl,
              backgroundColor: isActive ? colors.brandTint12 : colors.surface,
              borderColor: isActive ? colors.brandTint12 : colors.borderSubtle,
              padding: spacing.lg,
              gap: spacing.md,
              marginBottom: spacing.md,
              opacity: pressed ? 0.94 : 1,
            },
          ]}
        >
          <View style={[styles.cardTop, { gap: spacing.sm }]}>
            <Image
              source={resolvePetAvatarSource(item)}
              accessible={false}
              importantForAccessibility="no"
              style={[
                styles.avatar,
                {
                  borderRadius: radius.md,
                  borderWidth: isActive ? 2 : 0,
                  borderColor: colors.accent,
                },
              ]}
              accessibilityIgnoresInvertColors
            />
            <View style={styles.cardCopy}>
              <View style={styles.nameRow}>
                <AppText
                  style={[
                    textStyles.subtitle,
                    {
                      color: colors.text.heading,
                      fontFamily: fontFamilies.bold,
                      flexShrink: 1,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </AppText>
                {isActive ? (
                  <View
                    style={[
                      styles.activePill,
                      {
                        backgroundColor: colors.successSurface,
                        borderRadius: radius.pill,
                      },
                    ]}
                  >
                    <AppText
                      style={[
                        textStyles.footer,
                        {
                          color: colors.success,
                          fontFamily: fontFamilies.bold,
                        },
                      ]}
                    >
                      Active
                    </AppText>
                  </View>
                ) : null}
              </View>
              <AppText
                style={[
                  textStyles.caption,
                  {
                    color: colors.text.secondary,
                    marginTop: spacing.xxs,
                  },
                ]}
                numberOfLines={1}
              >
                {metaParts.join(' · ')}
              </AppText>
            </View>
          </View>

          <View
            style={[styles.rule, { backgroundColor: colors.borderSubtle }]}
          />

          <View style={styles.foot}>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit ${item.name}`}
                hitSlop={4}
                onPress={() =>
                  navigation.navigate('AddPet', { petId: item.id })
                }
                style={styles.ghostBtn}
              >
                <MaterialIcon
                  name="edit"
                  size={18}
                  color={colors.text.secondary}
                />
                <AppText
                  style={[
                    textStyles.caption,
                    {
                      color: colors.text.secondary,
                      fontFamily: fontFamilies.semibold,
                    },
                  ]}
                >
                  Edit
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete ${item.name}`}
                hitSlop={4}
                onPress={() => handleDelete(item)}
                style={styles.ghostBtn}
              >
                <MaterialIcon name="delete" size={18} color={colors.danger} />
                <AppText
                  style={[
                    textStyles.caption,
                    {
                      color: colors.danger,
                      fontFamily: fontFamilies.semibold,
                    },
                  ]}
                >
                  Delete
                </AppText>
              </Pressable>
            </View>

            {!isActive ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Use ${item.name}`}
                onPress={() => handleSelect(item.id)}
                style={({ pressed }) => [
                  styles.primaryCta,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: radius.pill,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <AppText
                  style={[
                    textStyles.caption,
                    {
                      color: colors.onAccent,
                      fontFamily: fontFamilies.bold,
                    },
                  ]}
                >
                  Use this pet
                </AppText>
              </Pressable>
            ) : (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <MaterialIcon
                  name="check"
                  size={16}
                  color={colors.success}
                />
                <AppText
                  style={[
                    textStyles.caption,
                    {
                      color: colors.success,
                      fontFamily: fontFamilies.semibold,
                      marginLeft: spacing.xs,
                    },
                  ]}
                >
                  Caring for now
                </AppText>
              </View>
            )}
          </View>
        </Pressable>
      );
    },
    [
      activePet?.id,
      colors,
      fontFamilies,
      handleDelete,
      handleSelect,
      navigation,
      radius,
      shadows.md,
      shadows.sm,
      spacing,
      styles,
      textStyles,
    ],
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.backgroundAlt }]}
    >
      <View
        style={[
          styles.well,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.borderSubtle,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: spacing.md,
          },
        ]}
      >
        <View style={[styles.topRow, { gap: spacing.sm }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.iconBtn,
              shadows.sm,
              {
                borderRadius: radius.round,
                backgroundColor: colors.brandTint10,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <MaterialIcon
              name="arrow_back"
              size={20}
              color={colors.text.heading}
            />
          </Pressable>

          <View style={styles.titleBlock}>
            <AppText
              accessibilityRole="header"
              style={[
                textStyles.subtitle,
                {
                  color: colors.text.heading,
                  fontFamily: fontFamilies.extrabold,
                },
              ]}
              numberOfLines={1}
            >
              My pets
            </AppText>
            <AppText
              style={[
                textStyles.caption,
                {
                  color: colors.text.secondary,
                  fontFamily: fontFamilies.medium,
                  marginTop: spacing.xxs,
                },
              ]}
              numberOfLines={1}
            >
              {pets.length === 0
                ? 'Add your first pet to start'
                : pets.length === 1
                  ? '1 pet in your care'
                  : `${pets.length} pets in your care`}
            </AppText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add pet"
            onPress={() => navigation.navigate('AddPet')}
            style={({ pressed }) => [
              styles.iconBtn,
              shadows.sm,
              {
                borderRadius: radius.round,
                backgroundColor: colors.brandTint10,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <MaterialIcon name="add" size={22} color={colors.primaryDark} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.body, { backgroundColor: colors.backgroundAlt }]}>
        <FlatList
          data={pets}
          keyExtractor={item => item.id}
          renderItem={renderPetCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarInset + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            pets.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add another pet"
              onPress={() => navigation.navigate('AddPet')}
              style={({ pressed }) => [
                styles.addCard,
                {
                  borderRadius: radius.xl,
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surface,
                  marginTop: spacing.sm,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <MaterialIcon name="add" size={28} color={colors.accent} />
              <AppText
                style={[
                  textStyles.caption,
                  {
                    color: colors.text.secondary,
                    fontFamily: fontFamilies.semibold,
                  },
                ]}
              >
                Add another pet
              </AppText>
            </Pressable>
            ) : null
          }
          ListEmptyComponent={
            <View
              style={[
                styles.emptyCard,
                shadows.sm,
                {
                  borderRadius: radius.xl,
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surface,
                  padding: spacing.xl,
                },
              ]}
            >
              <MaterialIcon name="pets" size={32} color={colors.accent} />
              <AppText
                style={[
                  textStyles.subtitle,
                  {
                    color: colors.text.heading,
                    fontFamily: fontFamilies.bold,
                    textAlign: 'center',
                  },
                ]}
              >
                No pets yet
              </AppText>
              <AppText
                style={[
                  textStyles.caption,
                  {
                    color: colors.text.secondary,
                    textAlign: 'center',
                  },
                ]}
              >
                Add a pet profile to build their care schedule.
              </AppText>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default PetSwitcherScreen;
