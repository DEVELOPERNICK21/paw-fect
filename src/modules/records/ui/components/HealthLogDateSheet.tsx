import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../../../shared/components/AppText';
import { Button } from '../../../../shared/components/Button';
import { DatePickerField } from '../../../../shared/components/DatePickerField';
import { useTheme } from '../../../../shared/hooks/useTheme';

export interface HealthLogDateSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  value: string;
  onChange: (nextIsoDate: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  error?: string | null;
  saving?: boolean;
  saveLabel?: string;
  onSave: () => void;
  onClose: () => void;
}

/**
 * Bottom sheet for logging a care date — matches Care tab sheet language
 * (handle, slide-up, primary Button with loading).
 */
export const HealthLogDateSheet: React.FC<HealthLogDateSheetProps> = ({
  visible,
  title,
  subtitle,
  value,
  onChange,
  minimumDate,
  maximumDate,
  error,
  saving = false,
  saveLabel = 'Save',
  onSave,
  onClose,
}) => {
  const { colors, spacing, radius, textStyles, fontFamilies } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: colors.overlay,
        },
        sheet: {
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.md,
          gap: spacing.lg,
        },
        handle: {
          alignSelf: 'center',
          width: spacing['3xl'],
          height: spacing.xs,
          borderRadius: radius.round,
          backgroundColor: colors.borderSubtle,
        },
        header: {
          gap: spacing.xs,
        },
        fieldBlock: {
          gap: spacing.sm,
        },
        actions: {
          gap: spacing.sm,
          marginTop: spacing.xs,
        },
      }),
    [colors, insets.bottom, radius, spacing],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={saving ? undefined : onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={saving ? undefined : onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <Pressable
          style={styles.sheet}
          onPress={() => undefined}
          accessibilityViewIsModal
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText
              style={[
                textStyles.title,
                {
                  color: colors.text.heading,
                  fontFamily: fontFamilies.bold,
                },
              ]}
            >
              {title}
            </AppText>
            {subtitle ? (
              <AppText
                style={[textStyles.caption, { color: colors.text.secondary }]}
              >
                {subtitle}
              </AppText>
            ) : null}
          </View>

          <View style={styles.fieldBlock}>
            <DatePickerField
              value={value}
              onChange={onChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              disabled={saving}
              inset
            />
            {error ? (
              <AppText style={[textStyles.caption, { color: colors.danger }]}>
                {error}
              </AppText>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Button
              title={saveLabel}
              onPress={onSave}
              loading={saving}
              disabled={saving || !value}
            />
            <Button
              title="Cancel"
              variant="secondary"
              onPress={onClose}
              disabled={saving}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
