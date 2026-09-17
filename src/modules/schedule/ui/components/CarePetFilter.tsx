import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import { Paw3dIcon } from '../../../../shared/components/Paw3dIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import type { Pet } from '../../../pets/domain/models/Pet';
import { resolvePetAvatarSource } from '../../../../shared/utils/petDisplayPhoto';

export type CareFilterId = 'all' | string;

export interface CarePetFilterProps {
  pets: Pet[];
  selectedId: CareFilterId;
  onSelect: (id: CareFilterId) => void;
  /** Hide All chip when only one pet (still conceptually all). */
  showAllChip?: boolean;
}

/**
 * Compact pet filter chips — All Pets default for multi-pet Care.
 */
export const CarePetFilter: React.FC<CarePetFilterProps> = ({
  pets,
  selectedId,
  onSelect,
  showAllChip = pets.length > 1,
}) => {
  const { colors, spacing, radius, textStyles, fontFamilies, shadows } =
    useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scrollContent: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.xs,
        },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          minHeight: 42,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radius.pill,
          borderWidth: 1.5,
        },
        avatar: {
          width: 24,
          height: 24,
          borderRadius: 12,
        },
      }),
    [radius, spacing],
  );

  if (pets.length === 0) {
    return null;
  }

  const chipStyle = (active: boolean) => [
    styles.chip,
    active ? shadows.sm : null,
    {
      backgroundColor: active ? colors.accent : colors.surface,
      borderColor: active ? colors.accent : colors.borderSubtle,
    },
  ];

  const labelStyle = (active: boolean) => [
    textStyles.caption,
    {
      color: active ? colors.onAccent : colors.text.secondary,
      fontFamily: active ? fontFamilies.bold : fontFamilies.medium,
    },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {showAllChip ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: selectedId === 'all' }}
          accessibilityLabel="All pets"
          onPress={() => onSelect('all')}
          style={({ pressed }) => [
            ...chipStyle(selectedId === 'all'),
            { opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Paw3dIcon size={18} tone="cream" />
          <AppText style={labelStyle(selectedId === 'all')}>All pets</AppText>
        </Pressable>
      ) : null}
      {pets.map(pet => {
        const active = selectedId === pet.id;
        return (
          <Pressable
            key={pet.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={pet.name}
            onPress={() => onSelect(pet.id)}
            style={({ pressed }) => [
              ...chipStyle(active),
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Image
              source={resolvePetAvatarSource(pet)}
              style={[
                styles.avatar,
                active ? { borderWidth: 1.5, borderColor: colors.onAccent } : null,
              ]}
            />
            <AppText style={labelStyle(active)} numberOfLines={1}>
              {pet.name}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};
