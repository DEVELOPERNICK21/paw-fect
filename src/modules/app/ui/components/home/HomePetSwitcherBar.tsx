import React, { useCallback, useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import type { HomeRootNavigation } from '../../../../../app/navigation/types';
import { AppText } from '../../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../../shared/components/MaterialIcon';
import type { Theme } from '../../../../../shared/hooks/useTheme';
import type { Pet } from '../../../../../modules/pets/domain/models/Pet';

const DEFAULT_AVATAR_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBTjI_FvulIIoJ18XpSIFocjA8fpzab0a4wQoqoigyYdaaJu9-ejR25ixQ2yFX6DVC1P-mzS0rAiIakDqbxX5LGdE0DWkYnYtpIxTgGc4Jyl0WbK2XEsp-jNAw9IUkBT_scs8_GotU6SyC81FS6h7rWgfhYACVrVI1vQpUS76pgAm3E7Ndcuubyf0UWWRj-UDGGtUNpLJyDXtLY7-SVYO_3-XMutK67MzPnT0o_QnAG8_FiMxX44sexZnAbMMEC-G6Cj-8y0VAgtMSD';

export interface HomePetSwitcherBarProps {
  pets: Pet[];
  activePetId: string | null;
  onSelectPet: (petId: string) => void;
  theme: Theme;
}

export const HomePetSwitcherBar: React.FC<HomePetSwitcherBarProps> = React.memo(
  ({ pets, activePetId, onSelectPet, theme }) => {
    const navigation = useNavigation<HomeRootNavigation>();
    const { colors, radius, spacing, textStyles, fontFamilies } = theme;

    const goSeeAll = useCallback(() => {
      navigation.navigate('PetsTab', { screen: 'PetSwitcher' });
    }, [navigation]);

    const goAddPet = useCallback(() => {
      navigation.navigate('PetsTab', { screen: 'AddPet' });
    }, [navigation]);

    const styles = useMemo(
      () =>
        StyleSheet.create({
          wrap: {
            gap: spacing.sm,
          },
          rowTop: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.xxs,
          },
          scroll: {
            flexGrow: 0,
          },
          scrollContent: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: spacing.md,
            paddingVertical: spacing.xs,
            paddingRight: spacing.sm,
          },
          petItem: {
            alignItems: 'center',
            width: 72,
            gap: spacing.xs,
          },
          avatarRing: {
            borderRadius: radius.round,
            padding: 2,
          },
          avatarRingActive: {
            borderWidth: 2,
            borderRadius: radius.round,
            borderColor: colors.accent,
          },
          avatar: {
            borderRadius: radius.round,
            resizeMode: 'cover',
          },
          addTile: {
            width: 72,
            alignItems: 'center',
            gap: spacing.xs,
          },
          addCircle: {
            width: 56,
            height: 56,
            borderRadius: 28,
            borderWidth: 1,
            alignItems: 'center',
            justifyContent: 'center',
          },
        }),
      [radius.round, spacing],
    );

    if (pets.length === 0) {
      return null;
    }

    return (
      <View style={styles.wrap}>
        <View style={styles.rowTop}>
          <AppText
            style={[
              textStyles.subtitle,
              { color: colors.text.heading, fontFamily: fontFamilies.bold },
            ]}
          >
            Your pets
          </AppText>
          <Pressable
            onPress={goSeeAll}
            accessibilityRole="button"
            accessibilityLabel="Open full pet list"
            hitSlop={12}
          >
            <AppText
              style={[
                textStyles.caption,
                { color: colors.accent, fontFamily: fontFamilies.bold },
              ]}
            >
              See all
            </AppText>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {pets.map(pet => {
            const isActive = pet.id === activePetId;
            const uri = pet.photo?.trim() ? pet.photo : DEFAULT_AVATAR_URI;
            return (
              <Pressable
                key={pet.id}
                onPress={() => {
                  onSelectPet(pet.id);
                }}
                style={styles.petItem}
                accessibilityRole="button"
                accessibilityLabel={`Show home for ${pet.name}`}
                accessibilityState={{ selected: isActive }}
              >
                <View
                  style={[
                    styles.avatarRing,
                    isActive && styles.avatarRingActive,
                    {
                      borderColor: isActive ? colors.accent : 'transparent',
                    },
                  ]}
                >
                  <Image
                    source={{ uri }}
                    style={[
                      styles.avatar,
                      {
                        width: 52,
                        height: 52,
                        borderWidth: isActive ? 0 : 1,
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                    accessibilityIgnoresInvertColors
                  />
                </View>
                <AppText
                  style={[
                    textStyles.caption,
                    {
                      color: isActive
                        ? colors.text.heading
                        : colors.text.secondary,
                      fontFamily: isActive
                        ? fontFamilies.bold
                        : fontFamilies.medium,
                      textAlign: 'center',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {pet.name}
                </AppText>
              </Pressable>
            );
          })}

          <Pressable
            onPress={goAddPet}
            style={styles.addTile}
            accessibilityRole="button"
            accessibilityLabel="Add another pet"
          >
            <View
              style={[
                styles.addCircle,
                {
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surfaceAlt,
                },
              ]}
            >
              <MaterialIcon name="add" size={26} color={colors.accent} />
            </View>
            <AppText
              style={[
                textStyles.caption,
                {
                  color: colors.text.secondary,
                  fontFamily: fontFamilies.medium,
                  textAlign: 'center',
                },
              ]}
              numberOfLines={1}
            >
              Add
            </AppText>
          </Pressable>
        </ScrollView>
      </View>
    );
  },
);

HomePetSwitcherBar.displayName = 'HomePetSwitcherBar';
