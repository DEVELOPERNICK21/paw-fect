import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../../shared/hooks/useTheme';

type ReminderPetOptionType = 'dog' | 'cat';

export interface ReminderPetOption {
  id: string;
  name: string;
  type: ReminderPetOptionType;
}

export interface ReminderPetSelectorProps {
  pets: ReminderPetOption[];
  selectedPetId: string | null;
  onSelectPet: (petId: string) => void;
}

export const ReminderPetSelector: React.FC<ReminderPetSelectorProps> = ({
  pets,
  selectedPetId,
  onSelectPet,
}) => {
  const { colors, radius, space, textStyles } = useTheme();

  return (
    <View style={styles.container}>
      {pets.map(pet => {
        const selected = pet.id === selectedPetId;
        return (
          <TouchableOpacity
            key={pet.id}
            onPress={() => onSelectPet(pet.id)}
            style={[
              styles.item,
              {
                borderRadius: radius.md,
                paddingHorizontal: space('md'),
                paddingVertical: space('sm'),
                backgroundColor: selected
                  ? colors.primaryLight
                  : colors.surface,
                borderColor: selected ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                textStyles.body,
                {
                  color: selected ? colors.primaryDark : colors.text.primary,
                },
              ]}
            >
              {pet.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
});
