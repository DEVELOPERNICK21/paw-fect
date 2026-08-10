import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  BackdropBlur,
  Canvas,
  Fill,
  Path as SkiaPath,
  Skia,
} from '@shopify/react-native-skia';
import Svg, { G, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppTabParamList } from '../types';
import {
  TAB_BAR_FLOAT_GAP,
  TAB_BAR_HORIZONTAL_INSET,
  TAB_BAR_VISUAL_HEIGHT,
} from '../layout';
import { useHomeDashboardStore } from '../../../modules/app/store/homeDashboardStore';
import { usePetStore } from '../../../modules/pets/store/petStore';
import type { Pet } from '../../../modules/pets/domain/models/Pet';
import { AppText } from '../../../shared/components/AppText';
import { MaterialIcon } from '../../../shared/components/MaterialIcon';
import { useTheme } from '../../../shared/hooks/useTheme';
import type { Theme } from '../../../shared/hooks/useTheme';
import { icons } from '../../../shared/assets/icons';
import { resolvePetAvatarSource } from '../../../shared/utils/petDisplayPhoto';
import {
  BAR_HEIGHT,
  DEFAULT_TAB_BAR_CORNER_RADIUS,
  DEFAULT_TAB_BAR_SCOOP_DEPTH,
  DEFAULT_TAB_BAR_SCOOP_RADIUS,
  FAB_BOTTOM_OFFSET,
  FAB_SIZE,
  buildPawTabBarShellPath,
} from './pawTabBarShellPath';
import {
  SIDE_TAB_ORDER,
  isSideTabActive,
  pillTranslateX,
  sideTabIndex,
} from './pawTabBarMotion';

export { TAB_BAR_VISUAL_HEIGHT as APP_TAB_BAR_HEIGHT } from '../layout';

type TabKey = 'home' | 'health' | 'notifications' | 'settings' | 'pets';

const ORBIT_AVATAR = 52;
const ORBIT_ITEM_WIDTH = 76;
const PILL_SIZE = 40;

const HOME_SIDE_INDEX = SIDE_TAB_ORDER.indexOf('home');
const HEALTH_SIDE_INDEX = SIDE_TAB_ORDER.indexOf('health');
const NOTIFICATIONS_SIDE_INDEX = SIDE_TAB_ORDER.indexOf('notifications');
const SETTINGS_SIDE_INDEX = SIDE_TAB_ORDER.indexOf('settings');

type TabIconName =
  | 'home'
  | 'monitor_heart'
  | 'stethoscope'
  | 'notifications'
  | 'analytics'
  | 'schedule'
  | 'settings';

const TAB_ROOT_SCREENS: Record<keyof AppTabParamList, string> = {
  HomeTab: 'Home',
  HealthTab: 'HealthRecords',
  PetsTab: 'PetProfile',
  NotificationsTab: 'WellnessHub',
  SettingsTab: 'Settings',
};

function getNestedRouteName(
  tabRoute: BottomTabBarProps['state']['routes'][number] | undefined,
): string | undefined {
  const nestedState = tabRoute?.state;
  if (nestedState?.routes == null || nestedState.routes.length === 0) {
    return undefined;
  }
  const index = nestedState.index ?? nestedState.routes.length - 1;
  return nestedState.routes[index]?.name;
}

function tabKeyFromRouteName(name: keyof AppTabParamList | string): TabKey {
  switch (name) {
    case 'HomeTab':
      return 'home';
    case 'HealthTab':
      return 'health';
    case 'NotificationsTab':
      return 'notifications';
    case 'SettingsTab':
      return 'settings';
    case 'PetsTab':
      return 'pets';
    default:
      return 'home';
  }
}

const springPress = {
  friction: 6,
  tension: 380,
  useNativeDriver: true as const,
};

const springRelease = {
  friction: 7,
  tension: 280,
  useNativeDriver: true as const,
};

const itemStyles = StyleSheet.create({
  tabHit: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
});

interface TabSlotProps {
  accessibilityLabel: string;
  icon: TabIconName;
  active: boolean;
  onPress: () => void;
  colors: Theme['colors'];
  onCenterMeasured?: (pageX: number, width: number) => void;
}

