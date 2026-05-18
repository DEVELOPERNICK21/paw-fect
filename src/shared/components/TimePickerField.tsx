import React, { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { AppText } from './AppText';
import { MaterialIcon } from './MaterialIcon';
import { useTheme } from '../hooks/useTheme';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function time24FromLocal(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function localDateFromTime24(time: string): Date | null {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    return null;
  }
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

function displayTimeFrom24(time: string): string {
  const date = localDateFromTime24(time);
  if (!date) {
    return time;
  }
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export interface TimePickerFieldProps {
  value: string;
  onChange: (nextTime: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const TimePickerField: React.FC<TimePickerFieldProps> = React.memo(
  ({
    value,
    onChange,
    placeholder = 'Select time',
    disabled = false,
  }) => {
    const { colors, radius, spacing, textStyles, fontFamilies } = useTheme();
    const [open, setOpen] = useState(false);

    const current = useMemo(() => {
      return localDateFromTime24(value) ?? new Date();
    }, [value]);

    const display = value ? displayTimeFrom24(value) : '';

    const handlePress = useCallback(() => {
      if (disabled) {
        return;
      }
      setOpen(true);
    }, [disabled]);

    const handleChange = useCallback(
      (_event: unknown, selectedDate?: Date) => {
        if (!selectedDate) {
          setOpen(false);
          return;
        }
        onChange(time24FromLocal(selectedDate));
        setOpen(false);
      },
      [onChange],
    );

    return (
      <>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pick time"
          onPress={handlePress}
          disabled={disabled}
          style={[
            styles.field,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
              borderRadius: radius.md,
              opacity: disabled ? 0.6 : 1,
              height: spacing.xl + spacing['2xl'],
              paddingHorizontal: spacing.lg,
            },
          ]}
        >
          <View style={styles.row}>
            <AppText
              style={[
                textStyles.control,
                {
                  color: value ? colors.text.heading : colors.text.subdued,
                  fontFamily: fontFamilies.regular,
                },
              ]}
              numberOfLines={1}
            >
              {value ? display : placeholder}
            </AppText>
            <MaterialIcon name="schedule" size={18} color={colors.accent} />
          </View>
        </Pressable>

        {open ? (
          <DateTimePicker
            value={current}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
          />
        ) : null}
      </>
    );
  },
);

TimePickerField.displayName = 'TimePickerField';

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
