import React, { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { AppText } from './AppText';
import { MaterialIcon } from './MaterialIcon';
import { useTheme } from '../hooks/useTheme';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function isoDateFromLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function localDateFromIso(iso: string): Date | null {
  const v = iso.trim();
  if (!v) {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return null;
  }
  // Parse as local time midnight to keep Y-M-D stable.
  const [yy, mm, dd] = v.split('-').map(Number);
  if (!yy || !mm || !dd) {
    return null;
  }
  return new Date(yy, mm - 1, dd);
}

function displayDateFromIso(iso: string): string {
  const d = localDateFromIso(iso);
  if (!d) {
    return iso;
  }
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export interface DatePickerFieldProps {
  value: string; // YYYY-MM-DD
  onChange: (nextIsoDate: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  /** Recessed fill for fields sitting on an elevated card. */
  inset?: boolean;
  rightIconName?: Parameters<typeof MaterialIcon>[0]['name'];
}

export const DatePickerField: React.FC<DatePickerFieldProps> = React.memo(
  ({
    value,
    onChange,
    placeholder = 'Select date',
    minimumDate,
    maximumDate,
    disabled = false,
    inset = false,
    rightIconName = 'calendar_today',
  }) => {
    const { colors, radius, spacing, textStyles, fontFamilies } = useTheme();
    const [open, setOpen] = useState(false);

    const current = useMemo(() => {
      return localDateFromIso(value) ?? new Date();
    }, [value]);

    const display = value ? displayDateFromIso(value) : '';

    const handlePress = useCallback(() => {
      if (disabled) {
        return;
      }
      setOpen(true);
    }, [disabled]);

    const handleChange = useCallback(
      (_event: unknown, selectedDate?: Date) => {
        // datetimepicker returns `selectedDate` on iOS/Android; if cancelled it's undefined.
        if (!selectedDate) {
          setOpen(false);
          return;
        }
        const nextIso = isoDateFromLocal(selectedDate);
        onChange(nextIso);
        setOpen(false);
      },
      [onChange],
    );

    return (
      <>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pick date"
          onPress={handlePress}
          disabled={disabled}
          style={[
            styles.field,
            {
              backgroundColor: inset ? colors.background : colors.surface,
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
            <MaterialIcon
              name={rightIconName}
              size={18}
              color={colors.accent}
            />
          </View>
        </Pressable>

        {open ? (
          <DateTimePicker
            value={current}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
          />
        ) : null}
      </>
    );
  },
);

DatePickerField.displayName = 'DatePickerField';

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
