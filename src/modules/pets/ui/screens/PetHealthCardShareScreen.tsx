import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { CanvasRef } from '@shopify/react-native-skia';
import Share from 'react-native-share';

import type { PetsStackParamList } from '../../../../app/navigation/types';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { useAuthStore } from '../../../auth/store/authStore';
import { petComposition } from '../../petComposition';
import type { PetHealthCardViewModel } from '../../domain/models/PetHealthCardViewModel';
import { captureCanvasPngDataUri } from '../components/share/exportPetHealthShareCardImage';
import {
  PREVIEW_HEIGHT,
  PREVIEW_WIDTH,
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
} from '../components/share/petHealthShareCardLayout';
import { PetHealthShareCardSkia } from '../components/share/PetHealthShareCardSkia';

export const PetHealthCardShareScreen: React.FC = () => {
  const navigation = useNavigation();
  const route =
    useRoute<RouteProp<PetsStackParamList, 'PetHealthCardShare'>>();
  const { colors, fontFamilies } = useTheme();
  const userId = useAuthStore(s => s.user?.id);

  const exportCanvasRef = useRef<CanvasRef | null>(null);

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
      const dataUri = await captureCanvasPngDataUri(exportCanvasRef.current);
      const message = buildShareMessage(viewModel);
      await Share.open({
        title: `${viewModel.pet.name} — Paw-fect`,
        message,
        url: dataUri,
        type: 'image/png',
        filename: 'paw-fect-health-card.png',
        failOnCancel: false,
      });
    } catch (error) {
      if (!isShareCancelled(error)) {
        notifyShareFailure();
      }
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
                  width: PREVIEW_WIDTH,
                  height: PREVIEW_HEIGHT,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <PetHealthShareCardSkia
                viewModel={viewModel}
                width={PREVIEW_WIDTH}
                height={PREVIEW_HEIGHT}
              />
            </View>

            <View
              style={styles.exportHost}
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <PetHealthShareCardSkia
                ref={exportCanvasRef}
                viewModel={viewModel}
                width={SHARE_CARD_WIDTH}
                height={SHARE_CARD_HEIGHT}
              />
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

function isShareCancelled(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes('user did not share') ||
    message.includes('cancel') ||
    message.includes('dismiss')
  );
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
  exportHost: {
    position: 'absolute',
    left: -SHARE_CARD_WIDTH - 64,
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
