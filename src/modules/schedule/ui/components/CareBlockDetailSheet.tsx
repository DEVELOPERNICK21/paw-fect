import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import type { DailyCareBlock } from '../../domain/models/DailyCareBlock';
import { AppText } from '../../../../shared/components/AppText';
import { Button } from '../../../../shared/components/Button';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { formatScheduleTimeLabel } from '../utils/scheduleDisplay';
import { splitDescriptionBullets } from '../utils/schedulePeriod';

export interface CareBlockDetailSheetProps {
  visible: boolean;
  block: DailyCareBlock | null;
  locked: boolean;
  onClose: () => void;
  onMarkDone: () => void;
  onSnooze: () => void;
  onUpgrade: () => void;
}

export const CareBlockDetailSheet: React.FC<CareBlockDetailSheetProps> = ({
  visible,
  block,
  locked,
  onClose,
  onMarkDone,
  onSnooze,
  onUpgrade,
}) => {
  const { colors, spacing, radius, textStyles, fontFamilies } = useTheme();
  const bullets = useMemo(
    () => (block ? splitDescriptionBullets(block.description) : []),
    [block],
  );
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
          paddingBottom: spacing['2xl'],
          gap: spacing.lg,
        },
        handle: {
          alignSelf: 'center',
          width: spacing['3xl'],
          height: spacing.xs,
          borderRadius: radius.round,
          backgroundColor: colors.borderSubtle,
        },
        meta: {
          gap: spacing.xs,
        },
        actions: {
          gap: spacing.sm,
        },
        bulletRow: {
          flexDirection: 'row',
          gap: spacing.sm,
        },
        bulletDot: {
          width: spacing.xs,
          height: spacing.xs,
          borderRadius: radius.round,
          backgroundColor: colors.text.subdued,
          marginTop: spacing.sm,
        },
      }),
    [colors, radius, spacing],
  );

  if (!block) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <View style={styles.handle} />
          <View style={styles.meta}>
            <AppText
              style={[
                textStyles.title,
                { color: colors.text.heading, fontFamily: fontFamilies.bold },
              ]}
            >
              {block.title}
            </AppText>
            <AppText style={[textStyles.caption, { color: colors.text.secondary }]}>
              {formatScheduleTimeLabel(block.scheduledTime)} · {block.durationMinutes} min
            </AppText>
          </View>
          {bullets.map(item => (
            <View key={item} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <AppText style={[textStyles.body, { color: colors.text.secondary, flex: 1 }]}>
                {item}
              </AppText>
            </View>
          ))}
          <View style={styles.actions}>
            {locked ? (
              <Button title="Unlock with Pawfect+" onPress={onUpgrade} />
            ) : (
              <>
                <Button title="Mark done" onPress={onMarkDone} />
                <Button title="Snooze 30 min" variant="secondary" onPress={onSnooze} />
              </>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
