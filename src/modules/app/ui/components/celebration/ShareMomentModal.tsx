import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import type { MilestoneShareKind } from '../../../../records/domain/utils/isMilestoneCompletion';
import { useTheme } from '../../../../../shared/hooks/useTheme';
import { AppText } from '../../../../../shared/components/AppText';
import { Button } from '../../../../../shared/components/Button';

export interface ShareMomentModalProps {
  visible: boolean;
  petName: string;
  kind: MilestoneShareKind;
  onShare: () => void;
  onNotNow: () => void;
}

function milestoneCopy(
  kind: MilestoneShareKind,
  petName: string,
): { title: string; body: string } {
  switch (kind) {
    case 'series_complete':
      return {
        title: 'Vaccination series complete',
        body: `${petName} finished the starter series. Share a health card to celebrate the milestone.`,
      };
    case 'rabies_booster':
      return {
        title: 'Rabies protection updated',
        body: `You logged a rabies dose for ${petName}. Share a quick update with people who should know.`,
      };
    case 'first_ever':
      return {
        title: 'First health task done',
        body: `Nice work getting ${petName} on the schedule. Share a card to mark the moment.`,
      };
  }
}

export const ShareMomentModal: React.FC<ShareMomentModalProps> = ({
  visible,
  petName,
  kind,
  onShare,
  onNotNow,
}) => {
  const { colors, textStyles, space, radius, fontFamilies } = useTheme();
  const { title, body } = milestoneCopy(kind, petName);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          justifyContent: 'center',
          padding: space('lg'),
        },
        card: {
          borderWidth: 1,
          maxWidth: 400,
          alignSelf: 'center',
          width: '100%',
        },
        actions: {
          marginTop: space('md'),
          gap: space('sm'),
        },
      }),
    [space],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onNotNow}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
        onPress={onNotNow}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <Pressable
          onPress={e => e.stopPropagation()}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
              borderRadius: radius.lg,
              padding: space('lg'),
            },
          ]}
        >
          <AppText
            style={[
              textStyles.subtitle,
              {
                color: colors.text.heading,
                fontFamily: fontFamilies.bold,
              },
            ]}
          >
            {title}
          </AppText>
          <AppText
            style={[
              textStyles.caption,
              { color: colors.text.secondary, marginTop: space('xs') },
            ]}
          >
            {body}
          </AppText>
          <View style={styles.actions}>
            <Button title="Share this moment" onPress={onShare} />
            <Button
              title="Not now"
              variant="secondary"
              onPress={onNotNow}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
