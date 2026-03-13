import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Reminder } from '../../domain/models/Reminder';
import { Card } from '../../../../shared/components/Card';
import { Chip } from '../../../../shared/components/Chip';
import { useTheme } from '../../../../shared/hooks/useTheme';

export interface ReminderCardProps {
  reminder: Reminder;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({ reminder }) => {
  const { colors, textStyles, space } = useTheme();

  return (
    <Card
      title={reminder.title}
      subtitle={reminder.notes}
      actions={
        <Chip
          label={reminder.type}
          style={{ marginLeft: space('sm') }}
        />
      }
    >
      <View style={styles.row}>
        <Text
          style={[
            textStyles.caption,
            { color: colors.text.secondary, marginRight: space('sm') },
          ]}
        >
          {reminder.date} at {reminder.time}
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

