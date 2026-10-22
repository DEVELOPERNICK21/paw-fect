import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import { Mascot } from '../../../../../shared/components/Mascot';
import type { PetType } from '../../../domain/models/Pet';
import { usePetWelcomeReaction } from '../../hooks/usePetWelcomeReaction';

export interface PetWelcomeMascotProps {
  species: PetType;
  size?: number;
}

/**
 * The mascot on the pet profile. It welcomes a freshly created pet, once, the moment this
 * screen is visible again after the Add Pet form closes. Pauses while the tab is hidden.
 */
export const PetWelcomeMascot: React.FC<PetWelcomeMascotProps> = ({
  species,
  size = 88,
}) => {
  const isFocused = useIsFocused();
  const reactionRequest = usePetWelcomeReaction();
  const styles = useMemo(
    () => StyleSheet.create({ box: { alignItems: 'center' } }),
    [],
  );

  return (
    <View style={styles.box}>
      <Mascot
        mood="happy"
        species={species}
        size={size}
        interactive
        paused={!isFocused}
        reactionRequest={reactionRequest}
        testID="pet-welcome-mascot"
      />
    </View>
  );
};
