import React, { useCallback, useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import type { HomeRootNavigation } from '../../../../../app/navigation/types';
import { AppText } from '../../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../../shared/components/MaterialIcon';
import type { Theme } from '../../../../../shared/hooks/useTheme';
import type { Pet } from '../../../../../modules/pets/domain/models/Pet';
import { resolvePetAvatarSource } from '../../../../../shared/utils/petDisplayPhoto';

const TILE = 80;

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
          },
          seeAll: {
            minHeight: 44,
            justifyContent: 'center',
          },
          scroll: {
            flexGrow: 0,
          },
          scrollContent: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: spacing.md,
            paddingRight: spacing.sm,
          },
          petItem: {
            alignItems: 'center',
            width: TILE,
            gap: spacing.xs,
          },
          avatar: {
            width: TILE,
            height: TILE,
            resizeMode: 'cover',
          },
          addTile: {
            width: TILE,
            alignItems: 'center',
            gap: spacing.xs,
          },
          addSquare: {
            width: TILE,
            height: TILE,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
          },
        }),
      [spacing],
    );

    return (
      <View style={styles.wrap}>
        <View style={styles.rowTop}>
          <AppText
            accessibilityRole="header"
            style={[
              textStyles.subtitle,
              { color: colors.text.heading, fontFamily: fontFamilies.bold },
            ]}
          >
            My pets
          </AppText>
          {pets.length > 1 ? (
            <Pressable
              onPress={goSeeAll}
              accessibilityRole="button"
              accessibilityLabel="Open full pet list"
              hitSlop={8}
              style={styles.seeAll}
            >
              <AppText
                style={[
                  textStyles.caption,
                  { color: colors.text.secondary, fontFamily: fontFamilies.medium },
                ]}
              >
                See all
              </AppText>
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {pets.map(pet => {
            const isActive = pet.id === activePetId;
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
                <Image
                  source={resolvePetAvatarSource(pet)}
                  accessible={false}
                  importantForAccessibility="no"
                  style={[
                    styles.avatar,
                    {
                      borderRadius: radius.xl,
                      borderWidth: isActive ? 2 : 0,
                      borderColor: colors.accent,
                    },
                  ]}
                  accessibilityIgnoresInvertColors
                />
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
                styles.addSquare,
                {
                  borderRadius: radius.xl,
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <MaterialIcon name="add" size={28} color={colors.accent} />
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