const TabSlot = React.memo(function TabSlot({
  accessibilityLabel,
  icon,
  active,
  onPress,
  colors,
  onCenterMeasured,
}: TabSlotProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const activePop = useRef(new Animated.Value(active ? 1 : 0)).current;
  const slotRef = useRef<View>(null);

  const pressIn = () => {
    Animated.spring(scale, { ...springPress, toValue: 0.93 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { ...springRelease, toValue: 1 }).start();
  };

  useEffect(() => {
    Animated.timing(activePop, {
      toValue: active ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [active, activePop]);

  const activeOpacity = activePop;
  const inactiveOpacity = activePop.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const iconPopScale = activePop.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const iconLift = activePop.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });

  return (
    <Pressable
      ref={slotRef}
      onLayout={() => {
        slotRef.current?.measureInWindow((x, _y, width) => {
          onCenterMeasured?.(x, width);
        });
      }}
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
      style={itemStyles.tabHit}
      testID={`paw-tab-slot-${accessibilityLabel.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Animated.View
        style={[
          itemStyles.tabChip,
          {
            transform: [{ scale }],
          },
        ]}
      >
        <Animated.View
          style={{
            transform: [{ scale: iconPopScale }, { translateY: iconLift }],
          }}
        >
          <View style={{ width: 28, height: 28, justifyContent: 'center' }}>
            <Animated.View
              style={{ position: 'absolute', left: 0, right: 0, opacity: activeOpacity }}
            >
              <MaterialIcon name={icon} size={24} color={colors.accent} />
            </Animated.View>
            <Animated.View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                opacity: inactiveOpacity,
              }}
            >
              <MaterialIcon name={icon} size={24} color={colors.text.subdued} />
            </Animated.View>
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
});

export const PawTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const { fontFamilies, colors, shadows, textStyles, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const styles = useMemo(() => createStyles(), []);

  const pets = usePetStore(s => s.pets);
  const activePet = usePetStore(s => s.activePet);
  const setActivePet = usePetStore(s => s.setActivePet);
  const requestDashboardRefresh = useHomeDashboardStore(
    s => s.requestDashboardRefresh,
  );

  const [petPickerOpen, setPetPickerOpen] = useState(false);

  const closePetPicker = useCallback(() => {
    setPetPickerOpen(false);
  }, []);

  const bottomPad = Math.max(insets.bottom, Platform.OS === 'ios' ? 6 : 4);
  const shellHeight = TAB_BAR_VISUAL_HEIGHT + bottomPad;
  const islandWidth = Math.max(winW - TAB_BAR_HORIZONTAL_INSET * 2, 1);
  const shellPath = useMemo(
    () =>
      buildPawTabBarShellPath({
        width: islandWidth,
        height: BAR_HEIGHT,
        cornerRadius: DEFAULT_TAB_BAR_CORNER_RADIUS,
        scoopRadius: DEFAULT_TAB_BAR_SCOOP_RADIUS,
        scoopDepth: DEFAULT_TAB_BAR_SCOOP_DEPTH,
      }),
    [islandWidth],
  );
  const skShellPath = useMemo(
    () => Skia.Path.MakeFromSVGString(shellPath),
    [shellPath],
  );
  /** Vertical center of the paw FAB on screen (for orbit layout). */
  const fabCenterY =
    winH - bottomPad - TAB_BAR_FLOAT_GAP - FAB_BOTTOM_OFFSET - FAB_SIZE / 2;

  const bubbleAnimsRef = useRef<Animated.Value[]>([]);
  const backdropOpac = useRef(new Animated.Value(0)).current;

  const currentRoute = state.routes[state.index];
  const currentKey = tabKeyFromRouteName(currentRoute.name);

  const barRowRef = useRef<View>(null);
  const centersXRef = useRef<Array<number | undefined>>([
    undefined,
    undefined,
    undefined,
    undefined,
  ]);
  const pillX = useRef(new Animated.Value(0)).current;
  // Seeded to 0 (not based on `currentKey`) so the pill never flashes at
  // `translateX: 0` before its first real position is measured.
  const pillOpacity = useRef(new Animated.Value(0)).current;
  const pillScale = useRef(new Animated.Value(1)).current;
  const hasPositionedPill = useRef(false);
  /** True once the pill has faded in for the current side-tab streak; false while hidden (e.g. on Pets). */
  const pillVisibleRef = useRef(false);
  /** Last X we actually applied to `pillX`, used to detect layout drift worth remeasuring for. */
  const lastPillXRef = useRef<number | null>(null);

  const revealPill = useCallback(
    (x: number) => {
      pillX.setValue(x);
      lastPillXRef.current = x;
      hasPositionedPill.current = true;
      if (isSideTabActive(currentKey)) {
        pillVisibleRef.current = true;
        Animated.timing(pillOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }).start();
      }
    },
    [currentKey, pillOpacity, pillX],
  );

  const onTabCenter = useCallback(
    (sideIndex: number, pageX: number, width: number) => {
      barRowRef.current?.measureInWindow(barX => {
        const centerInBar = pageX + width / 2 - barX;
        centersXRef.current[sideIndex] = centerInBar;
        const activeIndex = sideTabIndex(currentKey);
        if (activeIndex !== sideIndex) {
          return;
        }
        const x = pillTranslateX(centersXRef.current, activeIndex, PILL_SIZE);
        if (x == null) {
          return;
        }
        if (!hasPositionedPill.current) {
          revealPill(x);
          return;
        }
        // Layout drift (e.g. rotation, font scaling) can shift a side tab's
        // center after the pill already landed there; remeasure and follow it.
        const lastX = lastPillXRef.current;
        if (lastX == null || Math.abs(x - lastX) > 0.5) {
          lastPillXRef.current = x;
          Animated.spring(pillX, {
            toValue: x,
            friction: 7,
            tension: 180,
            useNativeDriver: true,
          }).start();
        }
      });
    },
    [currentKey, pillX, revealPill],
  );

  useEffect(() => {
    const index = sideTabIndex(currentKey);

    if (index == null) {
      pillVisibleRef.current = false;
      Animated.timing(pillOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
      return;
    }

    const x = pillTranslateX(centersXRef.current, index, PILL_SIZE);
    if (x == null) {
      // Not measured yet; `onTabCenter` reveals the pill once layout lands.
      return;
    }

    // Coming from an unmeasured start or from a hidden state (Pets): snap
    // into place instead of springing across the FAB gap while fading in.
    if (!hasPositionedPill.current || !pillVisibleRef.current) {
      revealPill(x);
      return;
    }

    lastPillXRef.current = x;

    Animated.parallel([
      Animated.spring(pillX, {
        toValue: x,
        friction: 7,
        tension: 180,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(pillScale, {
          toValue: 0.88,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.spring(pillScale, {
          toValue: 1,
          friction: 5,
          tension: 220,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [currentKey, pillOpacity, pillScale, pillX, revealPill]);

  useEffect(() => {
    hasPositionedPill.current = false;
    pillVisibleRef.current = false;
    lastPillXRef.current = null;
    centersXRef.current = [undefined, undefined, undefined, undefined];
    pillOpacity.setValue(0);
  }, [winW, pillOpacity]);

  const fabScale = useRef(new Animated.Value(1)).current;
  const fabLift = useRef(new Animated.Value(0)).current;
  const prevTabRef = useRef<TabKey>(currentKey);

  useEffect(() => {
    if (currentKey === 'pets' && prevTabRef.current !== 'pets') {
      Animated.sequence([
        Animated.spring(fabLift, {
          toValue: 1,
          friction: 5,
          tension: 220,
          useNativeDriver: true,
        }),
        Animated.spring(fabLift, {
          toValue: 0,
          friction: 8,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevTabRef.current = currentKey;
  }, [currentKey, fabLift]);

  const animateFabPress = (pressed: boolean) => {
    Animated.spring(fabScale, {
      toValue: pressed ? 0.9 : 1,
      friction: 5,
      tension: 320,
      useNativeDriver: true,
    }).start();
  };

  const jumpToTabRoot = (name: keyof AppTabParamList) => {
    const rootScreen = TAB_ROOT_SCREENS[name];
    const tabRoute = state.routes.find(route => route.name === name);
    const isFocused = currentRoute.name === name;
    const nestedRoute = getNestedRouteName(tabRoute);

    if (isFocused && nestedRoute === rootScreen) {
      return;
    }

    navigation.navigate(name, { screen: rootScreen });
  };

  const openPetPicker = useCallback(() => {
    if (pets.length === 0) {
      navigation.navigate('PetsTab', { screen: 'PetProfile' });
      return;
    }
    setPetPickerOpen(true);
  }, [navigation, pets.length]);

  const onPickPet = useCallback(
    (pet: Pet) => {
      void (async () => {
        await setActivePet(pet.id);
        requestDashboardRefresh();
        setPetPickerOpen(false);
      })();
    },
    [requestDashboardRefresh, setActivePet],
  );

  const goManagePets = useCallback(() => {
    setPetPickerOpen(false);
    navigation.navigate('PetsTab', { screen: 'PetSwitcher' });
  }, [navigation]);

  const orbitLayout = useMemo(() => {
    const n = pets.length;
    if (n === 0) {
      return [];
    }
    const cx = winW / 2;
    const cy = fabCenterY;
    const orbitR = Math.min(winW * 0.26, 72 + n * 11);
    const spread = Math.min(1.18 * Math.PI, Math.PI * 0.4 + Math.max(0, n - 1) * 0.15);
    const startAngle = -Math.PI / 2 - spread / 2;
    return Array.from({ length: n }, (_, i) => {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const angle = startAngle + t * spread;
      const ax = cx + orbitR * Math.cos(angle);
      const ay = cy + orbitR * Math.sin(angle);
      return {
        left: ax - ORBIT_ITEM_WIDTH / 2,
        top: ay - ORBIT_AVATAR / 2 - spacing.sm,
      };
    });
  }, [pets.length, winW, fabCenterY, spacing.sm]);

  useEffect(() => {
    if (!petPickerOpen || pets.length === 0) {
      backdropOpac.setValue(0);
      return;
    }
    const arr = bubbleAnimsRef.current;
    while (arr.length < pets.length) {
      arr.push(new Animated.Value(0));
    }
    const active = arr.slice(0, pets.length);
    active.forEach(a => a.setValue(0));
    backdropOpac.setValue(0);
    Animated.parallel([
      Animated.timing(backdropOpac, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.stagger(
        52,
        active.map(v =>
          Animated.spring(v, {
            toValue: 1,
            friction: 7,
            tension: 92,
            useNativeDriver: true,
          }),
        ),
      ),
    ]).start();
  }, [petPickerOpen, pets.length, backdropOpac]);

  const radialStyles = useMemo(
    () =>
      StyleSheet.create({
        modalRoot: {
          flex: 1,
        },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0,0,0,0.5)',
        },
        orbitLayer: {
          ...StyleSheet.absoluteFillObject,
        },
        closeFab: {
          position: 'absolute',
          top: Math.max(insets.top, spacing.md) + spacing.sm,
          right: spacing.lg,
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.borderSubtle,
        },
        hint: {
          position: 'absolute',
          left: spacing.lg,
          right: spacing.lg,
          alignItems: 'center',
        },
        manageChip: {
          marginTop: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: radius.round,
          backgroundColor: colors.primaryLight,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.borderSubtle,
        },
        avatarWrap: {
          width: ORBIT_AVATAR,
          height: ORBIT_AVATAR,
          borderRadius: ORBIT_AVATAR / 2,
          alignItems: 'center',
          justifyContent: 'center',
        },
        avatarImg: {
          width: ORBIT_AVATAR - 4,
          height: ORBIT_AVATAR - 4,
          borderRadius: (ORBIT_AVATAR - 4) / 2,
          resizeMode: 'cover',
        },
        activeRing: {
          borderWidth: 3,
          borderColor: colors.accent,
        },
        checkDot: {
          position: 'absolute',
          bottom: -2,
          right: -2,
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: colors.surface,
        },
      }),
    [
      colors.accent,
      colors.borderSubtle,
      colors.primaryLight,
      colors.surface,
      insets.top,
      radius.round,
      spacing,
    ],
  );

  const fabShadow = shadows.lg;
  const fabTranslateY = fabLift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  return (
    <>
    <View
      style={[
        styles.shell,
        {
          height: shellHeight,
          paddingBottom: bottomPad + TAB_BAR_FLOAT_GAP,
          paddingHorizontal: TAB_BAR_HORIZONTAL_INSET,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.islandWrap, Platform.OS === 'ios' ? shadows.lg : null]}>
        {/* Soft drop shadow follows the scoop silhouette */}
        <Svg
          width={islandWidth}
          height={BAR_HEIGHT}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <G transform="translate(0, 2.5)">
            <Path d={shellPath} fill={colors.shadow} />
          </G>
        </Svg>
        {/* Frosted glass: backdrop blur clipped to the notched island */}
        {skShellPath != null ? (
          <Canvas
            style={{ width: islandWidth, height: BAR_HEIGHT }}
            pointerEvents="none"
          >
            <BackdropBlur blur={22} clip={skShellPath}>
              <Fill color={colors.tabBarGlass} />
            </BackdropBlur>
            <SkiaPath
              path={skShellPath}
              color={colors.tabBarGlassBorder}
              style="stroke"
              strokeWidth={1.25}
            />
          </Canvas>
        ) : (
          <Svg
            width={islandWidth}
            height={BAR_HEIGHT}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            <Path d={shellPath} fill={colors.tabBarGlass} />
            <Path
              d={shellPath}
              fill="none"
              stroke={colors.tabBarGlassBorder}
              strokeWidth={1.25}
            />
          </Svg>
        )}

        <View
          ref={barRowRef}
          style={[styles.barRow, { height: BAR_HEIGHT }]}
        >
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: (BAR_HEIGHT - PILL_SIZE) / 2,
              left: 0,
              width: PILL_SIZE,
              height: PILL_SIZE,
              borderRadius: PILL_SIZE / 2,
              backgroundColor: colors.primaryLight,
              opacity: pillOpacity,
              transform: [{ translateX: pillX }, { scale: pillScale }],
            }}
          />
          <View style={styles.side}>
            <TabSlot
              accessibilityLabel="Home"
              icon="home"
              active={currentKey === 'home'}
              onPress={() => jumpToTabRoot('HomeTab')}
              colors={colors}
              onCenterMeasured={(pageX, width) => onTabCenter(HOME_SIDE_INDEX, pageX, width)}
            />
            <TabSlot
              accessibilityLabel="Health records"
              icon="monitor_heart"
              active={currentKey === 'health'}
              onPress={() => jumpToTabRoot('HealthTab')}
              colors={colors}
              onCenterMeasured={(pageX, width) => onTabCenter(HEALTH_SIDE_INDEX, pageX, width)}
            />
          </View>

          <View style={styles.fabGap} />

          <View style={styles.side}>
            <TabSlot
              accessibilityLabel="Wellness"
              icon="analytics"
              active={currentKey === 'notifications'}
              onPress={() => jumpToTabRoot('NotificationsTab')}
              colors={colors}
              onCenterMeasured={(pageX, width) =>
                onTabCenter(NOTIFICATIONS_SIDE_INDEX, pageX, width)
              }
            />
            <TabSlot
              accessibilityLabel="Settings"
              icon="settings"
              active={currentKey === 'settings'}
              onPress={() => jumpToTabRoot('SettingsTab')}
              colors={colors}
              onCenterMeasured={(pageX, width) => onTabCenter(SETTINGS_SIDE_INDEX, pageX, width)}
            />
          </View>
        </View>
      </View>

      <View style={styles.fabLayer}>
        <Animated.View
          style={[
            { transform: [{ translateY: fabTranslateY }] },
          ]}
        >
          <Animated.View
            style={[
              styles.fabLift,
              { transform: [{ scale: fabScale }] },
              fabShadow,
            ]}
          >
            <Pressable
              style={[
                styles.fabButton,
                { backgroundColor: colors.accent },
                currentKey === 'pets' && styles.fabButtonActive,
              ]}
              onPress={() => jumpToTabRoot('PetsTab')}
              onLongPress={openPetPicker}
              delayLongPress={380}
              onPressIn={() => animateFabPress(true)}
              onPressOut={() => animateFabPress(false)}
              accessibilityRole="button"
              accessibilityLabel="Pets"
              accessibilityHint="Tap to open pet profile. Long press to switch pets."
              accessibilityState={{ selected: currentKey === 'pets' }}
              android_ripple={{
                color: 'rgba(255,255,255,0.35)',
                borderless: true,
                radius: FAB_SIZE / 2,
              }}
            >
              <icons.paws width={32} height={32} />
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </View>

    <Modal
      visible={petPickerOpen}
      transparent
      animationType="none"
      onRequestClose={closePetPicker}
    >
      <View style={radialStyles.modalRoot}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={closePetPicker}
          accessibilityRole="button"
          accessibilityLabel="Close pet picker"
        >
          <Animated.View
            pointerEvents="none"
            style={[radialStyles.backdrop, { opacity: backdropOpac }]}
          />
        </Pressable>

        <View style={radialStyles.orbitLayer} pointerEvents="box-none">
          <View
            style={[
              radialStyles.hint,
              { top: Math.max(insets.top + spacing.md, fabCenterY - 168) },
            ]}
            pointerEvents="none"
          >
            <AppText
              style={[
                textStyles.subtitle,
                {
                  color: colors.text.inverse,
                  fontFamily: fontFamilies.bold,
                  textAlign: 'center',
                  textShadowColor: 'rgba(0,0,0,0.35)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 4,
                },
              ]}
            >
              Who are you caring for?
            </AppText>
            <AppText
              style={[
                textStyles.caption,
                {
                  color: 'rgba(255,255,255,0.88)',
                  fontFamily: fontFamilies.medium,
                  textAlign: 'center',
                  marginTop: spacing.xs,
                },
              ]}
            >
              Tap a profile to switch
            </AppText>
          </View>

          <Pressable
            style={radialStyles.closeFab}
            onPress={closePetPicker}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <MaterialIcon name="close" size={20} color={colors.text.heading} />
          </Pressable>

          {pets.map((pet, i) => {
            const pos = orbitLayout[i];
            if (pos == null) {
              return null;
            }
            const arr = bubbleAnimsRef.current;
            while (arr.length <= i) {
              arr.push(new Animated.Value(0));
            }
            const bubbleAnim = arr[i]!;
            const isActive = activePet?.id === pet.id;
            const scale = bubbleAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 1],
            });
            const opacity = bubbleAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            });
            const avatarSource = resolvePetAvatarSource(pet);
            return (
              <Animated.View
                key={pet.id}
                style={[
                  {
                    position: 'absolute',
                    left: pos.left,
                    top: pos.top,
                    width: ORBIT_ITEM_WIDTH,
                    alignItems: 'center',
                  },
                  { opacity, transform: [{ scale }] },
                ]}
              >
                <Pressable
                  onPress={() => onPickPet(pet)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${pet.name}`}
                  accessibilityState={{ selected: isActive }}
                  style={{ alignItems: 'center' }}
                >
                  <View
                    style={[
                      radialStyles.avatarWrap,
                      shadows.md,
                      isActive && radialStyles.activeRing,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <Image
                      source={avatarSource}
                      style={radialStyles.avatarImg}
                      accessibilityIgnoresInvertColors
                    />
                    {isActive ? (
                      <View style={radialStyles.checkDot}>
                        <MaterialIcon
                          name="check"
                          size={12}
                          color={colors.text.inverse}
                        />
                      </View>
                    ) : null}
                  </View>
                  <AppText
                    style={[
                      textStyles.caption,
                      {
                        color: colors.text.inverse,
                        fontFamily: fontFamilies.semibold,
                        textAlign: 'center',
                        marginTop: spacing.xs,
                        maxWidth: ORBIT_ITEM_WIDTH + 8,
                        textShadowColor: 'rgba(0,0,0,0.4)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 3,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {pet.name}
                  </AppText>
                </Pressable>
              </Animated.View>
            );
          })}

          <View
            style={[
              radialStyles.hint,
              {
                top: fabCenterY + 96,
              },
            ]}
            pointerEvents="box-none"
          >
            <Pressable
              style={radialStyles.manageChip}
              onPress={goManagePets}
              accessibilityRole="button"
              accessibilityLabel="Manage all pets"
            >
              <AppText
                style={[
                  textStyles.caption,
                  { color: colors.accent, fontFamily: fontFamilies.bold },
                ]}
              >
                Manage all pets
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
};

const createStyles = () =>
  StyleSheet.create({
    shell: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'visible',
      justifyContent: 'flex-end',
    },
    islandWrap: {
      borderRadius: DEFAULT_TAB_BAR_CORNER_RADIUS,
      overflow: 'visible',
      backgroundColor: 'transparent',
    },
    barRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      overflow: 'visible',
    },
    side: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'center',
    },
    fabGap: {
      width: DEFAULT_TAB_BAR_SCOOP_RADIUS * 2,
    },
    fabLayer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: FAB_BOTTOM_OFFSET,
      alignItems: 'center',
      pointerEvents: 'box-none',
    },
    fabLift: {
      borderRadius: FAB_SIZE / 2,
    },
    fabButton: {
      width: FAB_SIZE,
      height: FAB_SIZE,
      borderRadius: FAB_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fabButtonActive: {
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.9)',
    },
  });
