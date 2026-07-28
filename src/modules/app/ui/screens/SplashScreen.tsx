import React, { useEffect, useMemo, useState } from 'react';
import { Animated, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_VERSION_LABEL } from '../../../../shared/constants/appMeta';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { SplashBrandSection } from '../components/splash/SplashBrandSection';
import { SplashLoadingSection } from '../components/splash/SplashLoadingSection';
import { createSplashScreenStyles } from './SplashScreen.styles';

const SPLASH_MOTION = {
  progress: { target: 0.4, durationMs: 1000, steps: 32 },
  logoFloat: { amplitude: 4, durationMs: 900 },
  logoPulse: { minOpacity: 0.5, maxOpacity: 0.95, durationMs: 900 },
  decor: { durationMs: 1500 },
  logoSpring: {
    peakScale: 1.16,
    speedUp: 16,
    bouncinessUp: 12,
    speedDown: 14,
    bouncinessDown: 8,
  },
} as const;

const SPLASH_DECOR_OPACITY = {
  top: { min: 0.6, max: 1 },
  bottom: { min: 0.75, max: 1 },
} as const;

export const SplashScreen: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const styles = useMemo(
    () => createSplashScreenStyles(colors),
    [colors],
  );

  const [progress, setProgress] = useState(0);
  const logoScale = React.useRef(new Animated.Value(1)).current;
  const logoFloatY = React.useRef(new Animated.Value(0)).current;
  const logoPulse = React.useRef(new Animated.Value(0.55)).current;
  const decorFloat = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const { target, durationMs, steps } = SPLASH_MOTION.progress;
    const intervalMs = durationMs / steps;
    let currentStep = 0;

    const { amplitude, durationMs: floatMs } = SPLASH_MOTION.logoFloat;
    const {
      minOpacity,
      maxOpacity,
      durationMs: pulseMs,
    } = SPLASH_MOTION.logoPulse;
    const { durationMs: decorMs } = SPLASH_MOTION.decor;

    const loopFloat = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloatY, {
          toValue: -amplitude,
          duration: floatMs,
          useNativeDriver: true,
        }),
        Animated.timing(logoFloatY, {
          toValue: amplitude,
          duration: floatMs,
          useNativeDriver: true,
        }),
      ]),
    );

    const loopPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: maxOpacity,
          duration: pulseMs,
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: minOpacity,
          duration: pulseMs,
          useNativeDriver: true,
        }),
      ]),
    );

    const loopDecor = Animated.loop(
      Animated.sequence([
        Animated.timing(decorFloat, {
          toValue: 1,
          duration: decorMs,
          useNativeDriver: true,
        }),
        Animated.timing(decorFloat, {
          toValue: 0,
          duration: decorMs,
          useNativeDriver: true,
        }),
      ]),
    );

    loopFloat.start();
    loopPulse.start();
    loopDecor.start();

    const intervalId = setInterval(() => {
      currentStep += 1;
      const next = Math.min(target, (currentStep / steps) * target);
      setProgress(next);

      if (next >= target) {
        clearInterval(intervalId);
        const spring = SPLASH_MOTION.logoSpring;
        Animated.sequence([
          Animated.spring(logoScale, {
            toValue: spring.peakScale,
            useNativeDriver: true,
            speed: spring.speedUp,
            bounciness: spring.bouncinessUp,
          }),
          Animated.spring(logoScale, {
            toValue: 1,
            useNativeDriver: true,
            speed: spring.speedDown,
            bounciness: spring.bouncinessDown,
          }),
        ]).start();
      }
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
      loopFloat.stop();
      loopPulse.stop();
      loopDecor.stop();
    };
  }, [decorFloat, logoFloatY, logoPulse, logoScale]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.backgroundAlt}
      />

      <View style={styles.main}>
        <View style={styles.topSection}>
          <SplashBrandSection
            title="Pawsoul"
            subtitle="Fetching your pet's world"
            iconAnimatedStyle={{
              transform: [{ scale: logoScale }, { translateY: logoFloatY }],
            }}
            iconPulseStyle={{ opacity: logoPulse }}
          />
        </View>

        <View style={styles.bottomSection}>
          <SplashLoadingSection
            progress={progress}
            label="Preparing your pet's dashboard..."
            version={APP_VERSION_LABEL}
          />
        </View>

        <Animated.View
          style={[
            styles.decorTop,
            {
              opacity: decorFloat.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  SPLASH_DECOR_OPACITY.top.min,
                  SPLASH_DECOR_OPACITY.top.max,
                ],
              }),
              transform: [
                {
                  translateY: decorFloat.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -8],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.decorBottom,
            {
              opacity: decorFloat.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  SPLASH_DECOR_OPACITY.bottom.min,
                  SPLASH_DECOR_OPACITY.bottom.max,
                ],
              }),
              transform: [
                {
                  translateY: decorFloat.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 8],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    </SafeAreaView>
  );
};

export default SplashScreen;
