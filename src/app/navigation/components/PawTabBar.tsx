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
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppTabParamList } from '../types';
import {
  TAB_BAR_FLOAT_GAP,
  TAB_BAR_HORIZONTAL_INSET,
  TAB_BAR_VISUAL_HEIGHT,
} from '../layout';
import { useHomeDashboardStore } from '../../../modules/app/store/homeDashboardStore';
import {
  selectUnreadVisibleCount,
  useNotificationFeedStore,
} from '../../../modules/notifications/store/notificationFeedStore';
import type { Pet } from '../../../modules/pets/domain/models/Pet';
import { usePetStore } from '../../../modules/pets/store/petStore';
import { AppText } from '../../../shared/components/AppText';
import { MaterialIcon } from '../../../shared/components/MaterialIcon';
import { useTheme, type Theme } from '../../../shared/hooks/useTheme';
import { fontSizes, lineHeights } from '../../../shared/theme/typography';
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
  getTabBarFabGapWidth,
} from './pawTabBarShellPath';
import {
  SIDE_TAB_ORDER,
  isSideTabActive,
  pillTranslateX,
  sideTabIndex,
} from './pawTabBarMotion';
import {
  SmoothTabIcon,
  type SmoothTabGlyph,
} from './SmoothTabIcon';
import { TabDelightBurst } from './TabDelightBurst';
import {
  resolvePetsNestedRoute,
  shouldHidePawTabBar,
} from './hidePawTabBar';
import { formatTabBadgeCount } from './tabBarBadge';

export { TAB_BAR_VISUAL_HEIGHT as APP_TAB_BAR_HEIGHT } from '../layout';

type TabKey = 'home' | 'health' | 'notifications' | 'settings' | 'pets';

const ORBIT_AVATAR = 52;
const ORBIT_ITEM_WIDTH = 76;
/** Sits on the icon well, not the label. */
const PILL_SIZE = 36;
const PILL_TOP = 4;
const TAB_MIN_HIT = 44;

const HOME_SIDE_INDEX = SIDE_TAB_ORDER.indexOf('home');
const HEALTH_SIDE_INDEX = SIDE_TAB_ORDER.indexOf('health');
const NOTIFICATIONS_SIDE_INDEX = SIDE_TAB_ORDER.indexOf('notifications');
const SETTINGS_SIDE_INDEX = SIDE_TAB_ORDER.indexOf('settings');

type TabIconName = SmoothTabGlyph;

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
  friction: 5,
  tension: 420,
  useNativeDriver: true as const,
};

const springRelease = {
  friction: 6,
  tension: 300,
  useNativeDriver: true as const,
};

