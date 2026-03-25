import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppTabParamList } from '../types';
import { TAB_BAR_VISUAL_HEIGHT } from '../layout';
import { MaterialIcon } from '../../../shared/components/MaterialIcon';
import { useTheme } from '../../../shared/hooks/useTheme';
import type { Theme } from '../../../shared/hooks/useTheme';
import { icons } from '../../../shared/assets/icons';

export { TAB_BAR_VISUAL_HEIGHT as APP_TAB_BAR_HEIGHT } from '../layout';

type TabKey = 'home' | 'health' | 'reminder' | 'settings' | 'pets';

const FAB_SIZE = 58;
const FAB_BOTTOM = 28;
const BAR_ROW_MIN_HEIGHT = 56;

type TabIconName =
  | 'home'
  | 'monitor_heart'
  | 'stethoscope'
  | 'notifications'
  | 'schedule'
  | 'settings';

function tabKeyFromRouteName(name: keyof AppTabParamList | string): TabKey {
  switch (name) {
    case 'HomeTab':
      return 'home';
    case 'HealthTab':
      return 'health';
    case 'RemindersTab':
      return 'reminder';
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
    gap: 2,
    minWidth: 64,
    maxWidth: 86,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
  },
  navLabel: {
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
  },
  navLabelActive: {
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
  },
  navLabelCompact: {
    fontSize: 9,
    lineHeight: 11,
  },
});

interface TabSlotProps {
  label: string;
  accessibilityLabel: string;
  icon: TabIconName;
  active: boolean;
  onPress: () => void;
  compactLabel?: boolean;
  fontFamilies: ReturnType<typeof useTheme>['fontFamilies'];
  colors: Theme['colors'];
}

const TabSlot = React.memo(function TabSlot({
  label,
  accessibilityLabel,
  icon,
  active,
  onPress,
  compactLabel,
  fontFamilies,
  colors,
}: TabSlotProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const activePop = useRef(new Animated.Value(active ? 1 : 0)).current;

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
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
      style={itemStyles.tabHit}
    >
      <Animated.View
        style={[
          itemStyles.tabChip,
          {
            transform: [{ scale }],
            backgroundColor: active ? colors.primaryLight : 'transparent',
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
        <Text
          style={[
            active ? itemStyles.navLabelActive : itemStyles.navLabel,
            compactLabel && itemStyles.navLabelCompact,
            {
              fontFamily: active ? fontFamilies.bold : fontFamilies.medium,
              color: active ? colors.accent : colors.text.subdued,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

export const PawTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const { fontFamilies, colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(), []);

  const bottomPad = Math.max(insets.bottom, Platform.OS === 'ios' ? 6 : 4);
  const shellHeight = TAB_BAR_VISUAL_HEIGHT + bottomPad;

  const currentRoute = state.routes[state.index];
  const currentKey = tabKeyFromRouteName(currentRoute.name);

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
    switch (name) {
      case 'HomeTab':
        navigation.navigate('HomeTab', { screen: 'Home' });
        break;
      case 'HealthTab':
        navigation.navigate('HealthTab', { screen: 'HealthRecords' });
        break;
      case 'RemindersTab':
        navigation.navigate('RemindersTab', { screen: 'ReminderList' });
        break;
      case 'SettingsTab':
        navigation.navigate('SettingsTab', { screen: 'Settings' });
        break;
      case 'PetsTab':
        navigation.navigate('PetsTab', { screen: 'PetProfile' });
        break;
      default:
        break;
    }
  };

  const fabShadow = shadows.lg;
  const fabTranslateY = fabLift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  return (
    <View
      style={[
        styles.shell,
        {
          height: shellHeight,
          paddingBottom: bottomPad,
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.borderSubtle,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.barRow, { minHeight: BAR_ROW_MIN_HEIGHT }]}>
        <View style={styles.side}>
          <TabSlot
            label="Home"
            accessibilityLabel="Home"
            icon="home"
            active={currentKey === 'home'}
            onPress={() => jumpToTabRoot('HomeTab')}
            fontFamilies={fontFamilies}
            colors={colors}
          />
          <TabSlot
            label="Health Records"
            accessibilityLabel="Health records"
            icon="monitor_heart"
            active={currentKey === 'health'}
            onPress={() => jumpToTabRoot('HealthTab')}
            compactLabel
            fontFamilies={fontFamilies}
            colors={colors}
          />
        </View>

        <View style={styles.fabGap} />

        <View style={styles.side}>
          <TabSlot
            label="Reminder"
            accessibilityLabel="Reminders"
            icon="schedule"
            active={currentKey === 'reminder'}
            onPress={() => jumpToTabRoot('RemindersTab')}
            fontFamilies={fontFamilies}
            colors={colors}
          />
          <TabSlot
            label="Settings"
            accessibilityLabel="Settings"
            icon="settings"
            active={currentKey === 'settings'}
            onPress={() => jumpToTabRoot('SettingsTab')}
            fontFamilies={fontFamilies}
            colors={colors}
          />
        </View>
      </View>

      <View
        style={[styles.fabLayer, { paddingBottom: FAB_BOTTOM }]}
        pointerEvents="box-none"
      >
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
              onPressIn={() => animateFabPress(true)}
              onPressOut={() => animateFabPress(false)}
              accessibilityRole="button"
              accessibilityLabel="Pets"
              accessibilityHint="Opens pet profiles. Add or switch pets from there."
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
      borderTopWidth: StyleSheet.hairlineWidth,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.07,
          shadowRadius: 12,
        },
        android: {
          elevation: 12,
        },
        default: {},
      }),
    },
    barRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      paddingTop: 4,
    },
    side: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'flex-end',
    },
    fabGap: {
      width: FAB_SIZE + 14,
    },
    fabLayer: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'flex-end',
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
