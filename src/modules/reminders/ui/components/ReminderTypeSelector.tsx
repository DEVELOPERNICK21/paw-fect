import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip } from '../../../../shared/components/Chip';
import type { ReminderType } from '../../domain/models/Reminder';
import { useTheme } from '../../../../shared/hooks/useTheme';

export interface ReminderTypeSelectorProps {
  value: ReminderType;
  onChange: (value: ReminderType) => void;
}

const TYPES: ReminderType[] = [
  'vaccination',
  'medication',
  'grooming',
  'checkup',
  'other',
];

export const ReminderTypeSelector: React.FC<ReminderTypeSelectorProps> = ({
  value,
  onChange,
}) => {
  const { space } = useTheme();
  return (
    <View style={styles.container}>
      {TYPES.map(type => (
        <Chip
          key={type}
          label={type}
          selected={value === type}
          onPress={() => onChange(type)}
          style={{ marginRight: space('xs'), marginBottom: space('xs') }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

