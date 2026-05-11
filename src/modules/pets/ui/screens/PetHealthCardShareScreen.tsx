import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';

import type { PetsStackParamList } from '../../../../app/navigation/types';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { useAuthStore } from '../../../auth/store/authStore';
import { petComposition } from '../../petComposition';
import type { PetHealthCardViewModel } from '../../domain/models/PetHealthCardViewModel';
import { PetHealthShareCard } from '../components/share/PetHealthShareCard';
import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
} from '../components/share/PetHealthShareCard.styles';

const PREVIEW_TARGET_WIDTH = 320;
const PREVIEW_SCALE = PREVIEW_TARGET_WIDTH / SHARE_CARD_WIDTH;
const PREVIEW_HEIGHT = SHARE_CARD_HEIGHT * PREVIEW_SCALE;

export const PetHealthCardShareScreen: React.FC = () => {
  const navigation = useNavigation();
  const route =
    useRoute<RouteProp<PetsStackParamList, 'PetHealthCardShare'>>();
  const { colors, fontFamilies } = useTheme();
  const userId = useAuthStore(s => s.user?.id);

  const captureRef = useRef<ViewShotRef | null>(null);

  const [viewModel, setViewModel] = useState<PetHealthCardViewModel | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const petId = route.params.petId;
    (async () => {
      if (!userId) {
        setLoadError('Sign in to share your pet card.');
        return;
      }
      try {
        const vm = await petComposition.buildPetHealthCard(userId, petId);
        if (!cancelled) {
          setViewModel(vm);
        }
      } catch {
        if (!cancelled) {
          setLoadError('Could not load this pet.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [route.params.petId, userId]);

  const handleShare = useCallback(async () => {
    if (!viewModel || sharing) {
      return;
    }
    setSharing(true);
    try {
      const uri = await captureRef.current?.capture();
      if (!uri) {
        throw new Error('capture returned empty uri');
      }
      const message = buildShareMessage(viewModel);
      await Share.share({
        title: `${viewModel.pet.name} — Paw-fect`,
        message:
          Platform.OS === 'android' ? `${message}\n${uri}` : message,
        url: Platform.OS === 'ios' ? uri : undefined,
      });
    } catch {
      notifyShareFailure();
    } finally {
      setSharing(false);
    }
  }, [sharing, viewModel]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.headerBtn}>
          <Text
            style={[
              styles.headerBtnText,
              { color: colors.text.heading, fontFamily: fontFamilies.bold },
            ]}
          >
            Back
          </Text>
        </Pressable>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text.heading, fontFamily: fontFamilies.bold },
          ]}
        >
          Share health card
        </Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.body}>
        {loadError ? (
          <Text
            style={[
              styles.error,
              { color: colors.text.body, fontFamily: fontFamilies.medium },
            ]}
          >
            {loadError}
          </Text>
        ) : !viewModel ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Text
              style={[
                styles.caption,
                { color: colors.text.body, fontFamily: fontFamilies.medium },
              ]}
            >
              Looking good?
            </Text>

            <View
              style={[
                styles.previewClip,
                {
                  width: PREVIEW_TARGET_WIDTH,
                  height: PREVIEW_HEIGHT,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <View
                style={[
                  styles.previewScaled,
                  {
                    width: SHARE_CARD_WIDTH,
                    height: SHARE_CARD_HEIGHT,
                    transform: [{ scale: PREVIEW_SCALE }],
                  },
                ]}
              >
                <PetHealthShareCard viewModel={viewModel} />
              </View>
            </View>

            <View
              style={styles.captureHost}
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <ViewShot
                ref={captureRef}
                options={{ format: 'png', quality: 1, result: 'tmpfile' }}
                style={{
                  width: SHARE_CARD_WIDTH,
                  height: SHARE_CARD_HEIGHT,
                }}
              >
                <PetHealthShareCard viewModel={viewModel} />
              </ViewShot>
            </View>

            <Pressable
              onPress={handleShare}
              disabled={sharing}
              style={[
                styles.shareBtn,
                {
                  backgroundColor: sharing
                    ? colors.borderSubtle
                    : colors.primary,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Share health card"
            >
              {sharing ? (
                <ActivityIndicator color={colors.text.inverse} />
              ) : (
                <Text
                  style={[
                    styles.shareBtnText,
                    {
                      color: colors.text.inverse,
                      fontFamily: fontFamilies.bold,
                    },
                  ]}
                >
                  Share
                </Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default PetHealthCardShareScreen;

function buildShareMessage(vm: PetHealthCardViewModel): string {
  if (vm.snapshot.kind === 'empty') {
    const species =
      vm.snapshot.speciesEmoji === '🐈' ? 'cats' : 'dogs';
    return [
      `Just added ${vm.pet.name} to Paw-fect 🐾`,
      `Auto-scheduled vaccines and deworming for ${species}.`,
      `Track your pet's health: ${vm.footer.shareUrl}`,
    ].join('\n');
  }
  const next = vm.snapshot.items.find(i => i.status !== 'done');
  const nextLine = next
    ? `Next up: ${next.label} (${next.detail})`
    : 'On track 💛';
  return [
    `${vm.pet.name} on Paw-fect 🐾`,
    nextLine,
    `Track your pet's health: ${vm.footer.shareUrl}`,
  ].join('\n');
}

function notifyShareFailure(): void {
  const msg = 'Could not share the card. Please try again.';
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
    return;
  }
  Alert.alert('Share', msg);
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    minWidth: 72,
  },
  headerBtnText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  caption: {
    fontSize: 14,
    marginBottom: 16,
  },
  previewClip: {
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 28,
  },
  /** Top-left anchor so scale-down fits the preview clip rect. */
  previewScaled: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  /** Off-screen full-size raster source for ViewShot.capture() */
  captureHost: {
    position: 'absolute',
    left: -8000,
    top: 0,
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    opacity: 1,
  },
  shareBtn: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 32,
    minWidth: 200,
    alignItems: 'center',
  },
  shareBtnText: {
    fontSize: 18,
  },
  error: {
    fontSize: 16,
    textAlign: 'center',
  },
});
