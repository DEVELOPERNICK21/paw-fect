import React, { useMemo } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import type { PetProfileRootNavigation } from '../../../../app/navigation/types';
import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import type { Pet } from '../../domain/models/Pet';
import { usePetStore } from '../../store/petStore';

export const PetSwitcherScreen: React.FC = () => {
  const navigation = useNavigation<PetProfileRootNavigation>();
  const { colors, textStyles, fontFamilies, space, radius } = useTheme();
  const pets = usePetStore(s => s.pets);
  const activePet = usePetStore(s => s.activePet);
  const setActivePet = usePetStore(s => s.setActivePet);
  const deletePet = usePetStore(s => s.deletePet);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.backgroundAlt },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: space('lg'),
          paddingVertical: space('md'),
        },
        iconBtn: {
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
        },
        content: {
          paddingHorizontal: space('lg'),
          paddingBottom: space('2xl'),
        },
        card: {
          borderWidth: 1,
          borderRadius: radius.md,
          padding: space('md'),
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
          marginBottom: space('sm'),
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        left: { flexDirection: 'row', alignItems: 'center', gap: space('sm'), flex: 1 },
        right: { flexDirection: 'row', alignItems: 'center', gap: space('sm') },
        activeTag: {
          paddingHorizontal: space('sm'),
          paddingVertical: space('xs'),
          borderRadius: radius.round,
          backgroundColor: colors.successSurface,
        },
      }),
    [colors, fontFamilies, radius, space, textStyles],
  );

  const handleDelete = (pet: Pet): void => {
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
                result.error ?? 'Try again when you have a stable connection.',
              );
            }
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <MaterialIcon name="arrow_back" size={20} color={colors.text.heading} />
        </Pressable>
        <AppText
          style={[
            textStyles.subtitle,
            { color: colors.text.heading, fontFamily: fontFamilies.bold },
          ]}
        >
          My Pets
        </AppText>
        <Pressable
          style={styles.iconBtn}
          onPress={() => navigation.navigate('AddPet')}
          accessibilityRole="button"
          accessibilityLabel="Add pet"
        >
          <MaterialIcon name="add" size={20} color={colors.accent} />
        </Pressable>
      </View>

      <FlatList
        data={pets}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => {
          const isActive = activePet?.id === item.id;
          return (
            <Pressable
              style={styles.card}
              onPress={() => {
                void setActivePet(item.id);
                navigation.goBack();
              }}
            >
              <View style={styles.left}>
                <MaterialIcon name="pets" size={20} color={colors.accent} />
                <View>
                  <AppText
                    style={[
                      textStyles.body,
                      { color: colors.text.heading, fontFamily: fontFamilies.bold },
                    ]}
                  >
                    {item.name}
                  </AppText>
                  <AppText
                    style={[
                      textStyles.caption,
                      { color: colors.text.secondary, fontFamily: fontFamilies.medium },
                    ]}
                  >
                    {(item.type ?? 'pet').toUpperCase()}
                  </AppText>
                </View>
              </View>

              <View style={styles.right}>
                {isActive ? (
                  <View style={styles.activeTag}>
                    <AppText
                      style={[
                        textStyles.overline,
                        { color: colors.success, fontFamily: fontFamilies.bold },
                      ]}
                    >
                      ACTIVE
                    </AppText>
                  </View>
                ) : null}
                <Pressable
                  onPress={() => navigation.navigate('AddPet', { petId: item.id })}
                >
                  <MaterialIcon name="edit" size={18} color={colors.text.subdued} />
                </Pressable>
                <Pressable onPress={() => handleDelete(item)}>
                  <MaterialIcon name="delete" size={18} color={colors.danger} />
                </Pressable>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <AppText
            style={[
              textStyles.caption,
              { color: colors.text.secondary, fontFamily: fontFamilies.medium },
            ]}
          >
            No pets found. Add your first pet.
          </AppText>
        }
      />
    </SafeAreaView>
  );
};

export default PetSwitcherScreen;