const itemStyles = StyleSheet.create({
  tabHit: {
    flex: 1,
    minWidth: TAB_MIN_HIT,
    minHeight: TAB_MIN_HIT,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tabChip: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    paddingBottom: 4,
    overflow: 'visible',
  },
  iconWell: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  activeGlow: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  delightClip: {
    position: 'absolute',
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  label: {
    marginTop: 2,
    fontSize: fontSizes.xxs,
    lineHeight: lineHeights.xxs,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: fontSizes.xxs,
    lineHeight: lineHeights.xxs,
    textAlign: 'center',
  },
});

interface TabSlotProps {
  label: string;
  accessibilityLabel: string;
  icon: TabIconName;
  active: boolean;
  onPress: () => void;
  colors: Theme['colors'];
  fontFamilies: Theme['fontFamilies'];
  badgeCount?: number;
  onCenterMeasured?: (pageX: number, width: number) => void;
}

const TabSlot = React.memo(function TabSlot({
  label,
  accessibilityLabel,
  icon,
  active,
  onPress,
  colors,
  fontFamilies,
  badgeCount = 0,
  onCenterMeasured,
}: TabSlotProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const activePop = useRef(new Animated.Value(active ? 1 : 0)).current;
  const bounce = useRef(new Animated.Value(1)).current;
  const iconSpin = useRef(new Animated.Value(0)).current;
  const iconWellRef = useRef<View>(null);
  const wasActive = useRef(active);
  const [burstToken, setBurstToken] = useState(0);
  const badgeText = formatTabBadgeCount(badgeCount);

  const pressIn = () => {
    Animated.spring(scale, { ...springPress, toValue: 0.88 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { ...springRelease, toValue: 1 }).start();
  };

  useEffect(() => {
    Animated.timing(activePop, {
      toValue: active ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();

    if (active && !wasActive.current) {
      setBurstToken(token => token + 1);
      bounce.setValue(0.82);
      Animated.spring(bounce, {
        toValue: 1,
        friction: 4.5,
        tension: 300,
        useNativeDriver: true,
      }).start();

      if (icon === 'settings' || icon === 'wellness') {
        iconSpin.setValue(0);
        Animated.timing(iconSpin, {
          toValue: 1,
          duration: icon === 'settings' ? 520 : 360,
          useNativeDriver: true,
        }).start();
      }
    }
    wasActive.current = active;
  }, [active, activePop, bounce, icon, iconSpin]);

  const activeOpacity = activePop;
  const inactiveOpacity = activePop.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const iconPopScale = activePop.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const spinDeg = iconSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', icon === 'settings' ? '120deg' : '8deg'],
  });

  const delightColor =
    icon === 'favorite'
      ? colors.danger
      : icon === 'wellness'
        ? colors.success
        : colors.accent;

  return (
    <Pressable
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      style={itemStyles.tabHit}
      testID={`paw-tab-slot-${label.toLowerCase()}`}
    >
      <Animated.View
        style={[
          itemStyles.tabChip,
          {
            transform: [{ scale }],
          },
        ]}
      >
        <View style={itemStyles.delightClip} pointerEvents="none">
          <TabDelightBurst
            glyph={icon}
            playToken={burstToken}
            color={delightColor}
          />
        </View>
        <Animated.View
          style={{
            transform: [
              { scale: Animated.multiply(iconPopScale, bounce) },
              { rotate: spinDeg },
            ],
          }}
        >
          <View
            ref={iconWellRef}
            onLayout={() => {
              iconWellRef.current?.measureInWindow((x, _y, width) => {
                onCenterMeasured?.(x, width);
              });
            }}
            style={itemStyles.iconWell}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                itemStyles.activeGlow,
                {
                  backgroundColor: colors.brandTint12,
                  opacity: activeOpacity,
                },
              ]}
            />
            <Animated.View
              style={{
                position: 'absolute',
                opacity: activeOpacity,
              }}
            >
              <SmoothTabIcon
                name={icon}
                active
                size={24}
                color={colors.onAccent}
              />
            </Animated.View>
            <Animated.View
              style={{
                position: 'absolute',
                opacity: inactiveOpacity,
              }}
            >
              <SmoothTabIcon
                name={icon}
                active={false}
                size={24}
                color={colors.text.secondary}
              />
            </Animated.View>
            {badgeText != null ? (
              <View
                style={[
                  itemStyles.badge,
                  {
                    backgroundColor: colors.danger,
                    borderColor: colors.tabBarGlass,
                  },
                ]}
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
                <AppText
                  style={[
                    itemStyles.badgeText,
                    {
                      color: colors.onAccent,
                      fontFamily: fontFamilies.bold,
                    },
                  ]}
                >
                  {badgeText}
                </AppText>
              </View>
            ) : null}
          </View>
        </Animated.View>
        <AppText
          numberOfLines={1}
          style={[
            itemStyles.label,
            {
              color: active ? colors.text.heading : colors.text.secondary,
              fontFamily: active ? fontFamilies.bold : fontFamilies.medium,
            },
          ]}
        >
          {label}
        </AppText>
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
  const unreadCount = useNotificationFeedStore(s =>
    selectUnreadVisibleCount(s.itemsById),
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
  const fabActiveBoost = useRef(
    new Animated.Value(currentKey === 'pets' ? 1 : 0),
  ).current;
  const prevTabRef = useRef<TabKey>(currentKey);
  const [pawBurstToken, setPawBurstToken] = useState(0);

  useEffect(() => {
    Animated.spring(fabActiveBoost, {
      toValue: currentKey === 'pets' ? 1 : 0,
      friction: 6,
      tension: 220,
      useNativeDriver: true,
    }).start();
  }, [currentKey, fabActiveBoost]);

  useEffect(() => {
    if (currentKey === 'pets' && prevTabRef.current !== 'pets') {
      setPawBurstToken(token => token + 1);
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
      fabScale.setValue(0.86);
      Animated.spring(fabScale, {
        toValue: 1,
        friction: 4,
        tension: 280,
        useNativeDriver: true,
      }).start();
    }
    prevTabRef.current = currentKey;
  }, [currentKey, fabLift, fabScale]);

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
          ...StyleSheet.absoluteFill,
          backgroundColor: 'rgba(0,0,0,0.5)',
        },
        orbitLayer: {
          ...StyleSheet.absoluteFill,
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
  const fabActiveScale = fabActiveBoost.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const petsTabActive = currentKey === 'pets';
  const careA11yLabel =
    unreadCount > 0 ? `Care, ${unreadCount} unread` : 'Care';

  const nestedPetsRoute = resolvePetsNestedRoute(
    currentRoute.name === 'PetsTab' ? currentRoute : undefined,
  );
  if (shouldHidePawTabBar(nestedPetsRoute)) {
    return null;
  }

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
      <View
        style={[
          styles.islandWrap,
          { height: BAR_HEIGHT, width: islandWidth },
          Platform.OS === 'ios' ? shadows.md : null,
        ]}
        pointerEvents="box-none"
      >
        {/* Dense frosted island — SVG fill only (no live BackdropBlur; that
            re-sampled scrolling content every frame and felt laggy). */}
        <Svg
          width={islandWidth}
          height={BAR_HEIGHT}
          style={styles.islandLayer}
          pointerEvents="none"
        >
          <Path d={shellPath} fill={colors.tabBarGlass} />
          <Path
            d={shellPath}
            fill="none"
            stroke={colors.tabBarGlassBorder}
            strokeWidth={1}
          />
        </Svg>

        <View
          ref={barRowRef}
          style={[styles.barRow, { height: BAR_HEIGHT }]}
        >
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: PILL_TOP,
              left: 0,
              width: PILL_SIZE,
              height: PILL_SIZE,
              borderRadius: PILL_SIZE / 2,
              backgroundColor: colors.primary,
              opacity: pillOpacity,
              transform: [{ translateX: pillX }, { scale: pillScale }],
            }}
          />
          <View style={styles.side}>
            <TabSlot
              label="Home"
              accessibilityLabel="Home"
              icon="home"
              active={currentKey === 'home'}
              onPress={() => jumpToTabRoot('HomeTab')}
              colors={colors}
              fontFamilies={fontFamilies}
              onCenterMeasured={(pageX, width) => onTabCenter(HOME_SIDE_INDEX, pageX, width)}
            />
            <TabSlot
              label="Health"
              accessibilityLabel="Health records"
              icon="favorite"
              active={currentKey === 'health'}
              onPress={() => jumpToTabRoot('HealthTab')}
              colors={colors}
              fontFamilies={fontFamilies}
              onCenterMeasured={(pageX, width) => onTabCenter(HEALTH_SIDE_INDEX, pageX, width)}
            />
          </View>

          <View style={styles.fabGap} pointerEvents="none" />

          <View style={styles.side}>
            <TabSlot
              label="Care"
              accessibilityLabel={careA11yLabel}
              icon="wellness"
              active={currentKey === 'notifications'}
              onPress={() => jumpToTabRoot('NotificationsTab')}
              colors={colors}
              fontFamilies={fontFamilies}
              badgeCount={unreadCount}
              onCenterMeasured={(pageX, width) =>
                onTabCenter(NOTIFICATIONS_SIDE_INDEX, pageX, width)
              }
            />
            <TabSlot
              label="Settings"
              accessibilityLabel="Settings"
              icon="settings"
              active={currentKey === 'settings'}
              onPress={() => jumpToTabRoot('SettingsTab')}
              colors={colors}
              fontFamilies={fontFamilies}
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
              {
                transform: [
                  { scale: Animated.multiply(fabScale, fabActiveScale) },
                ],
              },
              fabShadow,
            ]}
          >
            <View style={styles.fabBurstWrap} pointerEvents="box-none">
              <TabDelightBurst
                glyph="pets"
                playToken={pawBurstToken}
                color={colors.onAccent}
              />
              <Pressable
                style={[
                  styles.fabButton,
                  { backgroundColor: colors.accent },
                  petsTabActive && [
                    styles.fabButtonActive,
                    { borderColor: colors.onAccent },
                  ],
                ]}
                onPress={() => jumpToTabRoot('PetsTab')}
                onLongPress={openPetPicker}
                delayLongPress={380}
                onPressIn={() => animateFabPress(true)}
                onPressOut={() => animateFabPress(false)}
                accessibilityRole="button"
                accessibilityLabel="Pets"
                accessibilityHint="Tap to open pet profile. Long press to switch pets."
                accessibilityState={{ selected: petsTabActive }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                android_ripple={{
                  color: 'rgba(255,255,255,0.35)',
                  borderless: true,
                  radius: FAB_SIZE / 2,
                }}
              >
                <icons.paws width={32} height={32} />
              </Pressable>
            </View>
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
      overflow: 'visible',
      backgroundColor: 'transparent',
      alignSelf: 'center',
    },
    islandLayer: {
      ...StyleSheet.absoluteFill,
    },
    barRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 10,
      overflow: 'visible',
      zIndex: 1,
    },
    side: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'center',
    },
    fabGap: {
      width: getTabBarFabGapWidth(),
    },
    fabLayer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: FAB_BOTTOM_OFFSET,
      alignItems: 'center',
      // Above barRow (zIndex 1) so the scoop gap cannot steal FAB presses.
      zIndex: 5,
      pointerEvents: 'box-none',
    },
    fabLift: {
      borderRadius: FAB_SIZE / 2,
    },
    fabBurstWrap: {
      width: FAB_SIZE + 56,
      height: FAB_SIZE + 56,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
    },
    fabButton: {
      width: FAB_SIZE,
      height: FAB_SIZE,
      borderRadius: FAB_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fabButtonActive: {
      borderWidth: 3,
    },
  });
